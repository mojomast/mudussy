"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsController = void 0;
const common_1 = require("@nestjs/common");
const web_client_service_1 = require("./web-client.service");
let CommandsController = class CommandsController {
    constructor(webClientService) {
        this.webClientService = webClientService;
    }
    async executeCommand(commandRequest) {
        try {
            let clientId = commandRequest.clientId;
            if (!clientId) {
                clientId = `rest_${Date.now()}_${Math.random()}`;
                await this.webClientService.createWebSession(clientId);
                await this.webClientService.authenticateWebSession(clientId, 'rest_user', 'password');
            }
            const response = await this.webClientService.executeCommand(clientId, commandRequest.command);
            return {
                success: true,
                command: commandRequest.command,
                response,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                success: false,
                command: commandRequest.command,
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
    async getAvailableCommands() {
        const commands = [
            'look', 'help', 'say', 'quit', 'who', 'stats', 'clear', 'version'
        ];
        return { commands };
    }
    async getCommandHelp(command) {
        const helpMap = {
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
};
exports.CommandsController = CommandsController;
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommandsController.prototype, "executeCommand", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommandsController.prototype, "getAvailableCommands", null);
__decorate([
    (0, common_1.Get)('help/:command'),
    __param(0, (0, common_1.Param)('command')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommandsController.prototype, "getCommandHelp", null);
exports.CommandsController = CommandsController = __decorate([
    (0, common_1.Controller)('commands'),
    __metadata("design:paramtypes", [web_client_service_1.WebClientService])
], CommandsController);
//# sourceMappingURL=commands.controller.js.map