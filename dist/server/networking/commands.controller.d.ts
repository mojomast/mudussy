import { WebClientService } from './web-client.service';
export interface CommandRequest {
    command: string;
    clientId?: string;
}
export interface CommandResponse {
    success: boolean;
    command: string;
    response?: string;
    error?: string;
    timestamp: Date;
}
export declare class CommandsController {
    private readonly webClientService;
    constructor(webClientService: WebClientService);
    executeCommand(commandRequest: CommandRequest): Promise<CommandResponse>;
    getAvailableCommands(): Promise<{
        commands: string[];
    }>;
    getCommandHelp(command: string): Promise<{
        command: string;
        help?: string;
    }>;
}
