# MUD Engine Development Tools

This directory contains comprehensive development, administration, and content management tools for the MUD Engine project.

## Overview

The `mudctl` CLI tool provides a complete development and administration experience for managing MUD engines in production and development environments.

## Installation

The tools are included with the main MUD Engine project. No additional installation is required.

## Quick Start

```bash
# Build the CLI tool
npm run mudctl:build

# Use the CLI tool
npm run mudctl -- --help
# or directly
./tools/mudctl.ts --help
```

## Command Structure

### World Commands (`mudctl world`)

Manage world creation, validation, and editing:

```bash
# Create a new world
mudctl world create --name "My Fantasy World" --template fantasy

# Validate world data
mudctl world validate --path ./world-data

# List all rooms
mudctl world edit room list

# Create a new room
mudctl world edit room create --name "Throne Room" --area castle

# Export world data
mudctl world export world-backup.json --format json
```

### Admin Commands (`mudctl admin`)

User management and administrative tools:

```bash
# Add a new user
mudctl admin user add --username admin --email admin@mud.com

# Grant role to user
mudctl admin user grant admin administrator

# List all users
mudctl admin user list --detailed

# Create a new role
mudctl admin role add --name moderator --permissions "kick,ban,mute"

# Generate authentication token
mudctl admin auth token generate admin --expires 24
```

### Content Commands (`mudctl content`)

Content development and scaffolding tools:

```bash
# Create a new dialogue
mudctl content new dialogue --name shopkeeper --type yaml

# Create a new plugin
mudctl content new plugin --name combat --type system

# Create a new module
mudctl content new module --name combat --type world

# Validate content
mudctl content validate dialogue --file shopkeeper.yaml

# Package content for deployment
mudctl content package my-content --type world --version 1.0.0
```

### Development Commands (`mudctl dev`)

Development utilities and tools:

```bash
# Seed with sample data
mudctl dev seed world --count 10

# Profile memory usage
mudctl dev profile memory --duration 30

# Analyze log files
mudctl dev log analyze --since 1h

# Create backup
mudctl dev backup world-backup --type full

# Restore from backup
mudctl dev restore world-backup-2024-01-01 --force
```

### Server Commands (`mudctl server`)

Server management and monitoring:

```bash
# Start server in development mode
mudctl server start --env development --port 3000

# Start server as daemon
mudctl server start --daemon --env production

# Check server status
mudctl server status --verbose

# View server logs
mudctl server logs --follow --lines 100

# Stop server
mudctl server stop

# Restart server
mudctl server restart --env production
```

## Advanced Usage

### World Building Workflow

```bash
# 1. Create a new world
mudctl world create --name "Enchanted Forest" --template fantasy

# 2. Create areas and rooms
mudctl world edit room create --name "Forest Clearing" --area forest
mudctl world edit room create --name "Ancient Oak" --area forest

# 3. Connect rooms
mudctl world edit exit create --from forest_clearing --to ancient_oak --direction north

# 4. Add NPCs and items
mudctl world edit npc create --name "Forest Spirit" --room forest_clearing
mudctl world edit item create --name "Magic Acorn" --type consumable

# 5. Validate the world
mudctl world validate

# 6. Export for deployment
mudctl world export enchanted-forest.json
```

### Content Development Pipeline

```bash
# 1. Create dialogue content
mudctl content new dialogue --name village_elder --type yaml

# 2. Create supporting content
mudctl content new item --name "Elder Staff" --type weapon
mudctl content new npc --name "Village Elder" --room village_center

# 3. Test content
mudctl content test dialogue --file village_elder.yaml

# 4. Package for production
mudctl content package village-content --type dialogue --version 1.0.0
```

### Production Deployment

```bash
# 1. Backup current world
mudctl dev backup pre-deployment

# 2. Stop server
mudctl server stop

# 3. Deploy new content
mudctl content package deploy village-content.tar.gz

# 4. Start server
mudctl server start --env production --daemon

# 5. Monitor startup
mudctl server logs --follow
```

## Configuration

The CLI tool uses the following configuration sources (in order of precedence):

1. Command-line options
2. Environment variables
3. `.env` file in project root
4. Default values

### Environment Variables

```bash
# Server configuration
NODE_ENV=development
PORT=3000

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mud_engine

# Logging
LOG_LEVEL=info
LOG_FILE=logs/mud-engine.log

# World configuration
WORLD_PATH=./engine/modules/world/content
DEFAULT_ROOM_ID=start
```

## File Structure

```
tools/
├── mudctl.ts              # Main CLI entry point
├── commands/              # Command modules
│   ├── world.ts          # World management commands
│   ├── admin.ts          # Admin/user management
│   ├── content.ts        # Content development tools
│   ├── dev.ts            # Development utilities
│   └── server.ts         # Server management
├── templates/             # Scaffolding templates
│   ├── room-template.json
│   ├── item-template.json
│   ├── npc-template.json
│   └── plugin-template.ts
└── README.md             # This file
```

## Command Reference

### Global Options

- `-v, --verbose`: Enable verbose output
- `-q, --quiet`: Suppress non-error output
- `--config <path>`: Path to config file (default: ./.env)
- `--project-root <path>`: Path to project root (default: current directory)

### Error Handling

The CLI tool includes comprehensive error handling:

- Invalid commands show helpful suggestions
- File operations include validation
- Network operations have timeout handling
- All errors include verbose mode for debugging

### Logging

The CLI tool supports multiple logging levels:

- `error`: Errors only
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging information

## Development

### Adding New Commands

1. Create a new command module in `tools/commands/`
2. Implement the command class with required methods
3. Import and register in `mudctl.ts`
4. Add tests in `test/tools/`

### Testing

```bash
# Test CLI commands
npm test test/tools/

# Test with coverage
npm run test:cov test/tools/
```

### Building

```bash
# Build CLI tool
npm run mudctl:build

# Build all tools
npm run tools:build
```

## Troubleshooting

### Common Issues

**Command not found**
```bash
# Ensure you're in the project root
cd /path/to/mud-engine

# Check if CLI is built
npm run mudctl:build

# Run with npx
npx ts-node tools/mudctl.ts --help
```

**Permission denied**
```bash
# Make CLI executable
chmod +x tools/mudctl.ts
```

**World validation errors**
```bash
# Get detailed error information
mudctl world validate --verbose

# Attempt auto-fix
mudctl world validate --fix
```

**Server won't start**
```bash
# Check port availability
mudctl server status

# Check logs
mudctl server logs --lines 50

# Force stop existing server
mudctl server stop --force
```

## Contributing

When contributing to the tools:

1. Follow the existing code style
2. Add comprehensive error handling
3. Include help text for all commands
4. Update this README with new features
5. Add tests for new functionality

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.