/**
 * ANSI color and formatting utilities for Telnet output
 */

import { IMessage } from './types';

/**
 * ANSI color codes
 */
export enum AnsiColor {
  // Foreground colors
  BLACK = 30,
  RED = 31,
  GREEN = 32,
  YELLOW = 33,
  BLUE = 34,
  MAGENTA = 35,
  CYAN = 36,
  WHITE = 37,

  // Bright foreground colors
  BRIGHT_BLACK = 90,
  BRIGHT_RED = 91,
  BRIGHT_GREEN = 92,
  BRIGHT_YELLOW = 93,
  BRIGHT_BLUE = 94,
  BRIGHT_MAGENTA = 95,
  BRIGHT_CYAN = 96,
  BRIGHT_WHITE = 97,

  // Background colors
  BG_BLACK = 40,
  BG_RED = 41,
  BG_GREEN = 42,
  BG_YELLOW = 43,
  BG_BLUE = 44,
  BG_MAGENTA = 45,
  BG_CYAN = 46,
  BG_WHITE = 47,

  // Bright background colors
  BG_BRIGHT_BLACK = 100,
  BG_BRIGHT_RED = 101,
  BG_BRIGHT_GREEN = 102,
  BG_BRIGHT_YELLOW = 103,
  BG_BRIGHT_BLUE = 104,
  BG_BRIGHT_MAGENTA = 105,
  BG_BRIGHT_CYAN = 106,
  BG_BRIGHT_WHITE = 107
}

/**
 * ANSI text styles
 */
export enum AnsiStyle {
  RESET = 0,
  BOLD = 1,
  DIM = 2,
  UNDERLINE = 4,
  BLINK = 5,
  REVERSE = 7,
  STRIKETHROUGH = 9
}

/**
 * ANSI control sequences
 */
export class Ansi {
  private static readonly ESC = '\x1b[';

  /**
   * Create ANSI escape sequence
   */
  private static escape(code: number): string {
    return `${this.ESC}${code}m`;
  }

  /**
   * Create multiple ANSI escape sequences
   */
  private static escapes(codes: number[]): string {
    return `${this.ESC}${codes.join(';')}m`;
  }

  /**
   * Reset all formatting
   */
  static reset(): string {
    return this.escape(AnsiStyle.RESET);
  }

  /**
   * Apply text color
   */
  static color(color: AnsiColor): string {
    return this.escape(color);
  }

  /**
   * Apply background color
   */
  static bgColor(color: AnsiColor): string {
    return this.escape(color);
  }

  /**
   * Apply text style
   */
  static style(style: AnsiStyle): string {
    return this.escape(style);
  }

  /**
   * Apply multiple styles
   */
  static styles(styles: AnsiStyle[]): string {
    return this.escapes(styles);
  }

  /**
   * Apply color and style combination
   */
  static format(text: string, color?: AnsiColor, bgColor?: AnsiColor, ...styles: AnsiStyle[]): string {
    let result = '';

    if (styles.length > 0) {
      result += this.escapes(styles);
    }

    if (color !== undefined) {
      result += this.escape(color);
    }

    if (bgColor !== undefined) {
      result += this.escape(bgColor);
    }

    result += text + this.reset();
    return result;
  }

