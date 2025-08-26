# MUD Engine Admin Tools Guide

This comprehensive guide covers the MUD Engine's web-based admin panel, providing detailed instructions for setup, usage, and API integration.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation & Setup](#installation--setup)
- [User Roles & Permissions](#user-roles--permissions)
- [Dashboard Overview](#dashboard-overview)
- [User Management](#user-management)
- [World Management](#world-management)
- [Dialogue Management](#dialogue-management)
- [API Reference](#api-reference)
- [Security Configuration](#security-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The MUD Admin Panel is a modern web-based interface for managing MUD game servers. Built with React and integrated with the NestJS backend, it provides comprehensive tools for server administration, content management, and real-time monitoring.

### Key Features

- **Real-time Dashboard**: Live system statistics and activity monitoring
- **User Management**: Complete user lifecycle management with role-based access
- **World Visualization**: Interactive map and content management tools
- **Dialogue Editor**: Visual dialogue tree creation and editing
- **Security Controls**: JWT authentication with granular permissions
- **Audit Logging**: Comprehensive action tracking and logging

### Architecture

```
Frontend (React)
├── Authentication Layer
├── Dashboard Components
├── User Management Interface
├── World Visualization Tools
└── Dialogue Tree Editor

Backend (NestJS)
├── Authentication Guards
├── Admin Controllers
├── Permission System
├── Audit Logging
└── API Services
```

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Running MUD server
- Modern web browser

### Basic Setup

1. **Start the MUD Server**:
   ```bash
   npm run server:start
   ```

2. **Access Admin Panel**:
   ```
   http://localhost:3000/admin
   ```

3. **Login with Demo Credentials**:
   - Username: `admin`
   - Password: `admin`

## Installation & Setup

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Admin Panel Configuration
MUD_ADMIN_PORT=3000
MUD_ADMIN_HOST=localhost
MUD_ADMIN_ENABLE_SSL=false

# Database Configuration
MUD_DB_HOST=localhost
MUD_DB_PORT=5432
MUD_DB_NAME=mud_engine
MUD_DB_USER=admin
MUD_DB_PASSWORD=password

# JWT Configuration
MUD_JWT_SECRET=your-super-secret-jwt-key-here
MUD_JWT_EXPIRES_IN=8h

# Session Configuration
MUD_SESSION_TIMEOUT=3600000
MUD_MAX_SESSIONS_PER_USER=5
```

### Database Setup

```bash
# Initialize database
npm run db:migrate

# Seed admin users
npm run seed:admin

# Create initial world content
npm run seed:world
```

### Admin User Creation

```bash
# Create admin user programmatically
node scripts/create-admin-user.js --username admin --password securepass --role admin

# Or use the seed script
npm run seed:admin
```

## User Roles & Permissions

### Role Hierarchy

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All permissions including system administration |
| **Moderator** | Content and user management | Dashboard, users, world, dialogue management |
| **User** | Limited access | Dashboard only, no modification permissions |

### Permission Matrix

| Feature | Admin | Moderator | User |
|---------|-------|-----------|------|
| View Dashboard | ✅ | ✅ | ✅ |
| Edit Dashboard | ✅ | ❌ | ❌ |
| View Users | ✅ | ✅ | ❌ |
| Edit Users | ✅ | ✅ | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| View World | ✅ | ✅ | ❌ |
| Edit World | ✅ | ✅ | ❌ |
| Delete World Content | ✅ | ❌ | ❌ |
| View Dialogues | ✅ | ✅ | ❌ |
| Edit Dialogues | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Server Controls | ✅ | ❌ | ❌ |

### Custom Permissions

The permission system supports custom permissions for specialized roles:

```typescript
// Define custom permissions
export const CUSTOM_PERMISSIONS = {
  CONTENT_CREATOR: 'content:create',
  NPC_MANAGER: 'npc:manage',
  DIALOGUE_EDITOR: 'dialogue:edit',
  WORLD_BUILDER: 'world:build'
};

// Check permissions in components
if (user.permissions.includes(CUSTOM_PERMISSIONS.CONTENT_CREATOR)) {
  // Show content creation tools
}
```

## Dashboard Overview

### Main Dashboard

The dashboard provides real-time system monitoring:

```ascii
┌─ System Status ──────────────────┐
│ 🟢 Server: Online                 │
│ 🟢 Database: Connected            │
│ 🟢 World Engine: Running          │
│ 📊 Memory Usage: 67%             │
└───────────────────────────────────┘

┌─ Quick Stats ─────────────────────┐
│ 👥 Total Users: 1,234            │
│ 🎮 Active Players: 89            │
│ 🏰 Total Rooms: 156              │
│ 🤖 Active NPCs: 42               │
└───────────────────────────────────┘

┌─ Recent Activity ─────────────────┐
│ 14:32 - User 'admin' logged in   │
│ 14:28 - Player entered Town Square│
│ 14:25 - NPC 'blacksmith' spawned │
│ 14:22 - User 'moderator1' edited │
│        dialogue tree              │
└───────────────────────────────────┘
```

### Dashboard Metrics

- **System Health**: Overall system status and component health
- **Performance**: Memory usage, CPU load, and response times
- **User Activity**: Login/logout events and session tracking
- **World Events**: NPC spawns, room changes, and world updates
- **Error Monitoring**: System errors and warning conditions

## User Management

### User List Interface

The user management interface displays:

| Column | Description |
|--------|-------------|
| Username | Unique user identifier |
| Role | Current user role (Admin/Moderator/User) |
| Status | Account status (Active/Inactive) |
| Last Login | Timestamp of last login |
| Actions | Available actions based on permissions |

### User Actions

#### Creating Users

```typescript
// API endpoint
POST /admin/users
{
  "username": "newuser",
  "password": "securepassword",
  "role": "user",
  "email": "user@example.com"
}
```

#### Updating User Roles

```typescript
// Promote user to moderator
PUT /admin/users/{userId}/role
{
  "role": "moderator"
}
```

#### Password Management

```typescript
// Reset user password
PUT /admin/users/{userId}/password
{
  "password": "newsecurepassword"
}
```

#### Account Activation

```typescript
// Activate user account
PUT /admin/users/{userId}/activate

// Deactivate user account
PUT /admin/users/{userId}/deactivate
```

## World Management

### Interactive World Map

The world visualization provides:

- **Sector Overview**: High-level view of world sectors
- **Room Details**: Individual room information and connections
- **NPC Tracking**: Real-time NPC locations and status
- **Player Positions**: Current player locations
- **Navigation Tools**: Zoom, pan, and filter controls

### World Statistics

```typescript
interface WorldStats {
  totalSectors: number;
  totalRooms: number;
  totalNPCs: number;
  totalItems: number;
  activePlayers: number;
  sectors: Sector[];
}

interface Sector {
  id: string;
  name: string;
  description: string;
  rooms: Room[];
  npcs: NPC[];
  items: Item[];
}
```

### World Management Tools

#### Adding New Rooms

```typescript
POST /admin/world/rooms
{
  "id": "forest_clearing",
  "name": "Forest Clearing",
  "description": "A peaceful clearing in the forest",
  "sectorId": "forest",
  "exits": {
    "north": "forest_path",
    "south": "dark_woods"
  }
}
```

#### Managing NPCs

```typescript
// Spawn NPC
POST /admin/world/npcs/spawn
{
  "templateId": "merchant",
  "roomId": "town_square",
  "name": "Gretta the Grocer",
  "inventory": ["bread", "cheese", "apples"]
}

// Despawn NPC
DELETE /admin/world/npcs/{npcId}
```

## Dialogue Management

### Visual Dialogue Editor

The dialogue editor provides:

- **Tree Visualization**: Hierarchical view of dialogue trees
- **Node Editing**: Rich text editor for dialogue content
- **Branch Management**: Add, remove, and reorder dialogue branches
- **Validation Tools**: Real-time validation and error checking
- **Testing Interface**: Interactive dialogue testing

### Dialogue Tree Structure

```typescript
interface DialogueTree {
  id: string;
  name: string;
  description: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
  variables: DialogueVariable[];
}

interface DialogueNode {
  id: string;
  text: string;
  responses: DialogueResponse[];
  conditions: DialogueCondition[];
  actions: DialogueAction[];
  isEndNode: boolean;
}

interface DialogueResponse {
  id: string;
  text: string;
  nextNodeId: string | null;
  conditions: DialogueCondition[];
}
```

### Dialogue Editing Workflow

1. **Select Tree**: Choose from available dialogue trees
2. **Edit Nodes**: Modify dialogue text and responses
3. **Add Branches**: Create new dialogue paths
4. **Set Conditions**: Add conditional logic
5. **Validate**: Check for errors and dead ends
6. **Test**: Interactive testing with different scenarios
7. **Save**: Persist changes with versioning

### Dialogue Validation

The system validates dialogue trees for:

- **Dead Ends**: Nodes with no valid responses
- **Orphaned Nodes**: Unreachable dialogue nodes
- **Circular References**: Loops that prevent progression
- **Missing Conditions**: Required variables or states
- **Invalid References**: Broken node connections

## API Reference

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Dashboard Endpoints

#### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "totalUsers": 1234,
  "activeUsers": 89,
  "totalRooms": 156,
  "activePlayers": 45,
  "systemUptime": "2d 4h 32m",
  "recentActivity": [...]
}
```

### User Management Endpoints

#### Get All Users
```http
GET /admin/users
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /admin/users/{id}
Authorization: Bearer <token>
```

#### Create User
```http
POST /admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepass",
  "role": "user"
}
```

#### Update User Role
```http
PUT /admin/users/{id}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "moderator"
}
```

### World Management Endpoints

#### Get World Overview
```http
GET /admin/world/overview
Authorization: Bearer <token>
```

#### Get World Sectors
```http
GET /admin/world/sectors
Authorization: Bearer <token>
```

#### Get Sector Details
```http
GET /admin/world/sectors/{sectorId}
Authorization: Bearer <token>
```

### Dialogue Endpoints

#### Get Dialogue Trees
```http
GET /admin/dialogue/trees
Authorization: Bearer <token>
```

#### Get Dialogue Tree
```http
GET /admin/dialogue/trees/{treeId}
Authorization: Bearer <token>
```

#### Update Dialogue Tree
```http
PUT /admin/dialogue/trees/{treeId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Blacksmith Dialogue",
  "nodes": { ... }
}
```

#### Validate Dialogue Tree
```http
POST /admin/dialogue/validate/{treeId}
Authorization: Bearer <token>
```

## Security Configuration

### JWT Configuration

```typescript
// jwt.config.ts
export const jwtConfig = {
  secret: process.env.MUD_JWT_SECRET,
  expiresIn: process.env.MUD_JWT_EXPIRES_IN || '8h',
  refreshTokenExpiresIn: '30d',
  issuer: 'mud-engine',
  audience: 'mud-admin-panel'
};
```

### Session Security

```typescript
// session.config.ts
export const sessionConfig = {
  timeout: 60 * 60 * 1000, // 1 hour
  maxSessionsPerUser: 5,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict'
};
```

### Permission Guards

```typescript
// permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermissions = this.getRequiredPermissions(context);

    return this.checkPermissions(user, requiredPermissions);
  }
}
```

## Troubleshooting

### Common Issues

#### Login Problems

**Issue**: "Invalid credentials"
```
Solution: Check username/password in database
Verify user account is active
Check JWT secret configuration
```

**Issue**: "Account locked"
```
Solution: Check failed login attempts
Reset account lock status
Verify security settings
```

#### Permission Errors

**Issue**: "Insufficient permissions"
```
Solution: Verify user role assignments
Check permission matrix
Review custom permission settings
```

#### API Connection Issues

**Issue**: "Network error"
```
Solution: Verify server is running
Check CORS configuration
Validate API endpoint URLs
```

### Performance Issues

#### Slow Dashboard Loading

**Symptoms**: Dashboard takes >5 seconds to load
```
Solutions:
- Check database connection pool
- Optimize dashboard queries
- Implement caching layer
- Review system resource usage
```

#### Memory Usage High

**Symptoms**: Server memory >80% usage
```
Solutions:
- Monitor active sessions
- Implement session cleanup
- Review memory leaks
- Optimize data structures
```

### Logging and Monitoring

#### Enable Debug Logging

```bash
# Enable debug mode
MUD_LOG_LEVEL=debug npm run server:start

# Check logs
tail -f logs/mud-engine.log
```

#### Monitor System Health

```typescript
// Health check endpoint
GET /admin/health

// Performance metrics
GET /admin/metrics
```

## Best Practices

### Security Best Practices

1. **Use Strong Passwords**: Enforce password complexity requirements
2. **Enable HTTPS**: Use SSL/TLS in production environments
3. **Regular Audits**: Review admin actions and access logs
4. **Principle of Least Privilege**: Grant minimal required permissions
5. **Session Management**: Implement proper session timeouts and cleanup

### Performance Best Practices

1. **Database Optimization**: Use proper indexing and query optimization
2. **Caching Strategy**: Implement Redis or similar for frequently accessed data
3. **Load Balancing**: Distribute load across multiple server instances
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Resource Limits**: Configure appropriate resource limits and quotas

### Content Management Best Practices

1. **Version Control**: Use version control for dialogue and world content
2. **Backup Strategy**: Regular backups of critical game data
3. **Testing Environment**: Test content changes in staging before production
4. **Documentation**: Maintain comprehensive content documentation
5. **Collaboration**: Use proper workflows for team content creation

### Development Best Practices

1. **Code Reviews**: Require code reviews for admin panel changes
2. **Automated Testing**: Comprehensive test coverage for all features
3. **API Documentation**: Keep API documentation current and accurate
4. **Error Handling**: Implement proper error handling and logging
5. **User Experience**: Focus on intuitive and responsive UI design

---

## Support and Resources

- **Documentation**: [Full API Reference](api.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Community**: [Discord Server](https://discord.gg/your-server)
- **Contributing**: [Contribution Guide](../CONTRIBUTING.md)

## Changelog

### v1.0.0
- Initial release of comprehensive admin panel
- Role-based access control implementation
- Real-time dashboard and monitoring
- Interactive world and dialogue management tools

### Future Enhancements
- Advanced analytics and reporting
- Bulk content management tools
- Plugin management interface
- Advanced user behavior analytics
- Automated content generation tools

---

**Last Updated**: August 26, 2025
**Version**: 1.0.0