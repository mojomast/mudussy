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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = exports.EventSystem = exports.WorldSaveSystem = exports.GameStateSaveSystem = exports.PlayerSaveSystem = exports.SaveManager = exports.PlayerManager = exports.Player = void 0;
__exportStar(require("./types"), exports);
var player_1 = require("./player");
Object.defineProperty(exports, "Player", { enumerable: true, get: function () { return player_1.Player; } });
var player_manager_1 = require("./player-manager");
Object.defineProperty(exports, "PlayerManager", { enumerable: true, get: function () { return player_manager_1.PlayerManager; } });
var save_manager_1 = require("./save-manager");
Object.defineProperty(exports, "SaveManager", { enumerable: true, get: function () { return save_manager_1.SaveManager; } });
var player_save_system_1 = require("./player-save-system");
Object.defineProperty(exports, "PlayerSaveSystem", { enumerable: true, get: function () { return player_save_system_1.PlayerSaveSystem; } });
var game_state_save_system_1 = require("./game-state-save-system");
Object.defineProperty(exports, "GameStateSaveSystem", { enumerable: true, get: function () { return game_state_save_system_1.GameStateSaveSystem; } });
var world_save_system_1 = require("./world-save-system");
Object.defineProperty(exports, "WorldSaveSystem", { enumerable: true, get: function () { return world_save_system_1.WorldSaveSystem; } });
var event_1 = require("../../core/event");
Object.defineProperty(exports, "EventSystem", { enumerable: true, get: function () { return event_1.EventSystem; } });
var entity_1 = require("../../core/entity");
Object.defineProperty(exports, "BaseEntity", { enumerable: true, get: function () { return entity_1.BaseEntity; } });
//# sourceMappingURL=index.js.map