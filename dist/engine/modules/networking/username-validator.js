"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsernameValidator = void 0;
class UsernameValidator {
    static validateUsername(username) {
        const errors = [];
        const warnings = [];
        if (!username || username.trim().length === 0) {
            errors.push('Username cannot be empty');
            return { valid: false, errors, warnings };
        }
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < this.MIN_LENGTH) {
            errors.push(`Username must be at least ${this.MIN_LENGTH} characters long`);
        }
        if (trimmedUsername.length > this.MAX_LENGTH) {
            errors.push(`Username cannot be longer than ${this.MAX_LENGTH} characters`);
        }
        if (!this.ALLOWED_CHARS.test(trimmedUsername)) {
            errors.push('Username can only contain letters, numbers, underscores, and hyphens');
        }
        if (this.isReservedName(trimmedUsername)) {
            errors.push('This username is reserved and cannot be used');
        }
        if (this.containsInappropriateContent(trimmedUsername)) {
            errors.push('Username contains inappropriate content');
        }
        if (trimmedUsername.length < 5) {
            warnings.push('Short usernames may be harder to remember');
        }
        if (/^\d/.test(trimmedUsername)) {
            warnings.push('Usernames starting with numbers may be confusing');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    static isReservedName(username) {
        const reservedNames = [
            'admin', 'administrator', 'system', 'server', 'mud', 'game',
            'root', 'superuser', 'moderator', 'mod', 'gm', 'gamemaster',
            'test', 'testing', 'debug', 'dev', 'developer',
            'null', 'undefined', 'none', 'empty', 'guest'
        ];
        return reservedNames.includes(username.toLowerCase());
    }
    static containsInappropriateContent(username) {
        const inappropriatePatterns = [
            /fuck/i,
            /shit/i,
            /damn/i,
            /ass/i,
            /bitch/i,
            /cunt/i,
            /piss/i,
            /dick/i,
            /cock/i,
            /pussy/i,
            /nigger/i,
            /faggot/i,
            /retard/i
        ];
        return inappropriatePatterns.some(pattern => pattern.test(username));
    }
    static sanitizeUsername(username) {
        return username.trim();
    }
    static getValidationRules() {
        return [
            `Username must be ${this.MIN_LENGTH}-${this.MAX_LENGTH} characters long`,
            'Only letters, numbers, underscores (_), and hyphens (-) are allowed',
            'Cannot start with a number (recommended)',
            'Certain names are reserved and cannot be used',
            'No inappropriate or offensive content allowed'
        ].join('\n');
    }
}
exports.UsernameValidator = UsernameValidator;
UsernameValidator.MIN_LENGTH = 3;
UsernameValidator.MAX_LENGTH = 20;
UsernameValidator.ALLOWED_CHARS = /^[a-zA-Z0-9_-]+$/;
//# sourceMappingURL=username-validator.js.map