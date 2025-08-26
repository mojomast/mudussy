import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WebClientService } from './web-client.service';

export interface CommandRequest {
  command: string;
  clientId?: string; // For REST API usage without WebSocket
}

export interface CommandResponse {
  success: boolean;
  command: string;
  response?: string;
  error?: string;
  timestamp: Date;
}

@Controller('commands')
export class CommandsController {
  constructor(private readonly webClientService: WebClientService) {}

  @Post('execute')
  async executeCommand(@Body() commandRequest: CommandRequest): Promise<CommandResponse> {
    try {
      let clientId = commandRequest.clientId;

      // If no clientId provided, create a temporary session
      if (!clientId) {
        clientId = `rest_${Date.now()}_${Math.random()}`;
        await this.webClientService.createWebSession(clientId);

        // Authenticate with a default user for REST API
        await this.webClientService.authenticateWebSession(clientId, 'rest_user', 'password');
      }

      const response = await this.webClientService.executeCommand(
        clientId,
        commandRequest.command
      );

      return {
        success: true,
        command: commandRequest.command,
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        command: commandRequest.command,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get('available')
  async getAvailableCommands(): Promise<{ commands: string[] }> {
    // Return a list of available commands
    // In a real implementation, this would come from the CommandParser
    const commands = [
      'look', 'help', 'say', 'quit', 'who', 'stats', 'clear', 'version'
    ];

    return { commands };
  }

  @Get('help/:command')
  async getCommandHelp(@Param('command') command: string): Promise<{ command: string; help?: string }> {
    // Mock help responses
    const helpMap: { [key: string]: string } = {
      'look': 'Look around your current location',
      'help': 'Show help information',
      'say': 'Say something to other players',
      'quit': 'Disconnect from the game',
      'who': 'Show online players',
      'stats': 'Show your character stats',
      'clear': 'Clear the screen',
      'version': 'Show game version information',
    };

    return {
      command,
      help: helpMap[command.toLowerCase()] || 'No help available for this command',
    };
  }
}