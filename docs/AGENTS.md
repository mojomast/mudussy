# Agent Guide: Adding Features Quickly

This guide helps automated coding agents and contributors navigate the codebase fast and implement changes safely.

## TL;DR: 10‑minute codebase tour

- Orchestrator: `engine/core/engine.service.ts`
  - Wires modules, registers commands, subscribes to events, routes chat and room notifications.
- Networking (telnet): `engine/modules/networking/`
  - `telnet-server.ts`: sockets, prompt, session manager, command parser.
  - `command-parser.ts`: registers core commands; emits events like `player.move`, `EventTypes.PLAYER_MESSAGE`.
  - `ansi.ts`: `ColorScheme` and `prompt()`.
  - `session.ts`: session lifecycle and I/O.
- Web bridge: `server/networking/`
  - `websocket.gateway.ts`: Socket.IO plumbing.
  - `web-client.service.ts`: mirrors engine events to web clients; executes commands for SPA users.
- World: `engine/modules/world/world-manager.ts`
  - Rooms, players/NPCs in rooms, `getRoomDescription(roomId, viewerSessionId?)`.
- Persistence: `engine/modules/persistence/player-manager.ts`
  - Active players, lookups by session/username/playerId.
- Dialogue: `engine/modules/dialogue/`
  - `dialogue-commands.ts`, `dialogue-manager.ts`, `canned-branching-provider.ts`.
- Web client (SPA): `clients/index.html`, `clients/client.js`.

## Conventions that save you time

- Events
  - Use the `EventSystem` with `new GameEvent(eventType, source, target?, data?)`.
  - World room events use `target` as the player sessionId: `'world.room.entered'` and `'world.room.left'`.
- Chat routing
  - `EventTypes.PLAYER_MESSAGE` is handled centrally in `EngineService`.
  - `type: 'say'` → room‑local; `type: 'global'` → global broadcast. Don’t broadcast from TelnetServer.
- Room descriptions
  - Call `worldManager.getRoomDescription(roomId, viewerSessionId)` to show usernames and omit the viewer.
- Dialogue sub‑prompt
  - The `CommandParser` tracks dialogue mode per session (`enterDialogueMode/exitDialogueMode/isInDialogueMode`).
  - Telnet prompt shows `Dialogue>` in mode; `talk <npc>` enters mode; `leave` exits.
  - Web bridge emits “[Dialogue mode enabled/disabled]” and SPA shows a badge.

## Add a command fast

1. In `engine/modules/networking/command-parser.ts`, call `this.registerCommand({ command, aliases, description, handler })`.
2. Use `this.eventSystem.emit(new GameEvent('your.event', sessionId, undefined, { ... }))` to decouple.
3. Return a user string; TelnetServer prints it and re‑prompts automatically.

Example handler body:

```ts
handler: async (sessionId, args) => {
  this.eventSystem.emit(new GameEvent('feature.do', sessionId, undefined, { args }));
  return ColorScheme.success('Requested.');
}
```

If the command is feature‑scoped and you need `EngineService`, register via `engine.service.ts` using `registerNetworkCommand` during module init.

## Wire a new event

- Subscribe in the module that owns behavior (e.g., EngineService or WebClientService):

```ts
this.eventSystem.on('feature.done', (event) => {
  const sessionId = String(event.source);
  this.sendMessageToSession(sessionId, 'Done', 'system');
});
```

Avoid cross‑layer side‑effects in TelnetServer; prefer EngineService for routing, and WebClientService for web emissions.

## Touch points by feature type

- Movement/rooms: Command in `command-parser.ts` → emit `'player.move'` → handle in EngineService/WebClientService → call `worldManager.movePlayer()` and `getRoomDescription()`.
- Chat: Only emit `EventTypes.PLAYER_MESSAGE` from commands. EngineService handles fan‑out (room/global).
- Dialogue: Use `DialogueCommandHandlers`. For UX, leverage CommandParser’s dialogue mode and `leave` command.
- Web UI: Mirror behavior in `server/networking/web-client.service.ts` and, if needed, update `clients/client.js`.

## Build, run, validate (Windows PowerShell)

```powershell
npm run build
npm run server:dev
```

Quick checks:
- Telnet: Verify prompt changes and room notifications; try `say`, `chat`, `talk <npc>`, `leave`.
- Web: Open http://localhost:3000/, authenticate, verify the same flows and dialogue badge.

## Quality gates before PR

- Build: `npm run build` (no TS errors)
- Unit tests: `npm run test` (if you added tests)
- Lint: `npm run lint`
- Smoke: Start dev server, quick manual command checks

## Gotchas

- Do not broadcast `PLAYER_MESSAGE` in TelnetServer; EngineService owns routing.
- For room events, ensure `event.target` is the sessionId of the moving player.
- Always pass `viewerSessionId` to `getRoomDescription` to get usernames and hide the viewer.

## Minimal snippets

New event emission:

```ts
this.eventSystem.emit(new GameEvent('module.action', sessionId, targetId, { payload }));
```

Send to a telnet session:

```ts
engine.sendMessageToSession(sessionId, 'Text', 'system');
```

Broadcast excluding sender:

