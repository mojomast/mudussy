export interface UsernameValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class UsernameValidator {
    private static readonly MIN_LENGTH;
    private static readonly MAX_LENGTH;
    private static readonly ALLOWED_CHARS;
    static validateUsername(username: string): UsernameValidationResult;
    private static isReservedName;
    private static containsInappropriateContent;
    static sanitizeUsername(username: string): string;
    static getValidationRules(): string;
}
