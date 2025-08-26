#!/usr/bin/env node
export = UserSeeder;
declare class UserSeeder {
    usersFilePath: string;
    sessionsFilePath: string;
    logger: Console;
    initialize(): Promise<void>;
    loadExistingUsers(): Promise<void>;
    existingUsers: any;
    seedExampleUsers(): Promise<void>;
    saveUsers(): Promise<void>;
    getUserStats(): Promise<void>;
}
