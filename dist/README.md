# MUD Engine

A modular, scalable Multi-User Dungeon (MUD) engine built with TypeScript and Node.js, designed for modern game development with plugin-based architecture and real-time multiplayer capabilities.

## 🚀 Why TypeScript/Node.js?

### Technical Advantages

**Type Safety & Developer Experience**
- **Compile-time Error Detection**: TypeScript catches type-related errors before runtime, reducing bugs in game logic
- **Enhanced IDE Support**: Superior autocomplete, refactoring, and navigation capabilities
- **Self-Documenting Code**: Types serve as living documentation for complex game systems

**Modern JavaScript Ecosystem**
- **NPM Package Management**: Access to 1.8M+ packages for rapid development
- **Modern Language Features**: ES2021+ features, async/await, destructuring, modules
- **Hot Reloading**: Fast development cycles with instant feedback

**Performance & Scalability**
- **V8 Engine Optimization**: Google's V8 JavaScript engine provides excellent performance
- **Non-blocking I/O**: Perfect for real-time multiplayer games with many concurrent connections
- **Memory Efficiency**: Better garbage collection and memory management than traditional MUD languages

**Plugin Architecture Benefits**
- **Dependency Injection**: Clean, testable module system with NestJS
- **Dynamic Module Loading**: Hot-swappable plugins without server restart
- **Interface Contracts**: TypeScript interfaces ensure plugin compatibility

## 🏗️ Architecture

### Project Structure

```
├── engine/                 # Core game engine
│   ├── core/              # Core systems (entities, events, world)
│   └── modules/           # Plugin modules (combat, quests, etc.)
├── server/                # Game server implementation
├── clients/               # Client implementations (web, terminal)
├── tools/                 # Development and admin tools
├── scripts/               # Build and utility scripts
└── docs/                  # Documentation
```

### Core Principles

- **Modularity**: Plugin-based architecture for easy extension
- **Real-time**: WebSocket-based communication for instant updates
- **Scalability**: Designed to handle hundreds of concurrent players
- **Testability**: Comprehensive test suite with Vitest
- **Developer Experience**: Modern tooling with ESLint, Prettier, and TypeScript

## 🛠️ Technology Stack

### Framework & Runtime
- **Node.js 18+**: High-performance JavaScript runtime
- **NestJS**: Enterprise-grade framework for scalable applications
- **TypeScript 5.1+**: Typed superset of JavaScript

### Real-time Communication
- **Socket.IO**: Real-time bidirectional event-based communication
- **WebSockets**: Low-latency communication protocol

### Development Tools
- **Vitest**: Fast unit testing framework
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **GitHub Actions**: CI/CD pipeline

### Key Dependencies
- **@nestjs/common**: Core NestJS framework
- **socket.io**: Real-time communication
- **winston**: Logging framework
- **inversify**: Dependency injection container
- **class-validator**: Input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mud-engine

# Install dependencies
npm install

# Bootstrap the project
npm run setup
```

### Starting the MUD Server

The MUD engine now includes a complete server implementation with the following startup options:

```bash
# Start server in development mode (with TypeScript compilation)
npm run server:dev

# Start server in production mode (builds first, then runs)
npm run server:prod

# Quick server start (auto-detects environment)
npm run server:start

# Stop the running server
npm run server:stop

# Legacy NestJS commands (may require additional setup)
npm run start:dev
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key configuration options:
- `MUD_PORT`: Server port (default: 4000)
- `MUD_HOST`: Server host (default: 0.0.0.0)
- `MUD_ENABLE_NETWORKING`: Enable/disable telnet server (default: true)
- `MUD_ENABLE_WORLD`: Enable/disable world system (default: true)
- `MUD_LOG_LEVEL`: Logging level (default: info)

### Development Commands

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## 🎮 Features

### Core Engine
- **Entity System**: Flexible object management with inheritance
- **Event System**: Decoupled communication between game systems
- **World Management**: Hierarchical world structure with rooms and areas
- **Command Processing**: Extensible command parsing and execution

