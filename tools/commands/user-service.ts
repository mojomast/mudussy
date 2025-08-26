/**
 * User Service CLI Commands Module
 *
 * Integrates with the server-side UserService for user management operations
 * Provides commands like: admin:user add, admin:user promote, admin:user demote, admin:user list, admin:user delete
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { UserRole, IUser } from '../../server/networking/user.types.js';

interface UserServiceCommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
  projectRoot?: string;
}

export class UserServiceCommands {
  private options: UserServiceCommandOptions;
  private usersFile: string;
  private sessionsFile: string;

  constructor(options: UserServiceCommandOptions) {
    this.options = options;
    const dataDir = path.join(options.projectRoot!, 'data');
    this.usersFile = path.join(dataDir, 'users.json');
    this.sessionsFile = path.join(dataDir, 'sessions.json');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * User management command that integrates with UserService
   */
  getUserCommand(): Command {
    const command = new Command('user')
      .description('User management operations (UserService integration)')
      .addCommand(this.getUserAddCommand())
      .addCommand(this.getUserListCommand())
      .addCommand(this.getUserPromoteCommand())
      .addCommand(this.getUserDemoteCommand())
      .addCommand(this.getUserDeleteCommand())
      .addCommand(this.getUserInfoCommand());

    return command;
  }

  /**
   * Get individual user management commands for direct registration
   */
  getUserAddCommandOnly(): Command {
    return this.getUserAddCommand();
  }

  getUserListCommandOnly(): Command {
    return this.getUserListCommand();
  }

  getUserPromoteCommandOnly(): Command {
    return this.getUserPromoteCommand();
  }

  getUserDemoteCommandOnly(): Command {
    return this.getUserDemoteCommand();
  }

  getUserDeleteCommandOnly(): Command {
    return this.getUserDeleteCommand();
  }

  getUserInfoCommandOnly(): Command {
    return this.getUserInfoCommand();
  }

  /**
   * User add subcommand
   */
  private getUserAddCommand(): Command {
    return new Command('add')
      .description('Add a new user')
      .argument('<username>', 'username')
      .option('-p, --password <password>', 'password')
      .option('-r, --role <role>', 'user role (player, moderator, admin)', 'player')
      .action(async (username, options) => {
        await this.addUser(username, options);
      });
  }

  /**
   * User list subcommand
   */
  private getUserListCommand(): Command {
    return new Command('list')
      .description('List all users')
      .option('-r, --role <role>', 'filter by role')
      .option('-a, --all', 'include inactive users')
      .action(async (options) => {
        await this.listUsers(options);
      });
  }

  /**
   * User promote subcommand
   */
  private getUserPromoteCommand(): Command {
    return new Command('promote')
      .description('Promote user to higher role')
      .argument('<username>', 'username to promote')
      .action(async (username) => {
        await this.promoteUser(username);
      });
  }

  /**
   * User demote subcommand
   */
  private getUserDemoteCommand(): Command {
    return new Command('demote')
      .description('Demote user to lower role')
      .argument('<username>', 'username to demote')
      .action(async (username) => {
        await this.demoteUser(username);
      });
  }

  /**
   * User delete subcommand
   */
  private getUserDeleteCommand(): Command {
    return new Command('delete')
      .description('Delete a user')
      .argument('<username>', 'username to delete')
      .option('-f, --force', 'force deletion without confirmation')
      .action(async (username, options) => {
        await this.deleteUser(username, options);
      });
  }

  /**
   * User info subcommand
   */
  private getUserInfoCommand(): Command {
    return new Command('info')
      .description('Show detailed user information')
      .argument('<username>', 'username')
      .action(async (username) => {
        await this.showUserInfo(username);
      });
  }

  /**
   * Add a new user
   */
  private async addUser(username: string, options: any) {
    try {
      const users = this.loadUsers();

      // Check if user already exists
      if (users.find(u => u.username === username)) {
        console.error(chalk.red(`User "${username}" already exists`));
        return;
      }

      // Validate role
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(options.role)) {
        console.error(chalk.red(`Invalid role "${options.role}". Valid roles: ${validRoles.join(', ')}`));
        return;
      }

      // Get password
      let password = options.password;
      if (!password) {
        console.error(chalk.red('Password is required. Use --password option.'));
        return;
      }

      // Create user
      const user: IUser = {
        id: this.generateId(),
        username,
        password, // Plaintext for testing (as per UserService)
        role: options.role,
        createdAt: new Date(),
        isActive: true
      };

      users.push(user);
      this.saveUsers(users);

      console.log(chalk.green(`✅ User "${username}" created successfully`));
      if (this.options.verbose) {
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      }

    } catch (error) {
      console.error(chalk.red('Failed to add user:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * List all users
   */
  private async listUsers(options: any) {
    try {
      const users = this.loadUsers();
      let filteredUsers = users;

      // Filter by role if specified
      if (options.role) {
        filteredUsers = users.filter(u => u.role === options.role);
      }

      // Filter active users unless --all is specified
      if (!options.all) {
        filteredUsers = filteredUsers.filter(u => u.isActive);
      }

      if (filteredUsers.length === 0) {
        console.log(chalk.yellow('No users found'));
        return;
      }

      console.log(chalk.blue('👥 Users:'));
      filteredUsers.forEach(user => {
        const status = user.isActive ? 'active' : 'inactive';
        const statusColor = user.isActive ? chalk.green : chalk.red;
        console.log(`  ${user.username} (${statusColor(status)}) - ${chalk.cyan(user.role)}`);
        if (this.options.verbose) {
          console.log(`    ID: ${user.id}`);
          console.log(`    Created: ${user.createdAt.toLocaleString()}`);
          console.log(`    Last Login: ${user.lastLogin?.toLocaleString() || 'Never'}`);
        }
      });

      // Show summary
      if (!this.options.quiet) {
        const activeCount = filteredUsers.filter(u => u.isActive).length;
        const roleCounts = filteredUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log(chalk.gray(`\nTotal: ${filteredUsers.length} users (${activeCount} active)`));
        Object.entries(roleCounts).forEach(([role, count]) => {
          console.log(chalk.gray(`  ${role}: ${count}`));
        });
      }

    } catch (error) {
      console.error(chalk.red('Failed to list users:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Promote user to higher role
   */
  private async promoteUser(username: string) {
    try {
      const users = this.loadUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        console.error(chalk.red(`User "${username}" not found`));
        return;
      }

      if (!user.isActive) {
        console.error(chalk.red(`User "${username}" is inactive`));
        return;
      }

      const currentRoleIndex = this.getRoleHierarchy(user.role);
      const nextRole = this.getNextRole(user.role);

      if (!nextRole) {
        console.log(chalk.yellow(`User "${username}" is already at the highest role (${user.role})`));
        return;
      }

      user.role = nextRole;
      this.saveUsers(users);

      console.log(chalk.green(`✅ User "${username}" promoted from ${this.getPreviousRole(nextRole)} to ${nextRole}`));

    } catch (error) {
      console.error(chalk.red('Failed to promote user:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Demote user to lower role
   */
  private async demoteUser(username: string) {
    try {
      const users = this.loadUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        console.error(chalk.red(`User "${username}" not found`));
        return;
      }

      if (!user.isActive) {
        console.error(chalk.red(`User "${username}" is inactive`));
        return;
      }

      const currentRoleIndex = this.getRoleHierarchy(user.role);
      const previousRole = this.getPreviousRole(user.role);

      if (!previousRole) {
        console.log(chalk.yellow(`User "${username}" is already at the lowest role (${user.role})`));
        return;
      }

      user.role = previousRole;
      this.saveUsers(users);

      console.log(chalk.green(`✅ User "${username}" demoted from ${this.getNextRole(previousRole)} to ${previousRole}`));

    } catch (error) {
      console.error(chalk.red('Failed to demote user:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Delete a user
   */
  private async deleteUser(username: string, options: any) {
    try {
      const users = this.loadUsers();
      const userIndex = users.findIndex(u => u.username === username);

      if (userIndex === -1) {
        console.error(chalk.red(`User "${username}" not found`));
        return;
      }

      if (!options.force) {
        console.log(chalk.yellow(`⚠️ This will permanently delete user "${username}". Use --force to confirm.`));
        return;
      }

      users.splice(userIndex, 1);
      this.saveUsers(users);
      console.log(chalk.green(`✅ User "${username}" deleted successfully`));

    } catch (error) {
      console.error(chalk.red('Failed to delete user:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Show detailed user information
   */
  private async showUserInfo(username: string) {
    try {
      const users = this.loadUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        console.error(chalk.red(`User "${username}" not found`));
        return;
      }

      console.log(chalk.blue(`👤 User Information: ${username}`));
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Role: ${chalk.cyan(user.role)}`);
      console.log(`  Status: ${user.isActive ? chalk.green('Active') : chalk.red('Inactive')}`);
      console.log(`  Created: ${user.createdAt.toLocaleString()}`);
      console.log(`  Last Login: ${user.lastLogin?.toLocaleString() || 'Never'}`);

      // Show role hierarchy info
      const hierarchy = this.getRoleHierarchy(user.role);
      const roleDisplayName = this.getRoleDisplayName(user.role);
      console.log(`  Role Level: ${hierarchy} (${roleDisplayName})`);

      const nextRole = this.getNextRole(user.role);
      const previousRole = this.getPreviousRole(user.role);

      if (nextRole) {
        console.log(`  Can promote to: ${chalk.green(nextRole)}`);
      } else {
        console.log(`  Can promote to: ${chalk.gray('None (highest role)')}`);
      }

      if (previousRole) {
        console.log(`  Can demote to: ${chalk.red(previousRole)}`);
      } else {
        console.log(`  Can demote to: ${chalk.gray('None (lowest role)')}`);
      }

    } catch (error) {
      console.error(chalk.red('Failed to show user info:'), error.message);
      if (this.options.verbose) {
        console.error(error);
      }
    }
  }

  /**
   * Get role hierarchy level
   */
  private getRoleHierarchy(role: UserRole): number {
    const hierarchy = {
      [UserRole.PLAYER]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3
    };
    return hierarchy[role] || 0;
  }

  /**
   * Get next higher role
   */
  private getNextRole(role: UserRole): UserRole | null {
    switch (role) {
      case UserRole.PLAYER:
        return UserRole.MODERATOR;
      case UserRole.MODERATOR:
        return UserRole.ADMIN;
      case UserRole.ADMIN:
        return null;
      default:
        return null;
    }
  }

  /**
   * Get previous lower role
   */
  private getPreviousRole(role: UserRole): UserRole | null {
    switch (role) {
      case UserRole.PLAYER:
        return null;
      case UserRole.MODERATOR:
        return UserRole.PLAYER;
      case UserRole.ADMIN:
        return UserRole.MODERATOR;
      default:
        return null;
    }
  }

  /**
   * Get display name for role
   */
  private getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.MODERATOR:
        return 'Moderator';
      case UserRole.PLAYER:
        return 'Player';
      default:
        return 'Unknown';
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Load users from file
   */
  private loadUsers(): IUser[] {
    try {
      if (!fs.existsSync(this.usersFile)) {
        return [];
      }
      const data = fs.readFileSync(this.usersFile, 'utf8');
      const users = JSON.parse(data);

      // Convert date strings back to Date objects
      users.forEach((user: IUser) => {
        user.createdAt = new Date(user.createdAt);
        if (user.lastLogin) {
          user.lastLogin = new Date(user.lastLogin);
        }
      });

      return users;
    } catch (error) {
      if (this.options.verbose) {
        console.warn('Failed to load users:', error.message);
      }
      return [];
    }
  }

  /**
   * Save users to file
   */
  private saveUsers(users: IUser[]) {
    const data = JSON.stringify(users, null, 2);
    fs.writeFileSync(this.usersFile, data, 'utf8');
  }
}