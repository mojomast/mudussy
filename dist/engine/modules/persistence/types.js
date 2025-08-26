"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceEventTypes = exports.SaveType = void 0;
var SaveType;
(function (SaveType) {
    SaveType["FULL"] = "full";
    SaveType["PLAYERS"] = "players";
    SaveType["WORLD"] = "world";
    SaveType["GAME_STATE"] = "game_state";
    SaveType["INCREMENTAL"] = "incremental";
})(SaveType || (exports.SaveType = SaveType = {}));
exports.PersistenceEventTypes = {
    SAVE_STARTED: 'persistence.save.started',
    SAVE_COMPLETED: 'persistence.save.completed',
    SAVE_FAILED: 'persistence.save.failed',
    LOAD_STARTED: 'persistence.load.started',
    LOAD_COMPLETED: 'persistence.load.completed',
    LOAD_FAILED: 'persistence.load.failed',
    BACKUP_CREATED: 'persistence.backup.created',
    MIGRATION_STARTED: 'persistence.migration.started',
    MIGRATION_COMPLETED: 'persistence.migration.completed',
    VALIDATION_FAILED: 'persistence.validation.failed'
};
//# sourceMappingURL=types.js.map