"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkingModule = void 0;
const common_1 = require("@nestjs/common");
const websocket_gateway_1 = require("./websocket.gateway");
const auth_controller_1 = require("./auth.controller");
const api_auth_controller_1 = require("./api-auth.controller");
const commands_controller_1 = require("./commands.controller");
const world_controller_1 = require("./world.controller");
const web_client_service_1 = require("./web-client.service");
const user_service_1 = require("./user.service");
const permission_guard_1 = require("./permission.guard");
const engine_module_1 = require("../engine/engine.module");
let NetworkingModule = class NetworkingModule {
};
exports.NetworkingModule = NetworkingModule;
exports.NetworkingModule = NetworkingModule = __decorate([
    (0, common_1.Module)({
        imports: [engine_module_1.EngineModule],
        controllers: [auth_controller_1.AuthController, api_auth_controller_1.ApiAuthController, commands_controller_1.CommandsController, world_controller_1.WorldController],
        providers: [websocket_gateway_1.WebSocketGateway, web_client_service_1.WebClientService, user_service_1.UserService, permission_guard_1.PermissionGuard],
        exports: [web_client_service_1.WebClientService, websocket_gateway_1.WebSocketGateway, user_service_1.UserService],
    })
], NetworkingModule);
//# sourceMappingURL=networking.module.js.map