### NPC System
- **Dynamic NPC Management**: Template-based NPC creation with runtime spawning/despawning
- **Advanced Dialogue Integration**: Branching conversation trees with conditional logic and variables
- **Behavioral AI**: Configurable NPC behaviors and decision-making systems
- **Template Factory**: Pre-built NPC templates for common character types (merchants, guards, animals)
- **Content-Driven Design**: JSON/YAML-based NPC and dialogue definitions for easy content creation
- **Event-Driven Architecture**: NPC lifecycle managed through the event system for clean integration

### Multiplayer
- **Real-time Communication**: Instant updates for all players
- **Player Sessions**: Persistent connections with state management
- **Chat System**: Public and private messaging
- **Presence**: Online status and player tracking

### Plugin System
- **Hot Reload**: Load/unload plugins without restarting
- **Dependency Injection**: Clean module dependencies
- **Event Hooks**: Extend engine behavior through events
- **Configuration**: Plugin-specific settings and customization

## 🛡️ Admin Panel

### Overview

The MUD Engine includes a comprehensive web-based admin panel for game management, built with React and integrated with the NestJS backend. The admin panel provides role-based access control and real-time monitoring capabilities for server administrators, moderators, and content creators.

### Key Features

#### Authentication & Security
- **JWT Token Authentication**: Secure login system with token-based sessions
- **Role-Based Access Control**: Granular permissions for Admin, Moderator, and User roles
- **Session Management**: Persistent login with automatic timeout and cleanup
- **Security Utils**: Client-side security utilities for permission checking

#### Dashboard
- **System Overview**: Real-time statistics and metrics display
- **Active Monitoring**: Connected users, rooms, NPCs, and active players tracking
- **Recent Activity Feed**: Live activity log with timestamp tracking
- **Health Monitoring**: System status checks and performance metrics

#### User Management
- **User Overview**: Complete user list with status and role information
- **Account Control**: Activate/deactivate user accounts with audit logging
- **Role Management**: Promote/demote users between Admin, Moderator, and User roles
- **Password Reset**: Secure password reset functionality for user accounts
- **User Analytics**: Statistics and activity tracking per user

#### World Management
- **Interactive Map**: Visual world exploration with sector and room visualization
- **NPC Monitoring**: Real-time NPC status and location tracking
- **Content Statistics**: Room, item, and NPC counts with detailed breakdowns
- **World Configuration**: Tools for managing world sectors and content

#### Dialogue Management
- **Visual Tree Editor**: Drag-and-drop dialogue tree creation and editing
- **Node Validation**: Real-time validation with error highlighting
- **Conversation Testing**: Interactive dialogue testing tools
- **Tree Analysis**: Flow analysis and optimization suggestions

### ASCII Interface Preview

```
╔══════════════════════════════════════════════════════════════╗
║                     MUD Admin Panel                          ║
╠══════════════════════════════════════════════════════════════╣
║  ┌─ Dashboard ──────────┐  ┌─ Quick Stats ─────────────────┐  ║
║  │ ⚙️ System Status      │  │ Total Users: 1,234           │  ║
║  │ 🟢 All Systems OK     │  │ Active Players: 89           │  ║
║  │ 📊 Recent Activity    │  │ Total Rooms: 156             │  ║
║  │ 👥 User Management    │  │ NPCs Active: 42              │  ║
║  │ 🗺️  World Overview     │  └──────────────────────────────┘  ║
║  │ 💬 Dialogue Editor    │                                     ║
║  └───────────────────────┘                                     ║
╠══════════════════════════════════════════════════════════════╣
║  ┌─ User Management ─────────────────────────────────────────┐  ║
║  │ Username    │ Role       │ Status  │ Last Login         │  ║
║  │ admin       │ Admin      │ Active  │ 2 minutes ago      │  ║
║  │ moderator1  │ Moderator  │ Active  │ 1 hour ago         │  ║
║  │ player123   │ User       │ Active  │ 5 minutes ago      │  ║
║  │ banneduser  │ User       │ Inactive│ 2 days ago         │  ║
║  └───────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════╣
║  ┌─ Dialogue Tree Editor ───────────────────────────────────┐  ║
║  │ ┌─ blacksmith_greeting ─┐  ┌─ choice_1 ─┐               │  ║
║  │ │ "Welcome to my forge!"│  │ "I'd like   │               │  ║
║  │ │ [3 choices]           │  │  to buy"    │               │  ║
║  │ │ [END] ──────────────┐ │  │            │               │  ║
║  │ └─────────────────────┘ │  └────────────┘               │  ║
║  │                         │                                │  ║
║  │               ┌─ blacksmith_shop ─┐                     │  ║
║  │               │ "What can I      │                     │  ║
║  │               │  get for ya?"    │                     │  ║
║  │               └──────────────────┘                     │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════╝
```

