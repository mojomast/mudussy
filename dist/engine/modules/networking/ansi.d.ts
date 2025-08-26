import { IMessage } from './types';
export declare enum AnsiColor {
    BLACK = 30,
    RED = 31,
    GREEN = 32,
    YELLOW = 33,
    BLUE = 34,
    MAGENTA = 35,
    CYAN = 36,
    WHITE = 37,
    BRIGHT_BLACK = 90,
    BRIGHT_RED = 91,
    BRIGHT_GREEN = 92,
    BRIGHT_YELLOW = 93,
    BRIGHT_BLUE = 94,
    BRIGHT_MAGENTA = 95,
    BRIGHT_CYAN = 96,
    BRIGHT_WHITE = 97,
    BG_BLACK = 40,
    BG_RED = 41,
    BG_GREEN = 42,
    BG_YELLOW = 43,
    BG_BLUE = 44,
    BG_MAGENTA = 45,
    BG_CYAN = 46,
    BG_WHITE = 47,
    BG_BRIGHT_BLACK = 100,
    BG_BRIGHT_RED = 101,
    BG_BRIGHT_GREEN = 102,
    BG_BRIGHT_YELLOW = 103,
    BG_BRIGHT_BLUE = 104,
    BG_BRIGHT_MAGENTA = 105,
    BG_BRIGHT_CYAN = 106,
    BG_BRIGHT_WHITE = 107
}
export declare enum AnsiStyle {
    RESET = 0,
    BOLD = 1,
    DIM = 2,
    UNDERLINE = 4,
    BLINK = 5,
    REVERSE = 7,
    STRIKETHROUGH = 9
}
export declare class Ansi {
    private static readonly ESC;
    private static escape;
    private static escapes;
    static reset(): string;
    static color(color: AnsiColor): string;
    static bgColor(color: AnsiColor): string;
    static style(style: AnsiStyle): string;
    static styles(styles: AnsiStyle[]): string;
    static format(text: string, color?: AnsiColor, bgColor?: AnsiColor, ...styles: AnsiStyle[]): string;
    static red(text: string, ...styles: AnsiStyle[]): string;
    static green(text: string, ...styles: AnsiStyle[]): string;
    static yellow(text: string, ...styles: AnsiStyle[]): string;
    static blue(text: string, ...styles: AnsiStyle[]): string;
    static magenta(text: string, ...styles: AnsiStyle[]): string;
    static cyan(text: string, ...styles: AnsiStyle[]): string;
    static white(text: string, ...styles: AnsiStyle[]): string;
    static brightRed(text: string, ...styles: AnsiStyle[]): string;
    static brightGreen(text: string, ...styles: AnsiStyle[]): string;
    static brightYellow(text: string, ...styles: AnsiStyle[]): string;
    static brightBlue(text: string, ...styles: AnsiStyle[]): string;
    static brightMagenta(text: string, ...styles: AnsiStyle[]): string;
    static brightCyan(text: string, ...styles: AnsiStyle[]): string;
    static brightWhite(text: string, ...styles: AnsiStyle[]): string;
    static bold(text: string): string;
    static underline(text: string): string;
    static dim(text: string): string;
    static reverse(text: string): string;
    static cursorUp(lines?: number): string;
    static cursorDown(lines?: number): string;
    static cursorForward(columns?: number): string;
    static cursorBack(columns?: number): string;
    static cursorPosition(row: number, col: number): string;
    static cursorHome(): string;
    static clearScreen(): string;
    static clearLine(): string;
    static clearToEndOfLine(): string;
    static clearToStartOfLine(): string;
    static saveCursor(): string;
    static restoreCursor(): string;
}
export declare class ColorScheme {
    static system(text: string): string;
    static error(text: string): string;
    static success(text: string): string;
    static warning(text: string): string;
    static info(text: string): string;
    static user(username: string, text: string): string;
    static broadcast(text: string): string;
    static prompt(text?: string): string;
}
export declare function formatMessage(message: IMessage): string;
export declare function stripAnsi(text: string): string;
export declare function hasAnsi(text: string): boolean;
