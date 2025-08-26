#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
class UserSeeder {
    constructor() {
        this.usersFilePath = path.join(process.cwd(), 'data', 'users.json');
        this.sessionsFilePath = path.join(process.cwd(), 'data', 'sessions.json');
        this.logger = console;
    }
    async initialize() {
        try {
            await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
            await this.loadExistingUsers();
            await this.seedExampleUsers();
            this.logger.log('User seeding completed successfully');
        }
        catch (error) {
            this.logger.error('Failed to seed users:', error);
            process.exit(1);
        }
    }
    async loadExistingUsers() {
        try {
            const data = await fs.readFile(this.usersFilePath, 'utf8');
            this.existingUsers = JSON.parse(data);
            this.existingUsers.forEach(user => {
                user.createdAt = new Date(user.createdAt);
                if (user.lastLogin) {
                    user.lastLogin = new Date(user.lastLogin);
                }
            });
            this.logger.log(`Loaded ${this.existingUsers.length} existing users`);
        }
        catch (error) {
            this.existingUsers = [];
            this.logger.warn('No existing users file found, starting fresh');
        }
    }
    async seedExampleUsers() {
        const exampleUsers = [
            {
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                isActive: true
            },
            {
                username: 'mod',
                password: 'mod123',
                role: 'moderator',
                isActive: true
            },
            {
                username: 'player',
                password: 'player123',
                role: 'player',
                isActive: true
            }
        ];
        let usersAdded = 0;
        for (const userData of exampleUsers) {
            const existingUser = this.existingUsers.find(u => u.username === userData.username);
            if (!existingUser) {
                const newUser = {
                    id: uuidv4(),
                    username: userData.username,
                    password: userData.password,
                    role: userData.role,
                    createdAt: new Date(),
                    isActive: userData.isActive
                };
                this.existingUsers.push(newUser);
                usersAdded++;
                this.logger.log(`Created user: ${newUser.username} with role ${newUser.role}`);
            }
            else {
                this.logger.log(`User ${userData.username} already exists, skipping`);
            }
        }
        await this.saveUsers();
        this.logger.log(`Seeding complete. Added ${usersAdded} new users.`);
        this.logger.log('Example users:');
        this.logger.log('  Admin: admin/admin123');
        this.logger.log('  Moderator: mod/mod123');
        this.logger.log('  Player: player/player123');
    }
    async saveUsers() {
        try {
            await fs.writeFile(this.usersFilePath, JSON.stringify(this.existingUsers, null, 2));
            this.logger.log(`Saved ${this.existingUsers.length} users to ${this.usersFilePath}`);
        }
        catch (error) {
            this.logger.error('Failed to save users:', error);
            throw error;
        }
    }
    async getUserStats() {
        const stats = this.existingUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            if (user.isActive) {
                acc.active = (acc.active || 0) + 1;
            }
            else {
                acc.inactive = (acc.inactive || 0) + 1;
            }
            return acc;
        }, {});
        this.logger.log('\nUser Statistics:');
        this.logger.log(`  Total Users: ${this.existingUsers.length}`);
        this.logger.log(`  Active: ${stats.active || 0}`);
        this.logger.log(`  Inactive: ${stats.inactive || 0}`);
        this.logger.log(`  Admins: ${stats.admin || 0}`);
        this.logger.log(`  Moderators: ${stats.moderator || 0}`);
        this.logger.log(`  Players: ${stats.player || 0}`);
    }
}
if (require.main === module) {
    const seeder = new UserSeeder();
    seeder.initialize()
        .then(() => seeder.getUserStats())
        .then(() => process.exit(0))
        .catch(error => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
module.exports = UserSeeder;
//# sourceMappingURL=seed-admin-users.js.map