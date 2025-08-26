import { Command } from 'commander';
interface UserServiceCommandOptions {
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    projectRoot?: string;
}
export declare class UserServiceCommands {
    private options;
    private usersFile;
    private sessionsFile;
    constructor(options: UserServiceCommandOptions);
    getUserCommand(): Command;
    getUserAddCommandOnly(): Command;
    getUserListCommandOnly(): Command;
    getUserPromoteCommandOnly(): Command;
    getUserDemoteCommandOnly(): Command;
    getUserDeleteCommandOnly(): Command;
    getUserInfoCommandOnly(): Command;
    private getUserAddCommand;
    private getUserListCommand;
    private getUserPromoteCommand;
    private getUserDemoteCommand;
    private getUserDeleteCommand;
    private getUserInfoCommand;
    private addUser;
    private listUsers;
    private promoteUser;
    private demoteUser;
    private deleteUser;
    private showUserInfo;
    private getRoleHierarchy;
    private getNextRole;
    private getPreviousRole;
    private getRoleDisplayName;
    private generateId;
    private loadUsers;
    private saveUsers;
}
export {};
