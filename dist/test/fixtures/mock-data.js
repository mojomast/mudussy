"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectedRooms = exports.testFixtures = exports.createMockPluginMetadata = exports.createMockCommand = exports.createMockNetworkSession = exports.createMockWorldData = exports.createMockNPC = exports.createMockItem = exports.createMockRoom = exports.createMockExit = exports.createMockArea = exports.createMockWorldConfig = void 0;
const uuid_1 = require("uuid");
const vitest_1 = require("vitest");
const createMockWorldConfig = (overrides = {}) => ({
    defaultRoomId: 'room1',
    maxItemsPerRoom: 100,
    maxPlayersPerRoom: 50,
    allowRoomCreation: true,
    contentPath: './test-data/world',
    ...overrides,
});
exports.createMockWorldConfig = createMockWorldConfig;
const createMockArea = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    name: 'Test Area',
    description: 'A test area for unit testing',
    rooms: [],
    flags: [],
    created: new Date(),
    updated: new Date(),
    ...overrides,
});
exports.createMockArea = createMockArea;
const createMockExit = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    direction: 'north',
    toRoomId: 'room2',
    description: 'To the next room',
    verbs: ['north', 'n'],
    flags: [],
    ...overrides,
});
exports.createMockExit = createMockExit;
const createMockRoom = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    name: 'Test Room',
    description: 'A test room for unit testing',
    area: 'test-area',
    exits: [],
    items: [],
    npcs: [],
    players: [],
    flags: [],
    created: new Date(),
    updated: new Date(),
    ...overrides,
});
exports.createMockRoom = createMockRoom;
const createMockItem = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    name: 'Test Item',
    description: 'A test item for unit testing',
    shortDescription: 'Test item',
    type: 'misc',
    portable: true,
    container: false,
    stats: {
        weight: 1,
        value: 10,
    },
    flags: [],
    created: new Date(),
    updated: new Date(),
    ...overrides,
});
exports.createMockItem = createMockItem;
const createMockNPC = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    name: 'Test NPC',
    description: 'A test NPC for unit testing',
    shortDescription: 'Test NPC',
    roomId: 'room1',
    dialogueProvider: 'default',
    behaviors: [],
    stats: {
        level: 1,
        health: { current: 100, max: 100 },
        strength: 10,
        intelligence: 10,
        dexterity: 10,
        constitution: 10,
    },
    flags: [],
    created: new Date(),
    updated: new Date(),
    ...overrides,
});
exports.createMockNPC = createMockNPC;
const createMockWorldData = (overrides = {}) => {
    const rooms = [
        (0, exports.createMockRoom)({ id: 'room1', name: 'Starting Room' }),
        (0, exports.createMockRoom)({ id: 'room2', name: 'Second Room' }),
    ];
    const items = [
        (0, exports.createMockItem)({ id: 'item1', name: 'Sword' }),
        (0, exports.createMockItem)({ id: 'item2', name: 'Shield' }),
    ];
    const npcs = [
        (0, exports.createMockNPC)({ id: 'npc1', name: 'Guard' }),
    ];
    const areas = [
        (0, exports.createMockArea)({ id: 'area1', name: 'Test Area', rooms: ['room1', 'room2'] }),
    ];
    return {
        areas,
        rooms,
        items,
        npcs,
        metadata: {
            version: '1.0.0',
            created: new Date(),
            updated: new Date(),
        },
        ...overrides,
    };
};
exports.createMockWorldData = createMockWorldData;
const createMockNetworkSession = (overrides = {}) => ({
    id: (0, uuid_1.v4)(),
    socket: {
        write: vitest_1.vi.fn(),
        end: vitest_1.vi.fn(),
        destroy: vitest_1.vi.fn(),
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
    },
    username: 'testuser',
    authenticated: true,
    connectedAt: new Date(),
    lastActivity: new Date(),
    ...overrides,
});
exports.createMockNetworkSession = createMockNetworkSession;
const createMockCommand = (overrides = {}) => ({
    sessionId: 'test-session',
    command: 'test',
    args: ['arg1', 'arg2'],
    raw: 'test arg1 arg2',
    timestamp: new Date(),
    ...overrides,
});
exports.createMockCommand = createMockCommand;
const createMockPluginMetadata = (overrides = {}) => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin for unit testing',
    author: 'Test Author',
    dependencies: [],
    provides: ['test-service'],
    ...overrides,
});
exports.createMockPluginMetadata = createMockPluginMetadata;
exports.testFixtures = {
    simpleWorld: (0, exports.createMockWorldData)(),
    complexWorld: (0, exports.createMockWorldData)({
        rooms: [
            (0, exports.createMockRoom)({ id: 'room1', name: 'Town Square' }),
            (0, exports.createMockRoom)({ id: 'room2', name: 'North Road' }),
            (0, exports.createMockRoom)({ id: 'room3', name: 'Forest Path' }),
            (0, exports.createMockRoom)({ id: 'room4', name: 'Ancient Ruins' }),
        ],
        items: [
            (0, exports.createMockItem)({ id: 'sword1', name: 'Rusty Sword', type: 'weapon' }),
            (0, exports.createMockItem)({ id: 'potion1', name: 'Health Potion', type: 'consumable' }),
            (0, exports.createMockItem)({ id: 'armor1', name: 'Leather Armor', type: 'armor' }),
        ],
        npcs: [
            (0, exports.createMockNPC)({ id: 'merchant1', name: 'Town Merchant' }),
            (0, exports.createMockNPC)({ id: 'guard1', name: 'Town Guard' }),
        ],
    }),
    emptyWorld: (0, exports.createMockWorldData)({
        areas: [],
        rooms: [],
        items: [],
        npcs: [],
    }),
};
const createConnectedRooms = () => {
    const exit1 = (0, exports.createMockExit)({ id: 'exit1', direction: 'north', toRoomId: 'room2', description: 'To Room 2' });
    const exit2 = (0, exports.createMockExit)({ id: 'exit2', direction: 'south', toRoomId: 'room1', description: 'To Room 1' });
    const room1 = (0, exports.createMockRoom)({
        id: 'room1',
        name: 'Room 1',
        exits: [exit1],
    });
    const room2 = (0, exports.createMockRoom)({
        id: 'room2',
        name: 'Room 2',
        exits: [exit2],
    });
    return { room1, room2 };
};
exports.createConnectedRooms = createConnectedRooms;
//# sourceMappingURL=mock-data.js.map