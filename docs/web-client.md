# Web Client (SPA)

The browser client is served directly by the NestJS server for a smooth, zero-config experience.

- Web client: http://localhost:3000/
- REST API: http://localhost:3000/api

## Authentication

Enter a username to authenticate. A player entity is created and placed into the starting room.

Starting room resolution:
- Prefer `MUD_DEFAULT_ROOM_ID` when it matches a loaded room.
- Otherwise, fall back to the first room in the loaded content.

## Commands

- `look` / `l` — Show current room description (real world data: exits, items, NPCs).
- Movement — `north|south|east|west|up|down` and aliases like `n`, `s`, `e`, `u` or `go <direction>`.
- `say <message>` — Local room chat.
- `chat <message>` — Global chat.
- `talk <npc>` — Start a conversation with an NPC. While in dialogue, just type the choice number or text; use `leave` to exit.
- `who` — Online players.
- `clear` — Clear screen (telnet ANSI).
- `quit` — Disconnect.

## ANSI Handling

- The web client strips ANSI escape sequences automatically when rendering messages.
- Telnet output remains ANSI-rich for terminal clients.

## Troubleshooting

- If you see raw ANSI in the browser, ensure you’re using the built-in web client or strip ANSI where you render text.
- If you spawn in an unexpected room, check `MUD_DEFAULT_ROOM_ID` and verify that room exists in your world content.
- If dialogue seems unresponsive, ensure you’re in dialogue mode (you’ll see choices printed) and type a number/text; use `leave` to exit and re‑`talk` the NPC.

## Presence and Room Visibility

- Room descriptions show other players by username and exclude yourself.
- You’ll see notifications when players enter or leave your current room.
