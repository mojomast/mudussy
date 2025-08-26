"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleLogger = void 0;
class SimpleLogger {
    constructor(logLevel = 'info') {
        this.logLevel = logLevel.toLowerCase();
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevel = levels.indexOf(this.logLevel);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= currentLevel;
    }
    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
}
exports.SimpleLogger = SimpleLogger;
//# sourceMappingURL=logger.js.map