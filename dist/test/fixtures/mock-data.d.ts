import { IWorldData, IRoom, IItem, INPC, IArea, IWorldConfig, IExit } from '../../engine/modules/world/types';
export declare const createMockWorldConfig: (overrides?: Partial<IWorldConfig>) => IWorldConfig;
export declare const createMockArea: (overrides?: Partial<IArea>) => IArea;
export declare const createMockExit: (overrides?: Partial<IExit>) => IExit;
export declare const createMockRoom: (overrides?: Partial<IRoom>) => IRoom;
export declare const createMockItem: (overrides?: Partial<IItem>) => IItem;
export declare const createMockNPC: (overrides?: Partial<INPC>) => INPC;
export declare const createMockWorldData: (overrides?: Partial<IWorldData>) => IWorldData;
export declare const createMockNetworkSession: (overrides?: {}) => {
    id: string;
    socket: {
        write: import("vitest").Mock<any, any>;
        end: import("vitest").Mock<any, any>;
        destroy: import("vitest").Mock<any, any>;
        remoteAddress: string;
        remotePort: number;
    };
    username: string;
    authenticated: boolean;
    connectedAt: Date;
    lastActivity: Date;
};
export declare const createMockCommand: (overrides?: {}) => {
    sessionId: string;
    command: string;
    args: string[];
    raw: string;
    timestamp: Date;
};
export declare const createMockPluginMetadata: (overrides?: {}) => {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    dependencies: any[];
    provides: string[];
};
export declare const testFixtures: {
    simpleWorld: IWorldData;
    complexWorld: IWorldData;
    emptyWorld: IWorldData;
};
export declare const createConnectedRooms: () => {
    room1: IRoom;
    room2: IRoom;
};
