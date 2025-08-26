/**
 * Username validation utilities for the MUD engine
 */

export interface UsernameValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class UsernameValidator {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 20;
  private static readonly ALLOWED_CHARS = /^[a-zA-Z0-9_-]+$/;

  /**
   * Validate a username according to the game's rules
   */
  static validateUsername(username: string): UsernameValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for null/undefined/empty
    if (!username || username.trim().length === 0) {
      errors.push('Username cannot be empty');
      return { valid: false, errors, warnings };
    }

    const trimmedUsername = username.trim();

    // Check length
    if (trimmedUsername.length < this.MIN_LENGTH) {
      errors.push(`Username must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (trimmedUsername.length > this.MAX_LENGTH) {
      errors.push(`Username cannot be longer than ${this.MAX_LENGTH} characters`);
    }

    // Check allowed characters
    if (!this.ALLOWED_CHARS.test(trimmedUsername)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Check for reserved names
    if (this.isReservedName(trimmedUsername)) {
      errors.push('This username is reserved and cannot be used');
    }

    // Check for inappropriate content (basic check)
    if (this.containsInappropriateContent(trimmedUsername)) {
      errors.push('Username contains inappropriate content');
    }

    // Warnings for edge cases
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

  /**
   * Check if a username is reserved
   */
  private static isReservedName(username: string): boolean {
    const reservedNames = [
      'admin', 'administrator', 'system', 'server', 'mud', 'game',
      'root', 'superuser', 'moderator', 'mod', 'gm', 'gamemaster',
      'test', 'testing', 'debug', 'dev', 'developer',
      'null', 'undefined', 'none', 'empty', 'guest'
    ];

    return reservedNames.includes(username.toLowerCase());
  }

  /**
   * Basic check for inappropriate content
   */
  private static containsInappropriateContent(username: string): boolean {
    // This is a very basic check - in a real implementation,
    // you'd want a more sophisticated profanity filter
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

  /**
   * Sanitize username for display
   */
  static sanitizeUsername(username: string): string {
    return username.trim();
  }

  /**
   * Get validation rules as a formatted string for display to users
   */
  static getValidationRules(): string {
    return [
      `Username must be ${this.MIN_LENGTH}-${this.MAX_LENGTH} characters long`,
      'Only letters, numbers, underscores (_), and hyphens (-) are allowed',
      'Cannot start with a number (recommended)',
      'Certain names are reserved and cannot be used',
      'No inappropriate or offensive content allowed'
    ].join('\n');
  }
}