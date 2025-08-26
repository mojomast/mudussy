import { BasePlugin } from '../../engine/core';
export interface MockPlayer {
    id: string;
    sessionId: string;
    name: string;
}
export interface MockRoom {
    id: string;
    name: string;
    description: string;
}
export interface MockItem {
    id: string;
    name: string;
    description: string;
}
export interface MockNPC {
    id: string;
    name: string;
    dialogueTree?: any;
}
export interface CoverageResult {
    core: {
        lines: {
            pct: number;
        };
        functions: {
            pct: number;
        };
        branches: {
            pct: number;
        };
        statements: {
            pct: number;
        };
    };
}
export interface LoadTestResult {
    totalSessions: number;
    failedSessions: number;
    averageResponseTime: number;
    errorRate: number;
}
export interface BuildResult {
    success: boolean;
    outputPath?: string;
}
export interface DevlogValidation {
    hasRequiredEntries: boolean;
    entriesHaveTimestamps: boolean;
    coversAllMilestones: boolean;
}
export declare class TestHarness {
    private container;
    private eventSystem;
    private pluginManager;
    private commandParser;
    private dialogueManager;
    private worldManager;
    private logger;
    private errorCount;
    private players;
    private rooms;
    private items;
    private npcs;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    getErrorCount(): number;
    createMockPlayer(name: string): Promise<MockPlayer>;
    createMockRoom(id: string, name: string): Promise<MockRoom>;
    createMockItem(id: string, name: string): Promise<MockItem>;
    createMockAdmin(name: string): Promise<MockPlayer>;
    createNPCWithDialogue(id: string, dialogueFile: string): Promise<MockNPC>;
    loadPluginFromPath(pluginPath: string): Promise<BasePlugin | null>;
    createMockDicePlugin(): Promise<BasePlugin>;
    createMockPluginWithDependencies(): Promise<BasePlugin>;
    createCannedProvider(): Promise<any>;
    createLiveAgentProviderStub(): Promise<any>;
    runCoverageAnalysis(): Promise<CoverageResult>;
    startLoadTest(concurrentUsers: number, duration: number): Promise<any>;
    buildDocumentation(): Promise<BuildResult>;
    validateDevlogEntries(): Promise<DevlogValidation>;
}
