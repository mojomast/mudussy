"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkEventTypes = exports.TelnetCommand = exports.TelnetOption = exports.UserRole = exports.SessionState = void 0;
var SessionState;
(function (SessionState) {
    SessionState["CONNECTING"] = "connecting";
    SessionState["AUTHENTICATING"] = "authenticating";
    SessionState["CONNECTED"] = "connected";
    SessionState["DISCONNECTING"] = "disconnecting";
    SessionState["DISCONNECTED"] = "disconnected";
})(SessionState || (exports.SessionState = SessionState = {}));
var UserRole;
(function (UserRole) {
    UserRole["PLAYER"] = "player";
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var TelnetOption;
(function (TelnetOption) {
    TelnetOption[TelnetOption["ECHO"] = 1] = "ECHO";
    TelnetOption[TelnetOption["SUPPRESS_GO_AHEAD"] = 3] = "SUPPRESS_GO_AHEAD";
    TelnetOption[TelnetOption["TERMINAL_TYPE"] = 24] = "TERMINAL_TYPE";
    TelnetOption[TelnetOption["WINDOW_SIZE"] = 31] = "WINDOW_SIZE";
    TelnetOption[TelnetOption["TERMINAL_SPEED"] = 32] = "TERMINAL_SPEED";
    TelnetOption[TelnetOption["REMOTE_FLOW_CONTROL"] = 33] = "REMOTE_FLOW_CONTROL";
    TelnetOption[TelnetOption["LINEMODE"] = 34] = "LINEMODE";
    TelnetOption[TelnetOption["ENVIRONMENT_VARIABLES"] = 36] = "ENVIRONMENT_VARIABLES";
})(TelnetOption || (exports.TelnetOption = TelnetOption = {}));
var TelnetCommand;
(function (TelnetCommand) {
    TelnetCommand[TelnetCommand["SE"] = 240] = "SE";
    TelnetCommand[TelnetCommand["NOP"] = 241] = "NOP";
    TelnetCommand[TelnetCommand["DM"] = 242] = "DM";
    TelnetCommand[TelnetCommand["BRK"] = 243] = "BRK";
    TelnetCommand[TelnetCommand["IP"] = 244] = "IP";
    TelnetCommand[TelnetCommand["AO"] = 245] = "AO";
    TelnetCommand[TelnetCommand["AYT"] = 246] = "AYT";
    TelnetCommand[TelnetCommand["EC"] = 247] = "EC";
    TelnetCommand[TelnetCommand["EL"] = 248] = "EL";
    TelnetCommand[TelnetCommand["GA"] = 249] = "GA";
    TelnetCommand[TelnetCommand["SB"] = 250] = "SB";
    TelnetCommand[TelnetCommand["WILL"] = 251] = "WILL";
    TelnetCommand[TelnetCommand["WONT"] = 252] = "WONT";
    TelnetCommand[TelnetCommand["DO"] = 253] = "DO";
    TelnetCommand[TelnetCommand["DONT"] = 254] = "DONT";
    TelnetCommand[TelnetCommand["IAC"] = 255] = "IAC";
})(TelnetCommand || (exports.TelnetCommand = TelnetCommand = {}));
exports.NetworkEventTypes = {
    SESSION_CONNECTED: 'network.session.connected',
    SESSION_DISCONNECTED: 'network.session.disconnected',
    SESSION_AUTHENTICATED: 'network.session.authenticated',
    SESSION_IDLE_TIMEOUT: 'network.session.idle_timeout',
    SESSION_RATE_LIMITED: 'network.session.rate_limited',
    COMMAND_RECEIVED: 'network.command.received',
    MESSAGE_SENT: 'network.message.sent',
    SERVER_STARTED: 'network.server.started',
    SERVER_STOPPED: 'network.server.stopped',
    SERVER_ERROR: 'network.server.error'
};
//# sourceMappingURL=types.js.map