  /**
   * Create colored text
   */
  static red(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.RED, undefined, ...styles);
  }

  static green(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.GREEN, undefined, ...styles);
  }

  static yellow(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.YELLOW, undefined, ...styles);
  }

  static blue(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BLUE, undefined, ...styles);
  }

  static magenta(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.MAGENTA, undefined, ...styles);
  }

  static cyan(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.CYAN, undefined, ...styles);
  }

  static white(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.WHITE, undefined, ...styles);
  }

  /**
   * Create bright colored text
   */
  static brightRed(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_RED, undefined, ...styles);
  }

  static brightGreen(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_GREEN, undefined, ...styles);
  }

  static brightYellow(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_YELLOW, undefined, ...styles);
  }

  static brightBlue(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_BLUE, undefined, ...styles);
  }

  static brightMagenta(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_MAGENTA, undefined, ...styles);
  }

  static brightCyan(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_CYAN, undefined, ...styles);
  }

  static brightWhite(text: string, ...styles: AnsiStyle[]): string {
    return this.format(text, AnsiColor.BRIGHT_WHITE, undefined, ...styles);
  }

  /**
   * Apply bold formatting
   */
  static bold(text: string): string {
    return this.format(text, undefined, undefined, AnsiStyle.BOLD);
  }

  /**
   * Apply underline formatting
   */
  static underline(text: string): string {
    return this.format(text, undefined, undefined, AnsiStyle.UNDERLINE);
  }

  /**
   * Apply dim formatting
   */
  static dim(text: string): string {
    return this.format(text, undefined, undefined, AnsiStyle.DIM);
  }

  /**
   * Apply reverse formatting (swap foreground and background)
   */
  static reverse(text: string): string {
    return this.format(text, undefined, undefined, AnsiStyle.REVERSE);
  }

  /**
   * Cursor control sequences
   */
  static cursorUp(lines: number = 1): string {
    return `${this.ESC}${lines}A`;
  }

  static cursorDown(lines: number = 1): string {
    return `${this.ESC}${lines}B`;
  }

  static cursorForward(columns: number = 1): string {
    return `${this.ESC}${columns}C`;
  }

  static cursorBack(columns: number = 1): string {
    return `${this.ESC}${columns}D`;
  }

  static cursorPosition(row: number, col: number): string {
    return `${this.ESC}${row};${col}H`;
  }

  static cursorHome(): string {
    return `${this.ESC}H`;
  }

  static clearScreen(): string {
    return `${this.ESC}2J`;
  }

  static clearLine(): string {
    return `${this.ESC}2K`;
  }

  static clearToEndOfLine(): string {
    return `${this.ESC}K`;
  }

  static clearToStartOfLine(): string {
    return `${this.ESC}1K`;
  }

  /**
   * Save and restore cursor position
   */
  static saveCursor(): string {
    return `${this.ESC}s`;
  }

  static restoreCursor(): string {
    return `${this.ESC}u`;
  }
}

/**
 * Predefined color schemes for common message types
 */
export class ColorScheme {
  static system(text: string): string {
    return Ansi.brightCyan(`[SYSTEM] ${text}`);
  }

  static error(text: string): string {
    return Ansi.brightRed(`[ERROR] ${text}`);
  }

  static success(text: string): string {
    return Ansi.brightGreen(`[SUCCESS] ${text}`);
  }

  static warning(text: string): string {
    return Ansi.brightYellow(`[WARNING] ${text}`);
  }

  static info(text: string): string {
    return Ansi.brightBlue(`[INFO] ${text}`);
  }

  static user(username: string, text: string): string {
    return `${Ansi.brightMagenta(username)}: ${text}`;
  }

  static broadcast(text: string): string {
    return Ansi.brightWhite(`[BROADCAST] ${text}`);
  }

  static prompt(text: string = '> '): string {
    return Ansi.brightGreen(text);
  }
}

/**
 * Format a message with appropriate colors based on its type
 */
export function formatMessage(message: IMessage): string {
  if (message.formatted) {
    return message.content;
  }

  switch (message.type) {
    case 'system':
      return ColorScheme.system(message.content);
    case 'error':
      return ColorScheme.error(message.content);
    case 'info':
      return ColorScheme.info(message.content);
    case 'broadcast':
      return ColorScheme.broadcast(message.content);
    case 'user':
    default:
      return message.content;
  }
}

/**
 * Strip ANSI codes from text
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Check if text contains ANSI codes
 */
export function hasAnsi(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /\u001b\[[0-9;]*m/.test(text);
}