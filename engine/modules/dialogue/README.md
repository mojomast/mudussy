# Dialogue System

A comprehensive NPC dialogue system for the MUD engine with support for branching conversations, variables, conditions, and persistence.

## Features

- **Multiple Dialogue Providers**: Support for canned conversations (YAML/JSON) and future AI providers
- **Branching Conversations**: Complex dialogue trees with conditional choices
- **Variable System**: Dynamic content based on player stats, quests, flags, and custom variables
- **Condition System**: Branch dialogue based on player state, time, random chance, etc.
- **State Persistence**: Conversations persist across sessions with automatic cleanup
- **Command Integration**: Talk, converse, and respond commands for natural interaction
- **NPC Integration**: Connect dialogue providers to NPCs with switching capability

## Architecture

### Core Components

- **DialogueManager**: Central coordinator for dialogue providers and conversations
- **IDialogueProvider**: Interface for dialogue providers (canned, AI, custom)
- **BaseDialogueProvider**: Abstract base class with common functionality
- **CannedBranchingProvider**: YAML/JSON dialogue tree provider
- **DialogueCommandHandlers**: Command parser integration

### Dialogue Flow

1. Player initiates dialogue with `talk <npc>` command
2. DialogueManager routes to appropriate provider
3. Provider processes conversation state and returns response
4. Player responds with `respond <choice>` command
5. Process continues until conversation ends

## Dialogue Tree Format

### YAML Example

```yaml
id: village-elder
name: Village Elder Dialogue
description: A wise village elder
version: 1.0.0
startNodeId: greeting
variables:
  greeted: false
  quest_accepted: false

nodes:
  greeting:
    id: greeting
    npcMessage: |
      Welcome to our village! How can I help you?

      {{greeted ? "Welcome back!" : "I don't believe we've met."}}
    choices:
      - id: "1"
        text: "Tell me about the village."
        nextNodeId: village_info
      - id: "2"
        text: "I need help with something."
        nextNodeId: offer_help
        condition:
          type: level
          operator: greater_than
          value: 5
    actions:
      - type: set_variable
        target: greeted
        value: true

  village_info:
    id: village_info
    npcMessage: "Our village has stood for generations..."
    choices:
      - id: "1"
        text: "Thank you for the information."
        nextNodeId: farewell
    isEnd: true
```

### JSON Example

```json
{
  "id": "merchant",
  "name": "Merchant Dialogue",
  "startNodeId": "greeting",
  "nodes": {
    "greeting": {
      "id": "greeting",
      "npcMessage": "Welcome to my shop!",
      "choices": [
        {
          "id": "1",
          "text": "Show me your goods.",
          "nextNodeId": "show_goods"
        }
      ]
    }
  }
}
```

## Variable System

### Built-in Variables

- `player.name` - Player name
- `player.stats.*` - Player statistics (level, hp, etc.)
- `player.inventory` - Array of item IDs
- `player.flags` - Array of player flags
- `player.quests.*` - Quest progress
- `player.currency.*` - Currency amounts
- `player.factionRelations.*` - Faction relationships
- `npc.id`, `npc.name` - NPC information
- `conversation.variables.*` - Custom conversation variables
- `world.time` - Current time
- `world.globalFlags.*` - Global world flags

### Variable Syntax

```
{{variable.path}} - Simple variable
{{variable.path || default}} - Variable with default
{{variable > 5 ? "high" : "low"}} - Conditional (not implemented yet)
```

## Condition System

### Condition Types

- `variable` - Check conversation or player variables
- `flag` - Check if player has flag
- `item` - Check if player has item
- `quest` - Check quest status
- `stat` - Check player stats
- `skill` - Check player skills
- `level` - Check player level
- `time` - Time-based conditions
- `random` - Random chance

### Condition Examples

```yaml
condition:
  type: level
  operator: greater_than
  value: 10

condition:
  type: flag
  operator: has
  target: quest_started

condition:
  type: random
  value: 0.3  # 30% chance
```

## Action System

### Action Types

