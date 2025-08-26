"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineModule = void 0;
const common_1 = require("@nestjs/common");
const event_1 = require("../../engine/core/event");
const telnet_server_1 = require("../../engine/modules/networking/telnet-server");
const world_1 = require("../../engine/modules/world");
const player_manager_1 = require("../../engine/modules/persistence/player-manager");
let EngineModule = class EngineModule {
};
exports.EngineModule = EngineModule;
exports.EngineModule = EngineModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: event_1.EventSystem,
                useFactory: () => new event_1.EventSystem(),
            },
            {
                provide: world_1.WorldManager,
                useFactory: async (eventSystem) => {
                    const worldConfig = {
                        contentPath: './engine/modules/world/content',
                        defaultRoomId: 'tavern',
                        maxItemsPerRoom: 50,
                        maxPlayersPerRoom: 10,
                        allowRoomCreation: false,
                    };
                    const world = new world_1.WorldManager(eventSystem, worldConfig);
                    try {
                        await world.loadWorld();
                    }
                    catch (e) {
                    }
                    return world;
                },
                inject: [event_1.EventSystem],
            },
            {
                provide: player_manager_1.PlayerManager,
                useFactory: (eventSystem) => new player_manager_1.PlayerManager(eventSystem, console),
                inject: [event_1.EventSystem],
            },
            {
                provide: telnet_server_1.TelnetServer,
                useFactory: (eventSystem, playerManager, worldManager) => {
                    const config = {
                        host: 'localhost',
                        port: 4000,
                        maxConnections: 100,
                        connectionTimeout: 30000,
                        idleTimeout: 300000,
                        rateLimitWindow: 60000,
                        rateLimitMaxRequests: 10,
                        enableLogging: true,
                        logLevel: 'info',
                    };
                    return new telnet_server_1.TelnetServer(eventSystem, config, playerManager, console, worldManager);
                },
                inject: [event_1.EventSystem, player_manager_1.PlayerManager, world_1.WorldManager],
            },
        ],
        exports: [event_1.EventSystem, telnet_server_1.TelnetServer, world_1.WorldManager, player_manager_1.PlayerManager],
    })
], EngineModule);
//# sourceMappingURL=engine.module.js.map