/**
 * MUD Engine Core
 *
 * This module contains the core components of the MUD engine:
 * - Entity system for managing game objects
 * - Event system for communication between components
 * - Plugin architecture for extensibility
 * - Main engine service that ties everything together
 */

// Entity system
export * from './entity';

// Event system
export * from './event';

// Plugin system
export * from './plugin';

// Engine service
export * from './engine.service';

// Re-export commonly used types and constants
export type { IEntity } from './entity';
export type { IEventData } from './event';
export type { IPlugin, IPluginMetadata, IPluginHooks, IPluginContext } from './plugin';
export { EventTypes } from './event';