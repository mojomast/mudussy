"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueEventTypes = void 0;
var DialogueEventTypes;
(function (DialogueEventTypes) {
    DialogueEventTypes["CONVERSATION_STARTED"] = "dialogue.conversation.started";
    DialogueEventTypes["CONVERSATION_CONTINUED"] = "dialogue.conversation.continued";
    DialogueEventTypes["CONVERSATION_ENDED"] = "dialogue.conversation.ended";
    DialogueEventTypes["DIALOGUE_NODE_REACHED"] = "dialogue.node.reached";
    DialogueEventTypes["DIALOGUE_CHOICE_MADE"] = "dialogue.choice.made";
    DialogueEventTypes["DIALOGUE_ACTION_EXECUTED"] = "dialogue.action.executed";
    DialogueEventTypes["DIALOGUE_VARIABLE_CHANGED"] = "dialogue.variable.changed";
    DialogueEventTypes["PROVIDER_SWITCHED"] = "dialogue.provider.switched";
})(DialogueEventTypes || (exports.DialogueEventTypes = DialogueEventTypes = {}));
//# sourceMappingURL=types.js.map