### Quick Start

#### Prerequisites
- Running MUD server backend
- Modern web browser with JavaScript enabled
- Admin user account created

#### Installation
1. **Start the MUD Server**:
   ```bash
   npm run server:start
   ```

2. **Access Admin Panel**:
   ```
   http://localhost:3000/admin
   ```

3. **Login Credentials** (Demo):
   - **Admin**: `admin` / `admin`
   - **Moderator**: `moderator` / `moderator`
   - **User**: `user` / `user`

#### Initial Setup
```bash
# Create admin user (if not exists)
npm run seed:admin

# Start server with admin panel enabled
npm run server:dev
```

### Role-Based Permissions

| Feature | Admin | Moderator | User |
|---------|-------|-----------|------|
| Dashboard | ✅ Full | ✅ Read-only | ✅ Limited |
| User Management | ✅ Full CRUD | ✅ View users | ❌ None |
| World Management | ✅ Full control | ✅ View & edit | ❌ None |
| Dialogue Editor | ✅ Full control | ✅ View & edit | ❌ None |
| System Settings | ✅ Full access | ❌ None | ❌ None |
| Server Controls | ✅ Restart/shutdown | ❌ None | ❌ None |

### API Integration

The admin panel communicates with the backend through RESTful APIs:

```typescript
// Dashboard statistics
GET /admin/dashboard
Authorization: Bearer <jwt_token>

// User management
GET /admin/users
POST /admin/users/{id}/role
PUT /admin/users/{id}/activate

// World overview
GET /admin/world/overview
GET /admin/world/sectors

// Dialogue management
GET /admin/dialogue/trees
POST /admin/dialogue/validate
PUT /admin/dialogue/trees/{id}
```

### Architecture

```
clients/admin/
├── index.html          # Main HTML entry point
├── App.js             # React application with routing
├── Components.js      # UI components and panels
├── SecurityUtils.js   # Permission and role management
└── WorldVisualization.js # Interactive world map

server/admin/
├── admin.module.ts    # NestJS admin module
├── controllers/       # API endpoints
│   ├── admin-dashboard.controller.ts
│   ├── admin-user-management.controller.ts
│   ├── admin-world.controller.ts
│   └── admin-dialogue.controller.ts
└── guards/           # Authentication and permissions
```

### Development

#### Local Development Setup
```bash
# Install dependencies
npm install

# Start backend server
npm run server:dev

# Open admin panel in browser
# Navigate to: http://localhost:3000/admin
```

#### Customization
- **Styling**: Terminal-inspired green-on-black theme using Tailwind CSS
- **Components**: Modular React components for easy extension
- **API Integration**: RESTful API layer with automatic error handling
- **State Management**: React hooks with localStorage persistence

### Security Features

- **Token-based Authentication**: JWT tokens with expiration
- **Role-based Access**: Granular permissions system
- **Input Validation**: Client and server-side validation
- **Audit Logging**: All admin actions are logged
- **Session Timeout**: Automatic logout on inactivity
- **HTTPS Ready**: Production-ready security configuration

### Benefits

