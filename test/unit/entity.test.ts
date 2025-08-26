import { describe, it, expect, beforeEach } from 'vitest';
import { BaseEntity, EntityManager, IEntity } from '../../engine/core/entity';
import { createTestEntity } from '../utils/test-helpers';

// Concrete implementation for testing
class TestEntity extends BaseEntity {
  constructor(name: string, type: string = 'test') {
    super(name, type);
  }
}

describe('Entity System', () => {
  describe('BaseEntity', () => {
    let entity: TestEntity;

    beforeEach(() => {
      entity = new TestEntity('Test Entity', 'test');
    });

    it('should create entity with correct properties', () => {
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test Entity');
      expect(entity.type).toBe('test');
      expect(entity.created).toBeInstanceOf(Date);
      expect(entity.updated).toBeInstanceOf(Date);
      expect(entity.metadata).toBeInstanceOf(Map);
    });

    it('should generate unique IDs', () => {
      const entity2 = new TestEntity('Another Entity');
      expect(entity.id).not.toBe(entity2.id);
    });

    it('should update timestamp when modified', () => {
      const originalUpdated = entity.updated.getTime();
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        entity.update();
        expect(entity.updated.getTime()).toBeGreaterThan(originalUpdated);
      }, 1);
    });

    it('should set and get metadata', () => {
      entity.setMetadata('key1', 'value1');
      entity.setMetadata('key2', 42);

      expect(entity.getMetadata('key1')).toBe('value1');
      expect(entity.getMetadata('key2')).toBe(42);
      expect(entity.getMetadata('nonexistent')).toBeUndefined();
    });

    it('should check metadata existence', () => {
      entity.setMetadata('existing', 'value');
      expect(entity.hasMetadata('existing')).toBe(true);
      expect(entity.hasMetadata('nonexistent')).toBe(false);
    });

    it('should remove metadata', () => {
      entity.setMetadata('key', 'value');
      expect(entity.hasMetadata('key')).toBe(true);

      const result = entity.removeMetadata('key');
      expect(result).toBe(true);
      expect(entity.hasMetadata('key')).toBe(false);

      const result2 = entity.removeMetadata('nonexistent');
      expect(result2).toBe(false);
    });

    it('should update timestamp when setting metadata', () => {
      const originalUpdated = entity.updated.getTime();
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        entity.setMetadata('key', 'value');
        expect(entity.updated.getTime()).toBeGreaterThan(originalUpdated);
      }, 1);
    });

    it('should convert to JSON correctly', () => {
      entity.setMetadata('testKey', 'testValue');
      entity.setMetadata('numberKey', 123);

      const json = entity.toJSON() as any;

      expect(json).toHaveProperty('id', entity.id);
      expect(json).toHaveProperty('name', entity.name);
      expect(json).toHaveProperty('type', entity.type);
      expect(json).toHaveProperty('created');
      expect(json).toHaveProperty('updated');
      expect(json.metadata).toEqual({
        testKey: 'testValue',
        numberKey: 123,
      });
    });

    it('should handle complex metadata objects', () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          string: 'test',
        },
        nullValue: null,
        undefinedValue: undefined,
      };

      entity.setMetadata('complex', complexObject);
      expect(entity.getMetadata('complex')).toEqual(complexObject);
    });
  });

  describe('EntityManager', () => {
    let manager: EntityManager;

    beforeEach(() => {
      manager = new EntityManager();
    });

    it('should start empty', () => {
      expect(manager.getAllEntities()).toHaveLength(0);
      expect(manager.getEntityCount()).toBe(0);
    });

    it('should add entities', () => {
      const entity = new TestEntity('Test Entity');
      manager.addEntity(entity);

      expect(manager.getEntityCount()).toBe(1);
      expect(manager.getAllEntities()).toContain(entity);
    });

    it('should retrieve entities by ID', () => {
      const entity = new TestEntity('Test Entity');
      manager.addEntity(entity);

      const retrieved = manager.getEntity(entity.id);
      expect(retrieved).toBe(entity);

      const nonexistent = manager.getEntity('nonexistent');
      expect(nonexistent).toBeUndefined();
    });

    it('should remove entities', () => {
      const entity = new TestEntity('Test Entity');
      manager.addEntity(entity);

      expect(manager.getEntityCount()).toBe(1);

      const result = manager.removeEntity(entity.id);
      expect(result).toBe(true);
      expect(manager.getEntityCount()).toBe(0);
      expect(manager.getEntity(entity.id)).toBeUndefined();

      const result2 = manager.removeEntity('nonexistent');
      expect(result2).toBe(false);
    });

    it('should get entities by type', () => {
      const entity1 = new TestEntity('Entity 1', 'type1');
      const entity2 = new TestEntity('Entity 2', 'type1');
      const entity3 = new TestEntity('Entity 3', 'type2');

      manager.addEntity(entity1);
      manager.addEntity(entity2);
      manager.addEntity(entity3);

      const type1Entities = manager.getEntitiesByType('type1');
      expect(type1Entities).toHaveLength(2);
      expect(type1Entities).toContain(entity1);
      expect(type1Entities).toContain(entity2);

      const type2Entities = manager.getEntitiesByType('type2');
      expect(type2Entities).toHaveLength(1);
      expect(type2Entities).toContain(entity3);

      const nonexistentType = manager.getEntitiesByType('nonexistent');
      expect(nonexistentType).toHaveLength(0);
    });

    it('should get entity count by type', () => {
      const entity1 = new TestEntity('Entity 1', 'type1');
      const entity2 = new TestEntity('Entity 2', 'type1');
      const entity3 = new TestEntity('Entity 3', 'type2');

      manager.addEntity(entity1);
      manager.addEntity(entity2);
      manager.addEntity(entity3);

      expect(manager.getEntityCountByType('type1')).toBe(2);
      expect(manager.getEntityCountByType('type2')).toBe(1);
      expect(manager.getEntityCountByType('nonexistent')).toBe(0);
    });

    it('should find entities by predicate', () => {
      const entity1 = new TestEntity('Alpha', 'type1');
      const entity2 = new TestEntity('Beta', 'type1');
      const entity3 = new TestEntity('Alpha', 'type2');

      entity1.setMetadata('level', 5);
      entity2.setMetadata('level', 10);
      entity3.setMetadata('level', 5);

      manager.addEntity(entity1);
      manager.addEntity(entity2);
      manager.addEntity(entity3);

      const highLevelEntities = manager.findEntities(entity =>
        (entity.getMetadata('level') || 0) > 5
      );
      expect(highLevelEntities).toHaveLength(1);
      expect(highLevelEntities).toContain(entity2);

      const alphaEntities = manager.findEntities(entity =>
        entity.name === 'Alpha'
      );
      expect(alphaEntities).toHaveLength(2);
      expect(alphaEntities).toContain(entity1);
      expect(alphaEntities).toContain(entity3);
    });

    it('should clear all entities', () => {
      const entity1 = new TestEntity('Entity 1', 'type1');
      const entity2 = new TestEntity('Entity 2', 'type2');

      manager.addEntity(entity1);
      manager.addEntity(entity2);

      expect(manager.getEntityCount()).toBe(2);

      manager.clear();

      expect(manager.getEntityCount()).toBe(0);
      expect(manager.getAllEntities()).toHaveLength(0);
      expect(manager.getEntitiesByType('type1')).toHaveLength(0);
      expect(manager.getEntitiesByType('type2')).toHaveLength(0);
    });

    it('should handle type index cleanup when removing entities', () => {
      const entity1 = new TestEntity('Entity 1', 'type1');
      const entity2 = new TestEntity('Entity 2', 'type1');

      manager.addEntity(entity1);
      manager.addEntity(entity2);

      expect(manager.getEntityCountByType('type1')).toBe(2);

      manager.removeEntity(entity1.id);
      expect(manager.getEntityCountByType('type1')).toBe(1);

      manager.removeEntity(entity2.id);
      expect(manager.getEntityCountByType('type1')).toBe(0);

      // Type should be completely removed from index
      expect(manager.getEntitiesByType('type1')).toHaveLength(0);
    });

    it('should handle multiple entities with same name', () => {
      const entity1 = new TestEntity('Same Name', 'type1');
      const entity2 = new TestEntity('Same Name', 'type2');
      const entity3 = new TestEntity('Different Name', 'type1');

      manager.addEntity(entity1);
      manager.addEntity(entity2);
      manager.addEntity(entity3);

      const sameNameEntities = manager.findEntities(entity =>
        entity.name === 'Same Name'
      );
      expect(sameNameEntities).toHaveLength(2);
      expect(sameNameEntities).toContain(entity1);
      expect(sameNameEntities).toContain(entity2);
    });
  });

  describe('Entity Integration', () => {
    let manager: EntityManager;

    beforeEach(() => {
      manager = new EntityManager();
    });

    it('should maintain data integrity across operations', () => {
      const entity = new TestEntity('Integration Test', 'test');
      entity.setMetadata('important', 'data');

      manager.addEntity(entity);

      // Retrieve and modify
      const retrieved = manager.getEntity(entity.id);
      expect(retrieved).toBeDefined();
      retrieved!.setMetadata('modified', true);

      // Verify changes persist
      const retrievedAgain = manager.getEntity(entity.id);
      expect(retrievedAgain!.getMetadata('important')).toBe('data');
      expect(retrievedAgain!.getMetadata('modified')).toBe(true);
    });

    it('should handle concurrent-like operations', () => {
      // Add multiple entities
      const entities: TestEntity[] = [];
      for (let i = 0; i < 10; i++) {
        const entity = new TestEntity(`Entity ${i}`, `type${i % 3}`);
        entities.push(entity);
        manager.addEntity(entity);
      }

      expect(manager.getEntityCount()).toBe(10);

      // Remove every other entity
      for (let i = 0; i < entities.length; i += 2) {
        manager.removeEntity(entities[i].id);
      }

      expect(manager.getEntityCount()).toBe(5);

      // Verify remaining entities
      for (let i = 1; i < entities.length; i += 2) {
        expect(manager.getEntity(entities[i].id)).toBeDefined();
      }
    });
  });
});