import { v4 as uuidv4 } from 'uuid';
import { vi } from 'vitest';
import {
  IWorldData,
  IRoom,
  IItem,
  INPC,
  IArea,
  IWorldConfig,
  IExit
} from '../../engine/modules/world/types';

// Mock data generators for testing

export const createMockWorldConfig = (overrides: Partial<IWorldConfig> = {}): IWorldConfig => ({
  defaultRoomId: 'room1',
  maxItemsPerRoom: 100,
  maxPlayersPerRoom: 50,
  allowRoomCreation: true,
  contentPath: './test-data/world',
  ...overrides,
});

export const createMockArea = (overrides: Partial<IArea> = {}): IArea => ({
  id: uuidv4(),
  name: 'Test Area',
  description: 'A test area for unit testing',
  rooms: [],
  flags: [],
  created: new Date(),
  updated: new Date(),
  ...overrides,
});

export const createMockExit = (overrides: Partial<IExit> = {}): IExit => ({
  id: uuidv4(),
  direction: 'north',
  toRoomId: 'room2',
  description: 'To the next room',
  verbs: ['north', 'n'],
  flags: [],
  ...overrides,
});

export const createMockRoom = (overrides: Partial<IRoom> = {}): IRoom => ({
  id: uuidv4(),
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

export const createMockItem = (overrides: Partial<IItem> = {}): IItem => ({
  id: uuidv4(),
  name: 'Test Item',
  description: 'A test item for unit testing',
  shortDescription: 'Test item',
  type: 'misc' as const,
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

export const createMockNPC = (overrides: Partial<INPC> = {}): INPC => ({
  id: uuidv4(),
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

export const createMockWorldData = (overrides: Partial<IWorldData> = {}): IWorldData => {
  const rooms = [
    createMockRoom({ id: 'room1', name: 'Starting Room' }),
    createMockRoom({ id: 'room2', name: 'Second Room' }),
  ];

  const items = [
    createMockItem({ id: 'item1', name: 'Sword' }),
    createMockItem({ id: 'item2', name: 'Shield' }),
  ];

  const npcs = [
    createMockNPC({ id: 'npc1', name: 'Guard' }),
  ];

  const areas = [
    createMockArea({ id: 'area1', name: 'Test Area', rooms: ['room1', 'room2'] }),
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

export const createMockNetworkSession = (overrides = {}) => ({
  id: uuidv4(),
  socket: {
    write: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
    remoteAddress: '127.0.0.1',
    remotePort: 12345,
  },
  username: 'testuser',
  authenticated: true,
  connectedAt: new Date(),
  lastActivity: new Date(),
  ...overrides,
});

export const createMockCommand = (overrides = {}) => ({
  sessionId: 'test-session',
  command: 'test',
  args: ['arg1', 'arg2'],
  raw: 'test arg1 arg2',
  timestamp: new Date(),
  ...overrides,
});

export const createMockPluginMetadata = (overrides = {}) => ({
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin for unit testing',
  author: 'Test Author',
  dependencies: [],
  provides: ['test-service'],
  ...overrides,
});

// Pre-built fixture data for consistent testing
export const testFixtures = {
  simpleWorld: createMockWorldData(),
  complexWorld: createMockWorldData({
    rooms: [
      createMockRoom({ id: 'room1', name: 'Town Square' }),
      createMockRoom({ id: 'room2', name: 'North Road' }),
      createMockRoom({ id: 'room3', name: 'Forest Path' }),
      createMockRoom({ id: 'room4', name: 'Ancient Ruins' }),
    ],
    items: [
      createMockItem({ id: 'sword1', name: 'Rusty Sword', type: 'weapon' as const }),
      createMockItem({ id: 'potion1', name: 'Health Potion', type: 'consumable' as const }),
      createMockItem({ id: 'armor1', name: 'Leather Armor', type: 'armor' as const }),
    ],
    npcs: [
      createMockNPC({ id: 'merchant1', name: 'Town Merchant' }),
      createMockNPC({ id: 'guard1', name: 'Town Guard' }),
    ],
  }),
  emptyWorld: createMockWorldData({
    areas: [],
    rooms: [],
    items: [],
    npcs: [],
  }),
};

// Helper to create connected rooms with exits
export const createConnectedRooms = () => {
  const exit1 = createMockExit({ id: 'exit1', direction: 'north', toRoomId: 'room2', description: 'To Room 2' });
  const exit2 = createMockExit({ id: 'exit2', direction: 'south', toRoomId: 'room1', description: 'To Room 1' });

  const room1 = createMockRoom({
    id: 'room1',
    name: 'Room 1',
    exits: [exit1],
  });

  const room2 = createMockRoom({
    id: 'room2',
    name: 'Room 2',
    exits: [exit2],
  });

  return { room1, room2 };
};