/**
 * World module for MUD Engine
 *
 * This module provides:
 * - World data models (Room, Exit, Item, NPC, Area)
 * - World manager for loading/saving content
 * - Room navigation and interaction
 * - Content validation and management
 */

// Core world components
export { WorldManager } from './world-manager';

// Types and interfaces
export type {
  IWorldConfig,
  IRoom,
  IExit,
  IItem,
  INPC,
  IArea,
  IWorldData,
  IRequirement
} from './types';

// Event types
export { WorldEventTypes } from './types';

// Constants
export { DirectionMap, DirectionAliases } from './types';