- **User-Friendly**: Modern web interface replacing traditional command-line tools
- **Real-time Monitoring**: Live system statistics and activity tracking
- **Content Management**: Visual tools for dialogue and world editing
- **Role Security**: Granular permissions prevent unauthorized access
- **Scalable Architecture**: Modular design supports future enhancements
- **Developer Experience**: TypeScript integration with comprehensive APIs

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [Plugin Development](docs/plugins.md)
- [NPC System Guide](docs/npc-system.md)
- [Dialogue System Guide](docs/dialogue-system.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## 🤖 NPC System

### Overview

The MUD Engine includes a comprehensive NPC (Non-Player Character) system that enables dynamic character interactions, intelligent behaviors, and immersive storytelling through branching dialogue trees.

### Key Components

#### NPC Manager
- **Lifecycle Management**: Handles NPC spawning, despawning, and state persistence
- **Template System**: Factory pattern for creating NPCs from predefined templates
- **Event Integration**: Seamless integration with the game's event system
- **Room-Based Tracking**: Efficient NPC management per room/location

#### Dialogue System
- **Branching Conversations**: Complex dialogue trees with conditional branching
- **Variable System**: Dynamic content based on player state, quests, and world flags
- **Multiple Providers**: Support for canned dialogues and future AI integration
- **State Persistence**: Conversations persist across sessions

#### NPC Templates
Pre-built templates for common character types:
- **Merchants & Vendors**: Shopkeepers with inventory and pricing
- **Guards & Soldiers**: Military NPCs with patrol routes and behaviors
- **Commoners**: Everyday NPCs with daily routines and relationships
- **Animals**: Wildlife with different domestication levels and behaviors
- **Special Characters**: Kings, jesters, and other unique NPCs

### File Structure

```
engine/modules/world/
├── npc-manager.ts              # Core NPC lifecycle management
├── npc-templates.ts            # Template definitions and factory
├── sample-npcs.ts             # Sample NPC implementations
├── content/
│   ├── npcs/                   # Individual NPC definitions (JSON)
│   ├── dialogue/               # Dialogue trees (YAML/JSON)
│   ├── dialogue/npc-mappings.json # NPC-to-dialogue connections
│   └── sectors/                # World sectors with NPC placements
```

### Usage Example

```typescript
import { NPCManager } from './engine/modules/world/npc-manager';
import NPCTemplateFactory from './engine/modules/world/npc-templates';

// Create NPC manager
const npcManager = new NPCManager(eventSystem, logger);

// Create a merchant NPC from template
const merchant = npcManager.createNPCFromTemplate('merchant', 'town_square', 'town_sector', {
  name: 'Gretta the Grocer',
  inventory: ['bread', 'cheese', 'apples'],
  prices: { bread: 5, cheese: 8, apples: 3 }
});

// Load NPCs from content files
await npcManager.loadNPCsFromDirectory('./content/npcs');
```

### Dialogue Integration

```typescript
import { DialogueManager } from './engine/modules/dialogue';

// Start conversation with NPC
const response = await dialogueManager.startConversation(
  player,
  'blacksmith',
  'canned-branching'
);

// Continue dialogue based on player choice
const nextResponse = await dialogueManager.continueConversation(
  player,
  'blacksmith',
  '1', // Player chose option 1
  conversationId
);
```

### Configuration

NPC behavior is controlled through JSON configuration files:

```json
{
  "id": "blacksmith",
  "name": "a sturdy blacksmith",
  "dialogueProvider": "canned-branching",
  "behaviors": ["gruff", "merchant", "craftsman"],
  "spawnData": {
    "spawnRoomId": "town:blacksmith",
    "spawnConditions": [{"type": "player_enter", "value": true}],
    "despawnConditions": [{"type": "no_players", "delay": 60000}]
  }
}
```

### Benefits

- **Content-Driven**: Easy to create new NPCs and dialogue without code changes
- **Scalable**: Efficient management of hundreds of NPCs across multiple rooms
- **Extensible**: Template system allows for custom NPC types and behaviors
- **Integrated**: Works seamlessly with existing world, event, and persistence systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and add tests
# Run tests and linting
npm run test
npm run lint

# Commit changes
git commit -m "Add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic MUD games and modern game engine architectures
- Built with the amazing Node.js and TypeScript communities
- Thanks to all contributors and the gaming community

## 📞 Support

- [GitHub Issues](https://github.com/your-repo/issues)
- [Documentation](docs/)
- [Discord Community](https://discord.gg/your-server)

---

**Ready to build the next generation of MUD games?** Let's create something amazing together! 🎲✨