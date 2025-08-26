import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for all game entities
 */
export interface IEntity {
  id: string;
  name: string;
  type: string;
  created: Date;
  updated: Date;
  metadata: Map<string, any>;
}

/**
 * Base entity class that all game objects inherit from
 */
export abstract class BaseEntity implements IEntity {
  public id: string;
  public name: string;
  public type: string;
  public created: Date;
  public updated: Date;
  public metadata: Map<string, any>;

  constructor(name: string, type: string) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.created = new Date();
    this.updated = new Date();
    this.metadata = new Map();
  }

  /**
   * Update the entity's timestamp
   */
  update(): void {
    this.updated = new Date();
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
    this.update();
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  /**
   * Check if entity has metadata key
   */
  hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  /**
   * Remove metadata key
   */
  removeMetadata(key: string): boolean {
    const result = this.metadata.delete(key);
    if (result) this.update();
    return result;
  }

  /**
   * Convert entity to JSON representation
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      metadata: Object.fromEntries(this.metadata)
    };
  }
}

/**
 * Entity manager for handling entity lifecycle
 */
export class EntityManager {
  private entities: Map<string, BaseEntity> = new Map();
  private entitiesByType: Map<string, Set<string>> = new Map();

  /**
   * Add entity to manager
   */
  addEntity(entity: BaseEntity): void {
    this.entities.set(entity.id, entity);

    // Index by type
    if (!this.entitiesByType.has(entity.type)) {
      this.entitiesByType.set(entity.type, new Set());
    }
    this.entitiesByType.get(entity.type)!.add(entity.id);
  }

  /**
   * Remove entity from manager
   */
  removeEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    // Remove from type index
    const typeSet = this.entitiesByType.get(entity.type);
    if (typeSet) {
      typeSet.delete(entityId);
      if (typeSet.size === 0) {
        this.entitiesByType.delete(entity.type);
      }
    }

    return this.entities.delete(entityId);
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): BaseEntity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: string): BaseEntity[] {
    const entityIds = this.entitiesByType.get(type);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map(id => this.entities.get(id))
      .filter(entity => entity !== undefined) as BaseEntity[];
  }

  /**
   * Get all entities
   */
  getAllEntities(): BaseEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Find entities by predicate
   */
  findEntities(predicate: (entity: BaseEntity) => boolean): BaseEntity[] {
    return Array.from(this.entities.values()).filter(predicate);
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Get entity count by type
   */
  getEntityCountByType(type: string): number {
    const typeSet = this.entitiesByType.get(type);
    return typeSet ? typeSet.size : 0;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.entitiesByType.clear();
  }
}