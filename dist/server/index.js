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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const express = __importStar(require("express"));
dotenv.config();
async function bootstrap() {
    console.log('🚀 Starting MUD Engine Server with Web Client...');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors({
            origin: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });
        const port = process.env.MUD_WEB_PORT ? parseInt(process.env.MUD_WEB_PORT) : 3000;
        const host = process.env.MUD_WEB_HOST || 'localhost';
        const clientsPath = path.join(process.cwd(), 'clients');
        app.use(express.static(clientsPath));
        const httpAdapter = app.getHttpAdapter();
        const instance = httpAdapter?.getInstance?.();
        if (instance && instance.get) {
            instance.get('/', (_req, res) => res.sendFile(path.join(clientsPath, 'index.html')));
        }
        app.setGlobalPrefix('api');
        await app.listen(port, host);
        console.log('✅ MUD Engine Server started successfully!');
        console.log(`🌐 Web client available at http://${host}:${port}`);
        console.log(`📡 WebSocket server running on ws://${host}:${port}`);
        console.log(`📡 REST API available at http://${host}:${port}/api`);
        console.log('🎮 Ready to accept web connections');
        const shutdown = async (signal) => {
            console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
            try {
                await app.close();
                console.log('✅ Server stopped successfully');
                process.exit(0);
            }
            catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught exception:', error);
            shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map