```ts
engine.broadcastMessage('Hello', 'broadcast', sessionId);
```

That’s it—stay event‑driven, keep routing in EngineService/WebClientService, and favor small, testable handlers.

## Content: Worlds, NPCs, Dialogue, Items (step‑by‑step)

Content lives under `engine/modules/world/content/`:

```
engine/modules/world/content/
├─ world.json                 # World config (start room, meta)
├─ sectors/                   # Areas with rooms and exits
│  ├─ town.json
│  ├─ forest.json
│  └─ castle.json
├─ npcs/                      # Individual NPC definitions (JSON)
│  ├─ blacksmith.json
│  ├─ gate-guard.json
│  └─ ...
└─ dialogue/                  # Dialogue trees + npc mapping
   ├─ npc-mappings.json       # Map NPC ids → dialogue tree ids
   ├─ blacksmith.yaml
   ├─ guard.yaml
   └─ ...
```

### Modify or add a Sector/Room

Files: `engine/modules/world/content/sectors/*.json`

- Structure (example keys; inspect existing sector files like `sectors/town.json`):
  - `id`, `name`, `description`
  - `rooms`: array of rooms with `id`, `name`, `description`, `exits`, `items`
  - `exits`: objects like `{ direction: "north", toRoomId: "eldoria:town_square", verbs: ["north"], ... }`
  - `items`: sector-level item definitions (objects with `id`, `name`, etc.)
- Steps:
  1. Copy an existing sector JSON as a template.
  2. Add/edit rooms and exits. Keep room ids namespaced: `namespace:roomId` (e.g., `eldoria:town_square`).
  3. Ensure graph connectivity (each exit’s destination exists; consider return exits).
  4. If adding a new default spawn room, set the env var `MUD_DEFAULT_ROOM_ID` to that room id.
- Verify:
  - Build, start server, `look` in the room, try moving using `north/east/...`.

### Add or update an NPC

Files: `engine/modules/world/content/npcs/*.json`

- Minimal format (see world README for full schema):
```json
{
  "id": "blacksmith",
  "name": "a sturdy blacksmith",
  "description": "Soot-stained apron...",
  "shortDescription": "blacksmith",
  "dialogueProvider": "canned-branching",
  "behaviors": ["merchant"],
  "stats": { "level": 6, "health": 110 },
  "spawnData": { "spawnRoomId": "town:blacksmith" }
}
```
- Steps:
  1. Create or edit the JSON under `content/npcs/`.
  2. Ensure `spawnRoomId` points to an existing room id.
  3. Optionally set `multiUserBehavior` and spawn/despawn conditions.
- Verify:
  - Start server, move to the room; you should see the NPC in `look` output.

### Connect NPC to a dialogue tree

Files: `engine/modules/world/content/dialogue/`

- Dialogue tree files: YAML (`*.yaml`) or JSON with nodes/choices.
- Map NPC ids to tree ids in `npc-mappings.json`:
```json
{
  "blacksmith": "blacksmith",
  "gate-guard": "guard"
}
```
- Steps:
  1. Create or edit `blacksmith.yaml` (tree id should match the file’s top-level `id`).
  2. Add mapping in `npc-mappings.json`: `"<npcId>": "<treeId>"`.
  3. Ensure the NPC JSON sets `dialogueProvider` (e.g., `canned-branching`).
- Verify:
  - In game: `talk blacksmith` → see choices; use numbers/text; `leave` to exit.

### Dialogue tree essentials (YAML)

```yaml
id: blacksmith
name: Blacksmith Dialogue
version: 1.0.0
startNodeId: greeting
variables: { greeted: false }
nodes:
  greeting:
    id: greeting
    npcMessage: |
      Eh? What do you want?
    choices:
      - id: "1"
        text: "Can you repair my gear?"
        nextNodeId: repair
  repair:
    id: repair
    npcMessage: "Let me see what you’ve got."
    isEnd: true
```

Tips:
- Use `variables` for local conversation state.
- Mark terminal nodes with `isEnd: true`.
- Conditions/actions are supported; see `engine/modules/dialogue/README.md` for full reference.

### Add or update items

In this repo, items are defined at the sector level and referenced by id in each room:

- Define items in the sector’s top-level `items` array (objects with `id`, `name`, `description`, etc.). See `sectors/town.json` for examples like `wooden_cup`, `pipe`, `town_fountain`.
- Reference items in a room by id via the room’s `items` array, e.g. `"items": ["town_fountain"]`.
- Verify with `look` in the room.

### World configuration

File: `engine/modules/world/content/world.json`

- Lists which sector and npc files to load. It does not set the starting room.
- The preferred starting room is configured via the `MUD_DEFAULT_ROOM_ID` environment variable (e.g., `eldoria:tavern`). If unset/invalid, the first loaded room is used.

See also: `engine/modules/world/README.md` and `docs/content-generation-guide.md` for full schema and advanced topics.

### Validation & smoke tests

1. `npm run build`
2. `npm run server:dev`
3. Web client: http://localhost:3000/
   - Auth, `look`, move through exits, confirm NPC presence and dialogue
4. Telnet: verify say/chat scoping and room enter/leave notifications
