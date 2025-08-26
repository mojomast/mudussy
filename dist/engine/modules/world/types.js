"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectionAliases = exports.DirectionMap = exports.WorldEventTypes = void 0;
var WorldEventTypes;
(function (WorldEventTypes) {
    WorldEventTypes["ROOM_ENTERED"] = "world.room.entered";
    WorldEventTypes["ROOM_LEFT"] = "world.room.left";
    WorldEventTypes["ITEM_TAKEN"] = "world.item.taken";
    WorldEventTypes["ITEM_DROPPED"] = "world.item.dropped";
    WorldEventTypes["NPC_SPAWNED"] = "world.npc.spawned";
    WorldEventTypes["NPC_DESPAWNED"] = "world.npc.despawned";
    WorldEventTypes["WORLD_LOADED"] = "world.loaded";
    WorldEventTypes["WORLD_SAVED"] = "world.saved";
})(WorldEventTypes || (exports.WorldEventTypes = WorldEventTypes = {}));
exports.DirectionMap = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
    up: 'down',
    down: 'up',
    northeast: 'southwest',
    northwest: 'southeast',
    southeast: 'northwest',
    southwest: 'northeast',
    in: 'out',
    out: 'in'
};
exports.DirectionAliases = {
    n: 'north',
    s: 'south',
    e: 'east',
    w: 'west',
    u: 'up',
    d: 'down',
    ne: 'northeast',
    nw: 'northwest',
    se: 'southeast',
    sw: 'southwest'
};
//# sourceMappingURL=types.js.map