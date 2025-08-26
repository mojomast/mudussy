"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class AdminCommands {
    constructor(options) {
        this.options = options;
        const dataDir = path.join(options.projectRoot, 'data', 'admin');
        this.usersFile = path.join(dataDir, 'users.json');
        this.rolesFile = path.join(dataDir, 'roles.json');
        this.tokensFile = path.join(dataDir, 'tokens.json');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    getUserCommand() {
        const command = new commander_1.Command('user')
            .description('User management operations')
            .addCommand(this.getUserAddCommand())
            .addCommand(this.getUserListCommand())
            .addCommand(this.getUserUpdateCommand())
            .addCommand(this.getUserDeleteCommand())
            .addCommand(this.getUserGrantCommand())
            .addCommand(this.getUserRevokeCommand());
        return command;
    }
    getRoleCommand() {
        const command = new commander_1.Command('role')
            .description('Role management operations')
            .addCommand(this.getRoleAddCommand())
            .addCommand(this.getRoleListCommand())
            .addCommand(this.getRoleUpdateCommand())
            .addCommand(this.getRoleDeleteCommand());
        return command;
    }
    getAuthCommand() {
        const command = new commander_1.Command('auth')
            .description('Authentication and authorization operations')
            .addCommand(this.getAuthLoginCommand())
            .addCommand(this.getAuthLogoutCommand())
            .addCommand(this.getAuthTokenCommand())
            .addCommand(this.getAuthValidateCommand());
        return command;
    }
    getMonitorCommand() {
        const command = new commander_1.Command('monitor')
            .description('System monitoring and statistics')
            .option('-r, --real-time', 'real-time monitoring mode')
            .option('-i, --interval <seconds>', 'monitoring interval', '5')
            .action(async (options) => {
            await this.monitorSystem(options);
        });
        return command;
    }
    getUserAddCommand() {
        return new commander_1.Command('add')
            .description('Add a new user')
            .argument('<username>', 'username')
            .option('-e, --email <email>', 'email address')
            .option('-r, --roles <roles>', 'comma-separated roles', 'user')
            .option('-p, --password <password>', 'password (will prompt if not provided)')
            .action(async (username, options) => {
            await this.addUser(username, options);
        });
    }
    getUserListCommand() {
        return new commander_1.Command('list')
            .description('List all users')
            .option('-d, --detailed', 'show detailed information')
            .action(async (options) => {
            await this.listUsers(options);
        });
    }
    getUserUpdateCommand() {
        return new commander_1.Command('update')
            .description('Update user information')
            .argument('<username>', 'username')
            .option('-e, --email <email>', 'new email address')
            .option('-p, --password <password>', 'new password')
            .option('--active <boolean>', 'set active status')
            .action(async (username, options) => {
            await this.updateUser(username, options);
        });
    }
    getUserDeleteCommand() {
        return new commander_1.Command('delete')
            .description('Delete a user')
            .argument('<username>', 'username')
            .option('-f, --force', 'force deletion without confirmation')
            .action(async (username, options) => {
            await this.deleteUser(username, options);
        });
    }
    getUserGrantCommand() {
        return new commander_1.Command('grant')
            .description('Grant role to user')
            .argument('<username>', 'username')
            .argument('<role>', 'role name')
            .action(async (username, role) => {
            await this.grantRole(username, role);
        });
    }
    getUserRevokeCommand() {
        return new commander_1.Command('revoke')
            .description('Revoke role from user')
            .argument('<username>', 'username')
            .argument('<role>', 'role name')
            .action(async (username, role) => {
            await this.revokeRole(username, role);
        });
    }
    getRoleAddCommand() {
        return new commander_1.Command('add')
            .description('Add a new role')
            .argument('<name>', 'role name')
            .option('-d, --description <desc>', 'role description')
            .option('-p, --permissions <perms>', 'comma-separated permissions', 'read')
            .action(async (name, options) => {
            await this.addRole(name, options);
        });
    }
    getRoleListCommand() {
        return new commander_1.Command('list')
            .description('List all roles')
            .option('-d, --detailed', 'show detailed information')
            .action(async (options) => {
            await this.listRoles(options);
        });
    }
    getRoleUpdateCommand() {
        return new commander_1.Command('update')
            .description('Update role information')
            .argument('<name>', 'role name')
            .option('-d, --description <desc>', 'new description')
            .option('-p, --permissions <perms>', 'comma-separated permissions')
            .action(async (name, options) => {
            await this.updateRole(name, options);
        });
    }
    getRoleDeleteCommand() {
        return new commander_1.Command('delete')
            .description('Delete a role')
            .argument('<name>', 'role name')
            .option('-f, --force', 'force deletion without confirmation')
            .action(async (name, options) => {
            await this.deleteRole(name, options);
        });
    }
    getAuthLoginCommand() {
        return new commander_1.Command('login')
            .description('Login as user')
            .argument('<username>', 'username')
            .option('-p, --password <password>', 'password')
            .action(async (username, options) => {
            await this.login(username, options);
        });
    }
    getAuthLogoutCommand() {
        return new commander_1.Command('logout')
            .description('Logout current user')
            .action(async () => {
            await this.logout();
        });
    }
    getAuthTokenCommand() {
        return new commander_1.Command('token')
            .description('Manage authentication tokens')
            .addCommand(this.getTokenGenerateCommand())
            .addCommand(this.getTokenListCommand())
            .addCommand(this.getTokenRevokeCommand());
    }
    getAuthValidateCommand() {
        return new commander_1.Command('validate')
            .description('Validate authentication token')
            .argument('<token>', 'token to validate')
            .action(async (token) => {
            await this.validateToken(token);
        });
    }
    getTokenGenerateCommand() {
        return new commander_1.Command('generate')
            .description('Generate authentication token')
            .argument('<username>', 'username')
            .option('-e, --expires <hours>', 'token expiration in hours', '24')
            .action(async (username, options) => {
            await this.generateToken(username, options);
        });
    }
    getTokenListCommand() {
        return new commander_1.Command('list')
            .description('List authentication tokens')
            .option('-u, --user <username>', 'filter by username')
            .action(async (options) => {
            await this.listTokens(options);
        });
    }
    getTokenRevokeCommand() {
        return new commander_1.Command('revoke')
            .description('Revoke authentication token')
            .argument('<tokenId>', 'token ID')
            .action(async (tokenId) => {
            await this.revokeToken(tokenId);
        });
    }
    async addUser(username, options) {
        try {
            const users = this.loadUsers();
            if (users.find(u => u.username === username)) {
                console.error(chalk_1.default.red(`User "${username}" already exists`));
                return;
            }
            let password = options.password;
            if (!password) {
                password = 'defaultPassword123';
                console.log(chalk_1.default.yellow('⚠️ Using default password. Please change it immediately.'));
            }
            const user = {
                id: crypto.randomUUID(),
                username,
                email: options.email,
                passwordHash: this.hashPassword(password),
                roles: options.roles.split(',').map((r) => r.trim()),
                created: new Date(),
                active: true
            };
            users.push(user);
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" created successfully`));
            if (this.options.verbose) {
                console.log(`   ID: ${user.id}`);
                console.log(`   Roles: ${user.roles.join(', ')}`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to add user:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async listUsers(options) {
        try {
            const users = this.loadUsers();
            if (users.length === 0) {
                console.log(chalk_1.default.yellow('No users found'));
                return;
            }
            console.log(chalk_1.default.blue('👥 Users:'));
            users.forEach(user => {
                console.log(`  ${user.username} (${user.active ? 'active' : 'inactive'})`);
                if (options.detailed) {
                    console.log(`    ID: ${user.id}`);
                    console.log(`    Email: ${user.email || 'Not set'}`);
                    console.log(`    Roles: ${user.roles.join(', ')}`);
                    console.log(`    Created: ${user.created.toLocaleString()}`);
                    console.log(`    Last Login: ${user.lastLogin?.toLocaleString() || 'Never'}`);
                }
            });
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to list users:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async updateUser(username, options) {
        try {
            const users = this.loadUsers();
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex === -1) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            const user = users[userIndex];
            if (options.email)
                user.email = options.email;
            if (options.password)
                user.passwordHash = this.hashPassword(options.password);
            if (options.active !== undefined)
                user.active = options.active === 'true';
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" updated successfully`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to update user:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async deleteUser(username, options) {
        try {
            const users = this.loadUsers();
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex === -1) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            if (!options.force) {
                console.log(chalk_1.default.yellow(`⚠️ This will permanently delete user "${username}". Use --force to confirm.`));
                return;
            }
            users.splice(userIndex, 1);
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" deleted successfully`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to delete user:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async grantRole(username, role) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            if (!user.roles.includes(role)) {
                user.roles.push(role);
                this.saveUsers(users);
                console.log(chalk_1.default.green(`✅ Role "${role}" granted to user "${username}"`));
            }
            else {
                console.log(chalk_1.default.yellow(`User "${username}" already has role "${role}"`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to grant role:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async revokeRole(username, role) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            const roleIndex = user.roles.indexOf(role);
            if (roleIndex !== -1) {
                user.roles.splice(roleIndex, 1);
                this.saveUsers(users);
                console.log(chalk_1.default.green(`✅ Role "${role}" revoked from user "${username}"`));
            }
            else {
                console.log(chalk_1.default.yellow(`User "${username}" does not have role "${role}"`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to revoke role:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async addRole(name, options) {
        try {
            const roles = this.loadRoles();
            if (roles.find(r => r.name === name)) {
                console.error(chalk_1.default.red(`Role "${name}" already exists`));
                return;
            }
            const role = {
                id: crypto.randomUUID(),
                name,
                description: options.description || '',
                permissions: options.permissions.split(',').map((p) => p.trim()),
                created: new Date()
            };
            roles.push(role);
            this.saveRoles(roles);
            console.log(chalk_1.default.green(`✅ Role "${name}" created successfully`));
            if (this.options.verbose) {
                console.log(`   ID: ${role.id}`);
                console.log(`   Permissions: ${role.permissions.join(', ')}`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to add role:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async listRoles(options) {
        try {
            const roles = this.loadRoles();
            if (roles.length === 0) {
                console.log(chalk_1.default.yellow('No roles found'));
                return;
            }
            console.log(chalk_1.default.blue('🎭 Roles:'));
            roles.forEach(role => {
                console.log(`  ${role.name}`);
                if (options.detailed) {
                    console.log(`    ID: ${role.id}`);
                    console.log(`    Description: ${role.description || 'No description'}`);
                    console.log(`    Permissions: ${role.permissions.join(', ')}`);
                    console.log(`    Created: ${role.created.toLocaleString()}`);
                }
            });
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to list roles:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async updateRole(name, options) {
        try {
            const roles = this.loadRoles();
            const role = roles.find(r => r.name === name);
            if (!role) {
                console.error(chalk_1.default.red(`Role "${name}" not found`));
                return;
            }
            if (options.description)
                role.description = options.description;
            if (options.permissions) {
                role.permissions = options.permissions.split(',').map((p) => p.trim());
            }
            this.saveRoles(roles);
            console.log(chalk_1.default.green(`✅ Role "${name}" updated successfully`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to update role:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async deleteRole(name, options) {
        try {
            const roles = this.loadRoles();
            const roleIndex = roles.findIndex(r => r.name === name);
            if (roleIndex === -1) {
                console.error(chalk_1.default.red(`Role "${name}" not found`));
                return;
            }
            if (!options.force) {
                console.log(chalk_1.default.yellow(`⚠️ This will permanently delete role "${name}". Use --force to confirm.`));
                return;
            }
            roles.splice(roleIndex, 1);
            this.saveRoles(roles);
            console.log(chalk_1.default.green(`✅ Role "${name}" deleted successfully`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to delete role:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async login(username, options) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            if (!user.active) {
                console.error(chalk_1.default.red(`User "${username}" is inactive`));
                return;
            }
            console.log(chalk_1.default.green(`✅ Logged in as "${username}"`));
            user.lastLogin = new Date();
            this.saveUsers(users);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to login:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async logout() {
        try {
            console.log(chalk_1.default.green('✅ Logged out successfully'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to logout:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async generateToken(username, options) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            const token = {
                id: crypto.randomUUID(),
                userId: user.id,
                token: crypto.randomBytes(32).toString('hex'),
                expires: new Date(Date.now() + (parseInt(options.expires) * 60 * 60 * 1000)),
                created: new Date()
            };
            const tokens = this.loadTokens();
            tokens.push(token);
            this.saveTokens(tokens);
            console.log(chalk_1.default.green(`✅ Token generated for user "${username}"`));
            console.log(`   Token: ${token.token}`);
            console.log(`   Expires: ${token.expires.toLocaleString()}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to generate token:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async listTokens(options) {
        try {
            const tokens = this.loadTokens();
            const users = this.loadUsers();
            let filteredTokens = tokens;
            if (options.user) {
                const user = users.find(u => u.username === options.user);
                if (user) {
                    filteredTokens = tokens.filter(t => t.userId === user.id);
                }
            }
            if (filteredTokens.length === 0) {
                console.log(chalk_1.default.yellow('No tokens found'));
                return;
            }
            console.log(chalk_1.default.blue('🔑 Authentication Tokens:'));
            filteredTokens.forEach(token => {
                const user = users.find(u => u.id === token.userId);
                console.log(`  ${token.id} (${user?.username || 'Unknown user'})`);
                console.log(`    Expires: ${token.expires.toLocaleString()}`);
                console.log(`    Created: ${token.created.toLocaleString()}`);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to list tokens:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async revokeToken(tokenId) {
        try {
            const tokens = this.loadTokens();
            const tokenIndex = tokens.findIndex(t => t.id === tokenId);
            if (tokenIndex === -1) {
                console.error(chalk_1.default.red(`Token "${tokenId}" not found`));
                return;
            }
            tokens.splice(tokenIndex, 1);
            this.saveTokens(tokens);
            console.log(chalk_1.default.green(`✅ Token "${tokenId}" revoked successfully`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to revoke token:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async validateToken(token) {
        try {
            const tokens = this.loadTokens();
            const authToken = tokens.find(t => t.token === token);
            if (!authToken) {
                console.error(chalk_1.default.red('Token not found'));
                return;
            }
            if (authToken.expires < new Date()) {
                console.error(chalk_1.default.red('Token has expired'));
                return;
            }
            const users = this.loadUsers();
            const user = users.find(u => u.id === authToken.userId);
            console.log(chalk_1.default.green('✅ Token is valid'));
            console.log(`   User: ${user?.username || 'Unknown'}`);
            console.log(`   Expires: ${authToken.expires.toLocaleString()}`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to validate token:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async monitorSystem(options) {
        try {
            console.log(chalk_1.default.blue('📊 System Monitoring'));
            const stats = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version
            };
            console.log(`   Platform: ${stats.platform}`);
            console.log(`   Node.js: ${stats.nodeVersion}`);
            console.log(`   Uptime: ${Math.floor(stats.uptime / 60)} minutes`);
            console.log(`   Memory: ${Math.round(stats.memory.heapUsed / 1024 / 1024)} MB used`);
            console.log(`   CPU: ${stats.cpu.user} user, ${stats.cpu.system} system`);
            if (options.realTime) {
                console.log(chalk_1.default.yellow('⚠️ Real-time monitoring not yet implemented'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to monitor system:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    loadUsers() {
        try {
            if (!fs.existsSync(this.usersFile)) {
                return [];
            }
            const data = fs.readFileSync(this.usersFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    saveUsers(users) {
        const data = JSON.stringify(users, null, 2);
        fs.writeFileSync(this.usersFile, data, 'utf8');
    }
    loadRoles() {
        try {
            if (!fs.existsSync(this.rolesFile)) {
                return [];
            }
            const data = fs.readFileSync(this.rolesFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    saveRoles(roles) {
        const data = JSON.stringify(roles, null, 2);
        fs.writeFileSync(this.rolesFile, data, 'utf8');
    }
    loadTokens() {
        try {
            if (!fs.existsSync(this.tokensFile)) {
                return [];
            }
            const data = fs.readFileSync(this.tokensFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    saveTokens(tokens) {
        const data = JSON.stringify(tokens, null, 2);
        fs.writeFileSync(this.tokensFile, data, 'utf8');
    }
}
exports.AdminCommands = AdminCommands;
//# sourceMappingURL=admin.js.map