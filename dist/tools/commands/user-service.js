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
exports.UserServiceCommands = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const user_types_js_1 = require("../../server/networking/user.types.js");
class UserServiceCommands {
    constructor(options) {
        this.options = options;
        const dataDir = path.join(options.projectRoot, 'data');
        this.usersFile = path.join(dataDir, 'users.json');
        this.sessionsFile = path.join(dataDir, 'sessions.json');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    getUserCommand() {
        const command = new commander_1.Command('user')
            .description('User management operations (UserService integration)')
            .addCommand(this.getUserAddCommand())
            .addCommand(this.getUserListCommand())
            .addCommand(this.getUserPromoteCommand())
            .addCommand(this.getUserDemoteCommand())
            .addCommand(this.getUserDeleteCommand())
            .addCommand(this.getUserInfoCommand());
        return command;
    }
    getUserAddCommandOnly() {
        return this.getUserAddCommand();
    }
    getUserListCommandOnly() {
        return this.getUserListCommand();
    }
    getUserPromoteCommandOnly() {
        return this.getUserPromoteCommand();
    }
    getUserDemoteCommandOnly() {
        return this.getUserDemoteCommand();
    }
    getUserDeleteCommandOnly() {
        return this.getUserDeleteCommand();
    }
    getUserInfoCommandOnly() {
        return this.getUserInfoCommand();
    }
    getUserAddCommand() {
        return new commander_1.Command('add')
            .description('Add a new user')
            .argument('<username>', 'username')
            .option('-p, --password <password>', 'password')
            .option('-r, --role <role>', 'user role (player, moderator, admin)', 'player')
            .action(async (username, options) => {
            await this.addUser(username, options);
        });
    }
    getUserListCommand() {
        return new commander_1.Command('list')
            .description('List all users')
            .option('-r, --role <role>', 'filter by role')
            .option('-a, --all', 'include inactive users')
            .action(async (options) => {
            await this.listUsers(options);
        });
    }
    getUserPromoteCommand() {
        return new commander_1.Command('promote')
            .description('Promote user to higher role')
            .argument('<username>', 'username to promote')
            .action(async (username) => {
            await this.promoteUser(username);
        });
    }
    getUserDemoteCommand() {
        return new commander_1.Command('demote')
            .description('Demote user to lower role')
            .argument('<username>', 'username to demote')
            .action(async (username) => {
            await this.demoteUser(username);
        });
    }
    getUserDeleteCommand() {
        return new commander_1.Command('delete')
            .description('Delete a user')
            .argument('<username>', 'username to delete')
            .option('-f, --force', 'force deletion without confirmation')
            .action(async (username, options) => {
            await this.deleteUser(username, options);
        });
    }
    getUserInfoCommand() {
        return new commander_1.Command('info')
            .description('Show detailed user information')
            .argument('<username>', 'username')
            .action(async (username) => {
            await this.showUserInfo(username);
        });
    }
    async addUser(username, options) {
        try {
            const users = this.loadUsers();
            if (users.find(u => u.username === username)) {
                console.error(chalk_1.default.red(`User "${username}" already exists`));
                return;
            }
            const validRoles = Object.values(user_types_js_1.UserRole);
            if (!validRoles.includes(options.role)) {
                console.error(chalk_1.default.red(`Invalid role "${options.role}". Valid roles: ${validRoles.join(', ')}`));
                return;
            }
            let password = options.password;
            if (!password) {
                console.error(chalk_1.default.red('Password is required. Use --password option.'));
                return;
            }
            const user = {
                id: this.generateId(),
                username,
                password,
                role: options.role,
                createdAt: new Date(),
                isActive: true
            };
            users.push(user);
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" created successfully`));
            if (this.options.verbose) {
                console.log(`   ID: ${user.id}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt.toLocaleString()}`);
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
            let filteredUsers = users;
            if (options.role) {
                filteredUsers = users.filter(u => u.role === options.role);
            }
            if (!options.all) {
                filteredUsers = filteredUsers.filter(u => u.isActive);
            }
            if (filteredUsers.length === 0) {
                console.log(chalk_1.default.yellow('No users found'));
                return;
            }
            console.log(chalk_1.default.blue('👥 Users:'));
            filteredUsers.forEach(user => {
                const status = user.isActive ? 'active' : 'inactive';
                const statusColor = user.isActive ? chalk_1.default.green : chalk_1.default.red;
                console.log(`  ${user.username} (${statusColor(status)}) - ${chalk_1.default.cyan(user.role)}`);
                if (this.options.verbose) {
                    console.log(`    ID: ${user.id}`);
                    console.log(`    Created: ${user.createdAt.toLocaleString()}`);
                    console.log(`    Last Login: ${user.lastLogin?.toLocaleString() || 'Never'}`);
                }
            });
            if (!this.options.quiet) {
                const activeCount = filteredUsers.filter(u => u.isActive).length;
                const roleCounts = filteredUsers.reduce((acc, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {});
                console.log(chalk_1.default.gray(`\nTotal: ${filteredUsers.length} users (${activeCount} active)`));
                Object.entries(roleCounts).forEach(([role, count]) => {
                    console.log(chalk_1.default.gray(`  ${role}: ${count}`));
                });
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to list users:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async promoteUser(username) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            if (!user.isActive) {
                console.error(chalk_1.default.red(`User "${username}" is inactive`));
                return;
            }
            const currentRoleIndex = this.getRoleHierarchy(user.role);
            const nextRole = this.getNextRole(user.role);
            if (!nextRole) {
                console.log(chalk_1.default.yellow(`User "${username}" is already at the highest role (${user.role})`));
                return;
            }
            user.role = nextRole;
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" promoted from ${this.getPreviousRole(nextRole)} to ${nextRole}`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to promote user:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    async demoteUser(username) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            if (!user.isActive) {
                console.error(chalk_1.default.red(`User "${username}" is inactive`));
                return;
            }
            const currentRoleIndex = this.getRoleHierarchy(user.role);
            const previousRole = this.getPreviousRole(user.role);
            if (!previousRole) {
                console.log(chalk_1.default.yellow(`User "${username}" is already at the lowest role (${user.role})`));
                return;
            }
            user.role = previousRole;
            this.saveUsers(users);
            console.log(chalk_1.default.green(`✅ User "${username}" demoted from ${this.getNextRole(previousRole)} to ${previousRole}`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to demote user:'), error.message);
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
    async showUserInfo(username) {
        try {
            const users = this.loadUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                console.error(chalk_1.default.red(`User "${username}" not found`));
                return;
            }
            console.log(chalk_1.default.blue(`👤 User Information: ${username}`));
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Role: ${chalk_1.default.cyan(user.role)}`);
            console.log(`  Status: ${user.isActive ? chalk_1.default.green('Active') : chalk_1.default.red('Inactive')}`);
            console.log(`  Created: ${user.createdAt.toLocaleString()}`);
            console.log(`  Last Login: ${user.lastLogin?.toLocaleString() || 'Never'}`);
            const hierarchy = this.getRoleHierarchy(user.role);
            const roleDisplayName = this.getRoleDisplayName(user.role);
            console.log(`  Role Level: ${hierarchy} (${roleDisplayName})`);
            const nextRole = this.getNextRole(user.role);
            const previousRole = this.getPreviousRole(user.role);
            if (nextRole) {
                console.log(`  Can promote to: ${chalk_1.default.green(nextRole)}`);
            }
            else {
                console.log(`  Can promote to: ${chalk_1.default.gray('None (highest role)')}`);
            }
            if (previousRole) {
                console.log(`  Can demote to: ${chalk_1.default.red(previousRole)}`);
            }
            else {
                console.log(`  Can demote to: ${chalk_1.default.gray('None (lowest role)')}`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to show user info:'), error.message);
            if (this.options.verbose) {
                console.error(error);
            }
        }
    }
    getRoleHierarchy(role) {
        const hierarchy = {
            [user_types_js_1.UserRole.PLAYER]: 1,
            [user_types_js_1.UserRole.MODERATOR]: 2,
            [user_types_js_1.UserRole.ADMIN]: 3
        };
        return hierarchy[role] || 0;
    }
    getNextRole(role) {
        switch (role) {
            case user_types_js_1.UserRole.PLAYER:
                return user_types_js_1.UserRole.MODERATOR;
            case user_types_js_1.UserRole.MODERATOR:
                return user_types_js_1.UserRole.ADMIN;
            case user_types_js_1.UserRole.ADMIN:
                return null;
            default:
                return null;
        }
    }
    getPreviousRole(role) {
        switch (role) {
            case user_types_js_1.UserRole.PLAYER:
                return null;
            case user_types_js_1.UserRole.MODERATOR:
                return user_types_js_1.UserRole.PLAYER;
            case user_types_js_1.UserRole.ADMIN:
                return user_types_js_1.UserRole.MODERATOR;
            default:
                return null;
        }
    }
    getRoleDisplayName(role) {
        switch (role) {
            case user_types_js_1.UserRole.ADMIN:
                return 'Administrator';
            case user_types_js_1.UserRole.MODERATOR:
                return 'Moderator';
            case user_types_js_1.UserRole.PLAYER:
                return 'Player';
            default:
                return 'Unknown';
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    loadUsers() {
        try {
            if (!fs.existsSync(this.usersFile)) {
                return [];
            }
            const data = fs.readFileSync(this.usersFile, 'utf8');
            const users = JSON.parse(data);
            users.forEach((user) => {
                user.createdAt = new Date(user.createdAt);
                if (user.lastLogin) {
                    user.lastLogin = new Date(user.lastLogin);
                }
            });
            return users;
        }
        catch (error) {
            if (this.options.verbose) {
                console.warn('Failed to load users:', error.message);
            }
            return [];
        }
    }
    saveUsers(users) {
        const data = JSON.stringify(users, null, 2);
        fs.writeFileSync(this.usersFile, data, 'utf8');
    }
}
exports.UserServiceCommands = UserServiceCommands;
//# sourceMappingURL=user-service.js.map