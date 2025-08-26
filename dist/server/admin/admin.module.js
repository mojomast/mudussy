"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_dashboard_controller_1 = require("./controllers/admin-dashboard.controller");
const admin_user_management_controller_1 = require("./controllers/admin-user-management.controller");
const admin_world_controller_1 = require("./controllers/admin-world.controller");
const admin_dialogue_controller_1 = require("./controllers/admin-dialogue.controller");
const networking_module_1 = require("../networking/networking.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [networking_module_1.NetworkingModule],
        controllers: [
            admin_dashboard_controller_1.AdminDashboardController,
            admin_user_management_controller_1.AdminUserManagementController,
            admin_world_controller_1.AdminWorldController,
            admin_dialogue_controller_1.AdminDialogueController,
        ],
        providers: [],
        exports: [],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map