- `set_variable` - Set conversation variable
- `give_item` - Give item to player
- `take_item` - Take item from player
- `add_flag` - Add player flag
- `remove_flag` - Remove player flag
- `start_quest` - Start quest
- `complete_quest` - Complete quest
- `custom` - Custom actions

### Action Examples

```yaml
actions:
  - type: set_variable
    target: quest_accepted
    value: true
  - type: give_item
    target: healing_potion
  - type: add_flag
    target: elder_helped
```

## Usage

### Basic Setup

```typescript
import { DialogueManager, CannedBranchingProvider } from './dialogue';

// Create dialogue manager
const dialogueManager = new DialogueManager(eventSystem, logger);

// Create and register providers
const cannedProvider = new CannedBranchingProvider(eventSystem, logger);
await cannedProvider.initialize({
  contentPath: './content',
  npcMappings: {
    'village-elder': 'village-elder',
    'merchant': 'merchant'
  }
});

dialogueManager.registerProvider(cannedProvider);

// Initialize manager
await dialogueManager.initialize({
  contentPath: './content',
  enablePersistence: true
});
```

### Commands

```typescript
import { DialogueCommandHandlers } from './dialogue';

const dialogueCommands = new DialogueCommandHandlers(dialogueManager);
const commandHandlers = dialogueCommands.getCommandHandlers();

// Register with command parser
commandParser.registerCommand(commandHandlers.talk);
commandParser.registerCommand(commandHandlers.converse);
commandParser.registerCommand(commandHandlers.respond);
```

### Starting Conversations

```typescript
// Start dialogue
const response = await dialogueManager.startConversation(
  player,
  npcId,
  'canned-branching' // optional provider ID
);

// Continue dialogue
const nextResponse = await dialogueManager.continueConversation(
  player,
  npcId,
  playerInput,
  conversationId
);
```

## Configuration

```typescript
const config = {
  enablePersistence: true,
  maxConversationsPerPlayer: 5,
  conversationTimeoutMinutes: 30,
  autoSaveIntervalSeconds: 300,
  defaultProvider: 'canned-branching',
  contentPath: './content'
};
```

## File Structure

```
engine/modules/dialogue/
├── types.ts                    # Core types and interfaces
├── providers.ts                # Base dialogue provider
├── canned-branching-provider.ts # YAML/JSON provider
├── dialogue-manager.ts         # Central manager
├── dialogue-commands.ts       # Command handlers
├── index.ts                   # Module exports
├── examples/                  # Sample dialogue trees
│   ├── village-elder.yaml
│   ├── merchant.json
│   └── guard.yaml
└── README.md                  # This file
```

## Integration Points

### With World Manager

- NPCs reference dialogue providers via `dialogueProvider` field
- World manager provides NPC information for variable resolution

### With Persistence

- Conversation state saved to persistence layer
- Automatic cleanup of expired conversations
- Quest and flag changes persist

### With Event System

- Dialogue events for monitoring and debugging
- Integration with game events (quest started, item given, etc.)

## Best Practices

### Dialogue Tree Design

1. **Keep it modular**: Split complex dialogues into multiple trees
2. **Use conditions wisely**: Don't create overly complex branching
3. **Test thoroughly**: Dialogue trees can be complex to debug
4. **Use variables**: Make dialogues feel dynamic and personalized

### Performance

1. **Cache dialogue trees**: Load once, reuse across conversations
2. **Clean up conversations**: Set reasonable timeouts
3. **Limit concurrent conversations**: Prevent memory issues

### Content Creation

1. **Start simple**: Begin with basic interactions
2. **Iterate**: Test and refine dialogue trees
3. **Use templates**: Create reusable dialogue patterns
4. **Document**: Comment complex branching logic

## Future Enhancements

- **AI Dialogue Provider**: Integration with language models
- **Voice Integration**: Speech-to-text for voice commands
- **Multi-language**: Support for multiple languages
- **Dialogue Editor**: Visual editor for dialogue trees
- **Analytics**: Track dialogue engagement metrics