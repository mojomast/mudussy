# MUD Admin Panel

A modern web-based admin panel for managing the MUD (Multi-User Dungeon) game server.

## Features

### Authentication
- Secure login system with JWT token-based authentication
- Role-based access control (Admin, Moderator, User)
- Persistent login sessions

### Dashboard
- System overview with key metrics
- Real-time statistics (users, rooms, NPCs, active players)
- Recent activity feed
- System health monitoring

### User Management
- View all registered users
- User role management (promote/demote users)
- Account activation/deactivation
- Password reset functionality
- User statistics and analytics

### World Management
- Overview of world sectors and rooms
- NPC management and monitoring
- Room and item statistics
- World configuration tools

### Dialogue Management
- Visual dialogue tree editor
- Dialogue validation and testing tools
- NPC conversation management
- Dialogue flow analysis

### Admin Features
- Floating admin button (⚙️) for quick access
- System settings and configuration
- Server management tools
- Advanced administrative controls

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Running MUD server backend

### Installation
1. Ensure the MUD server is running on `http://localhost:3000`
2. Open `index.html` in your web browser
3. The admin panel will load automatically

### Login Credentials
- **Admin**: username: `admin`, password: `admin`
- **Moderator**: username: `moderator`, password: `moderator`
- **User**: username: `user`, password: `user`

## Usage

### First Time Setup
1. Open the admin panel in your browser
2. Log in with appropriate credentials
3. The dashboard will display system overview

### Navigation
- Use the tab navigation to switch between different management sections
- Dashboard: System overview and statistics
- Users: User account management
- World: Game world configuration
- Dialogue: NPC conversation management

### Admin Controls
- Click the floating ⚙️ button (admins only) for additional settings
- Access system logs and server controls
- Monitor system health and performance

## Technical Details

### Architecture
- **Frontend**: React + JSX with Tailwind CSS
- **Backend Integration**: RESTful API calls to NestJS backend
- **Styling**: Terminal-inspired green-on-black theme
- **State Management**: React hooks with localStorage persistence

### API Endpoints
The admin panel communicates with these backend endpoints:
- `POST /auth/login` - User authentication
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/world/overview` - World statistics
- `GET /admin/dialogue/trees` - Dialogue management

### Role-Based Access
- **Admin**: Full access to all features and settings
- **Moderator**: Access to dashboard, users, world, and dialogue management
- **User**: Limited access (dashboard only)

## File Structure
```
clients/admin/
├── index.html          # Main HTML file
├── App.js             # Main React application
├── Components.js      # React components
└── README.md          # This documentation
```

## Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Development
To modify the admin panel:
1. Edit the React components in `App.js` and `Components.js`
2. Update styles using Tailwind CSS classes
3. Test API integration with your backend server
4. Reload the page to see changes

## Security Notes
- All API calls include authentication tokens
- Role-based permissions are enforced by the backend
- Sensitive operations require admin privileges
- Session data is stored securely in localStorage

## Troubleshooting
- **Login issues**: Ensure the backend server is running
- **Permission errors**: Check user role and backend configuration
- **API errors**: Verify backend endpoints are accessible
- **Styling issues**: Ensure Tailwind CSS is loading properly