"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorScheme = exports.Ansi = exports.AnsiStyle = exports.AnsiColor = void 0;
exports.formatMessage = formatMessage;
exports.stripAnsi = stripAnsi;
exports.hasAnsi = hasAnsi;
var AnsiColor;
(function (AnsiColor) {
    AnsiColor[AnsiColor["BLACK"] = 30] = "BLACK";
    AnsiColor[AnsiColor["RED"] = 31] = "RED";
    AnsiColor[AnsiColor["GREEN"] = 32] = "GREEN";
    AnsiColor[AnsiColor["YELLOW"] = 33] = "YELLOW";
    AnsiColor[AnsiColor["BLUE"] = 34] = "BLUE";
    AnsiColor[AnsiColor["MAGENTA"] = 35] = "MAGENTA";
    AnsiColor[AnsiColor["CYAN"] = 36] = "CYAN";
    AnsiColor[AnsiColor["WHITE"] = 37] = "WHITE";
    AnsiColor[AnsiColor["BRIGHT_BLACK"] = 90] = "BRIGHT_BLACK";
    AnsiColor[AnsiColor["BRIGHT_RED"] = 91] = "BRIGHT_RED";
    AnsiColor[AnsiColor["BRIGHT_GREEN"] = 92] = "BRIGHT_GREEN";
    AnsiColor[AnsiColor["BRIGHT_YELLOW"] = 93] = "BRIGHT_YELLOW";
    AnsiColor[AnsiColor["BRIGHT_BLUE"] = 94] = "BRIGHT_BLUE";
    AnsiColor[AnsiColor["BRIGHT_MAGENTA"] = 95] = "BRIGHT_MAGENTA";
    AnsiColor[AnsiColor["BRIGHT_CYAN"] = 96] = "BRIGHT_CYAN";
    AnsiColor[AnsiColor["BRIGHT_WHITE"] = 97] = "BRIGHT_WHITE";
    AnsiColor[AnsiColor["BG_BLACK"] = 40] = "BG_BLACK";
    AnsiColor[AnsiColor["BG_RED"] = 41] = "BG_RED";
    AnsiColor[AnsiColor["BG_GREEN"] = 42] = "BG_GREEN";
    AnsiColor[AnsiColor["BG_YELLOW"] = 43] = "BG_YELLOW";
    AnsiColor[AnsiColor["BG_BLUE"] = 44] = "BG_BLUE";
    AnsiColor[AnsiColor["BG_MAGENTA"] = 45] = "BG_MAGENTA";
    AnsiColor[AnsiColor["BG_CYAN"] = 46] = "BG_CYAN";
    AnsiColor[AnsiColor["BG_WHITE"] = 47] = "BG_WHITE";
    AnsiColor[AnsiColor["BG_BRIGHT_BLACK"] = 100] = "BG_BRIGHT_BLACK";
    AnsiColor[AnsiColor["BG_BRIGHT_RED"] = 101] = "BG_BRIGHT_RED";
    AnsiColor[AnsiColor["BG_BRIGHT_GREEN"] = 102] = "BG_BRIGHT_GREEN";
    AnsiColor[AnsiColor["BG_BRIGHT_YELLOW"] = 103] = "BG_BRIGHT_YELLOW";
    AnsiColor[AnsiColor["BG_BRIGHT_BLUE"] = 104] = "BG_BRIGHT_BLUE";
    AnsiColor[AnsiColor["BG_BRIGHT_MAGENTA"] = 105] = "BG_BRIGHT_MAGENTA";
    AnsiColor[AnsiColor["BG_BRIGHT_CYAN"] = 106] = "BG_BRIGHT_CYAN";
    AnsiColor[AnsiColor["BG_BRIGHT_WHITE"] = 107] = "BG_BRIGHT_WHITE";
})(AnsiColor || (exports.AnsiColor = AnsiColor = {}));
var AnsiStyle;
(function (AnsiStyle) {
    AnsiStyle[AnsiStyle["RESET"] = 0] = "RESET";
    AnsiStyle[AnsiStyle["BOLD"] = 1] = "BOLD";
    AnsiStyle[AnsiStyle["DIM"] = 2] = "DIM";
    AnsiStyle[AnsiStyle["UNDERLINE"] = 4] = "UNDERLINE";
    AnsiStyle[AnsiStyle["BLINK"] = 5] = "BLINK";
    AnsiStyle[AnsiStyle["REVERSE"] = 7] = "REVERSE";
    AnsiStyle[AnsiStyle["STRIKETHROUGH"] = 9] = "STRIKETHROUGH";
})(AnsiStyle || (exports.AnsiStyle = AnsiStyle = {}));
class Ansi {
    static escape(code) {
        return `${this.ESC}${code}m`;
    }
    static escapes(codes) {
        return `${this.ESC}${codes.join(';')}m`;
    }
    static reset() {
        return this.escape(AnsiStyle.RESET);
    }
    static color(color) {
        return this.escape(color);
    }
    static bgColor(color) {
        return this.escape(color);
    }
    static style(style) {
        return this.escape(style);
    }
    static styles(styles) {
        return this.escapes(styles);
    }
    static format(text, color, bgColor, ...styles) {
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
    static red(text, ...styles) {
        return this.format(text, AnsiColor.RED, undefined, ...styles);
    }
    static green(text, ...styles) {
        return this.format(text, AnsiColor.GREEN, undefined, ...styles);
    }
    static yellow(text, ...styles) {
        return this.format(text, AnsiColor.YELLOW, undefined, ...styles);
    }
    static blue(text, ...styles) {
        return this.format(text, AnsiColor.BLUE, undefined, ...styles);
    }
    static magenta(text, ...styles) {
        return this.format(text, AnsiColor.MAGENTA, undefined, ...styles);
    }
    static cyan(text, ...styles) {
        return this.format(text, AnsiColor.CYAN, undefined, ...styles);
    }
    static white(text, ...styles) {
        return this.format(text, AnsiColor.WHITE, undefined, ...styles);
    }
    static brightRed(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_RED, undefined, ...styles);
    }
    static brightGreen(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_GREEN, undefined, ...styles);
    }
    static brightYellow(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_YELLOW, undefined, ...styles);
    }
    static brightBlue(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_BLUE, undefined, ...styles);
    }
    static brightMagenta(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_MAGENTA, undefined, ...styles);
    }
    static brightCyan(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_CYAN, undefined, ...styles);
    }
    static brightWhite(text, ...styles) {
        return this.format(text, AnsiColor.BRIGHT_WHITE, undefined, ...styles);
    }
    static bold(text) {
        return this.format(text, undefined, undefined, AnsiStyle.BOLD);
    }
    static underline(text) {
        return this.format(text, undefined, undefined, AnsiStyle.UNDERLINE);
    }
    static dim(text) {
        return this.format(text, undefined, undefined, AnsiStyle.DIM);
    }
    static reverse(text) {
        return this.format(text, undefined, undefined, AnsiStyle.REVERSE);
    }
    static cursorUp(lines = 1) {
        return `${this.ESC}${lines}A`;
    }
    static cursorDown(lines = 1) {
        return `${this.ESC}${lines}B`;
    }
    static cursorForward(columns = 1) {
        return `${this.ESC}${columns}C`;
    }
    static cursorBack(columns = 1) {
        return `${this.ESC}${columns}D`;
    }
    static cursorPosition(row, col) {
        return `${this.ESC}${row};${col}H`;
    }
    static cursorHome() {
        return `${this.ESC}H`;
    }
    static clearScreen() {
        return `${this.ESC}2J`;
    }
    static clearLine() {
        return `${this.ESC}2K`;
    }
    static clearToEndOfLine() {
        return `${this.ESC}K`;
    }
    static clearToStartOfLine() {
        return `${this.ESC}1K`;
    }
    static saveCursor() {
        return `${this.ESC}s`;
    }
    static restoreCursor() {
        return `${this.ESC}u`;
    }
}
exports.Ansi = Ansi;
Ansi.ESC = '\x1b[';
class ColorScheme {
    static system(text) {
        return Ansi.brightCyan(`[SYSTEM] ${text}`);
    }
    static error(text) {
        return Ansi.brightRed(`[ERROR] ${text}`);
    }
    static success(text) {
        return Ansi.brightGreen(`[SUCCESS] ${text}`);
    }
    static warning(text) {
        return Ansi.brightYellow(`[WARNING] ${text}`);
    }
    static info(text) {
        return Ansi.brightBlue(`[INFO] ${text}`);
    }
    static user(username, text) {
        return `${Ansi.brightMagenta(username)}: ${text}`;
    }
    static broadcast(text) {
        return Ansi.brightWhite(`[BROADCAST] ${text}`);
    }
    static prompt(text = '> ') {
        return Ansi.brightGreen(text);
    }
}
exports.ColorScheme = ColorScheme;
function formatMessage(message) {
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
function stripAnsi(text) {
    return text.replace(/\u001b\[[0-9;]*m/g, '');
}
function hasAnsi(text) {
    return /\u001b\[[0-9;]*m/.test(text);
}
//# sourceMappingURL=ansi.js.map