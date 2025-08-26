"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const entity_1 = require("../../engine/core/entity");
class TestEntity extends entity_1.BaseEntity {
    constructor(name, type = 'test') {
        super(name, type);
    }
}
(0, vitest_1.describe)('Entity System', () => {
    (0, vitest_1.describe)('BaseEntity', () => {
        let entity;
        (0, vitest_1.beforeEach)(() => {
            entity = new TestEntity('Test Entity', 'test');
        });
        (0, vitest_1.it)('should create entity with correct properties', () => {
            (0, vitest_1.expect)(entity.id).toBeDefined();
            (0, vitest_1.expect)(entity.name).toBe('Test Entity');
            (0, vitest_1.expect)(entity.type).toBe('test');
            (0, vitest_1.expect)(entity.created).toBeInstanceOf(Date);
            (0, vitest_1.expect)(entity.updated).toBeInstanceOf(Date);
            (0, vitest_1.expect)(entity.metadata).toBeInstanceOf(Map);
        });
        (0, vitest_1.it)('should generate unique IDs', () => {
            const entity2 = new TestEntity('Another Entity');
            (0, vitest_1.expect)(entity.id).not.toBe(entity2.id);
        });
        (0, vitest_1.it)('should update timestamp when modified', () => {
            const originalUpdated = entity.updated.getTime();
            setTimeout(() => {
                entity.update();
                (0, vitest_1.expect)(entity.updated.getTime()).toBeGreaterThan(originalUpdated);
            }, 1);
        });
        (0, vitest_1.it)('should set and get metadata', () => {
            entity.setMetadata('key1', 'value1');
            entity.setMetadata('key2', 42);
            (0, vitest_1.expect)(entity.getMetadata('key1')).toBe('value1');
            (0, vitest_1.expect)(entity.getMetadata('key2')).toBe(42);
            (0, vitest_1.expect)(entity.getMetadata('nonexistent')).toBeUndefined();
        });
        (0, vitest_1.it)('should check metadata existence', () => {
            entity.setMetadata('existing', 'value');
            (0, vitest_1.expect)(entity.hasMetadata('existing')).toBe(true);
            (0, vitest_1.expect)(entity.hasMetadata('nonexistent')).toBe(false);
        });
        (0, vitest_1.it)('should remove metadata', () => {
            entity.setMetadata('key', 'value');
            (0, vitest_1.expect)(entity.hasMetadata('key')).toBe(true);
            const result = entity.removeMetadata('key');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(entity.hasMetadata('key')).toBe(false);
            const result2 = entity.removeMetadata('nonexistent');
            (0, vitest_1.expect)(result2).toBe(false);
        });
        (0, vitest_1.it)('should update timestamp when setting metadata', () => {
            const originalUpdated = entity.updated.getTime();
            setTimeout(() => {
                entity.setMetadata('key', 'value');
                (0, vitest_1.expect)(entity.updated.getTime()).toBeGreaterThan(originalUpdated);
            }, 1);
        });
        (0, vitest_1.it)('should convert to JSON correctly', () => {
            entity.setMetadata('testKey', 'testValue');
            entity.setMetadata('numberKey', 123);
            const json = entity.toJSON();
            (0, vitest_1.expect)(json).toHaveProperty('id', entity.id);
            (0, vitest_1.expect)(json).toHaveProperty('name', entity.name);
            (0, vitest_1.expect)(json).toHaveProperty('type', entity.type);
            (0, vitest_1.expect)(json).toHaveProperty('created');
            (0, vitest_1.expect)(json).toHaveProperty('updated');
            (0, vitest_1.expect)(json.metadata).toEqual({
                testKey: 'testValue',
                numberKey: 123,
            });
        });
        (0, vitest_1.it)('should handle complex metadata objects', () => {
            const complexObject = {
                nested: {
                    array: [1, 2, 3],
                    string: 'test',
                },
                nullValue: null,
                undefinedValue: undefined,
            };
            entity.setMetadata('complex', complexObject);
            (0, vitest_1.expect)(entity.getMetadata('complex')).toEqual(complexObject);
        });
    });
    (0, vitest_1.describe)('EntityManager', () => {
        let manager;
        (0, vitest_1.beforeEach)(() => {
            manager = new entity_1.EntityManager();
        });
        (0, vitest_1.it)('should start empty', () => {
            (0, vitest_1.expect)(manager.getAllEntities()).toHaveLength(0);
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(0);
        });
        (0, vitest_1.it)('should add entities', () => {
            const entity = new TestEntity('Test Entity');
            manager.addEntity(entity);
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(1);
            (0, vitest_1.expect)(manager.getAllEntities()).toContain(entity);
        });
        (0, vitest_1.it)('should retrieve entities by ID', () => {
            const entity = new TestEntity('Test Entity');
            manager.addEntity(entity);
            const retrieved = manager.getEntity(entity.id);
            (0, vitest_1.expect)(retrieved).toBe(entity);
            const nonexistent = manager.getEntity('nonexistent');
            (0, vitest_1.expect)(nonexistent).toBeUndefined();
        });
        (0, vitest_1.it)('should remove entities', () => {
            const entity = new TestEntity('Test Entity');
            manager.addEntity(entity);
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(1);
            const result = manager.removeEntity(entity.id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(0);
            (0, vitest_1.expect)(manager.getEntity(entity.id)).toBeUndefined();
            const result2 = manager.removeEntity('nonexistent');
            (0, vitest_1.expect)(result2).toBe(false);
        });
        (0, vitest_1.it)('should get entities by type', () => {
            const entity1 = new TestEntity('Entity 1', 'type1');
            const entity2 = new TestEntity('Entity 2', 'type1');
            const entity3 = new TestEntity('Entity 3', 'type2');
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            manager.addEntity(entity3);
            const type1Entities = manager.getEntitiesByType('type1');
            (0, vitest_1.expect)(type1Entities).toHaveLength(2);
            (0, vitest_1.expect)(type1Entities).toContain(entity1);
            (0, vitest_1.expect)(type1Entities).toContain(entity2);
            const type2Entities = manager.getEntitiesByType('type2');
            (0, vitest_1.expect)(type2Entities).toHaveLength(1);
            (0, vitest_1.expect)(type2Entities).toContain(entity3);
            const nonexistentType = manager.getEntitiesByType('nonexistent');
            (0, vitest_1.expect)(nonexistentType).toHaveLength(0);
        });
        (0, vitest_1.it)('should get entity count by type', () => {
            const entity1 = new TestEntity('Entity 1', 'type1');
            const entity2 = new TestEntity('Entity 2', 'type1');
            const entity3 = new TestEntity('Entity 3', 'type2');
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            manager.addEntity(entity3);
            (0, vitest_1.expect)(manager.getEntityCountByType('type1')).toBe(2);
            (0, vitest_1.expect)(manager.getEntityCountByType('type2')).toBe(1);
            (0, vitest_1.expect)(manager.getEntityCountByType('nonexistent')).toBe(0);
        });
        (0, vitest_1.it)('should find entities by predicate', () => {
            const entity1 = new TestEntity('Alpha', 'type1');
            const entity2 = new TestEntity('Beta', 'type1');
            const entity3 = new TestEntity('Alpha', 'type2');
            entity1.setMetadata('level', 5);
            entity2.setMetadata('level', 10);
            entity3.setMetadata('level', 5);
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            manager.addEntity(entity3);
            const highLevelEntities = manager.findEntities(entity => (entity.getMetadata('level') || 0) > 5);
            (0, vitest_1.expect)(highLevelEntities).toHaveLength(1);
            (0, vitest_1.expect)(highLevelEntities).toContain(entity2);
            const alphaEntities = manager.findEntities(entity => entity.name === 'Alpha');
            (0, vitest_1.expect)(alphaEntities).toHaveLength(2);
            (0, vitest_1.expect)(alphaEntities).toContain(entity1);
            (0, vitest_1.expect)(alphaEntities).toContain(entity3);
        });
        (0, vitest_1.it)('should clear all entities', () => {
            const entity1 = new TestEntity('Entity 1', 'type1');
            const entity2 = new TestEntity('Entity 2', 'type2');
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(2);
            manager.clear();
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(0);
            (0, vitest_1.expect)(manager.getAllEntities()).toHaveLength(0);
            (0, vitest_1.expect)(manager.getEntitiesByType('type1')).toHaveLength(0);
            (0, vitest_1.expect)(manager.getEntitiesByType('type2')).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle type index cleanup when removing entities', () => {
            const entity1 = new TestEntity('Entity 1', 'type1');
            const entity2 = new TestEntity('Entity 2', 'type1');
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            (0, vitest_1.expect)(manager.getEntityCountByType('type1')).toBe(2);
            manager.removeEntity(entity1.id);
            (0, vitest_1.expect)(manager.getEntityCountByType('type1')).toBe(1);
            manager.removeEntity(entity2.id);
            (0, vitest_1.expect)(manager.getEntityCountByType('type1')).toBe(0);
            (0, vitest_1.expect)(manager.getEntitiesByType('type1')).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle multiple entities with same name', () => {
            const entity1 = new TestEntity('Same Name', 'type1');
            const entity2 = new TestEntity('Same Name', 'type2');
            const entity3 = new TestEntity('Different Name', 'type1');
            manager.addEntity(entity1);
            manager.addEntity(entity2);
            manager.addEntity(entity3);
            const sameNameEntities = manager.findEntities(entity => entity.name === 'Same Name');
            (0, vitest_1.expect)(sameNameEntities).toHaveLength(2);
            (0, vitest_1.expect)(sameNameEntities).toContain(entity1);
            (0, vitest_1.expect)(sameNameEntities).toContain(entity2);
        });
    });
    (0, vitest_1.describe)('Entity Integration', () => {
        let manager;
        (0, vitest_1.beforeEach)(() => {
            manager = new entity_1.EntityManager();
        });
        (0, vitest_1.it)('should maintain data integrity across operations', () => {
            const entity = new TestEntity('Integration Test', 'test');
            entity.setMetadata('important', 'data');
            manager.addEntity(entity);
            const retrieved = manager.getEntity(entity.id);
            (0, vitest_1.expect)(retrieved).toBeDefined();
            retrieved.setMetadata('modified', true);
            const retrievedAgain = manager.getEntity(entity.id);
            (0, vitest_1.expect)(retrievedAgain.getMetadata('important')).toBe('data');
            (0, vitest_1.expect)(retrievedAgain.getMetadata('modified')).toBe(true);
        });
        (0, vitest_1.it)('should handle concurrent-like operations', () => {
            const entities = [];
            for (let i = 0; i < 10; i++) {
                const entity = new TestEntity(`Entity ${i}`, `type${i % 3}`);
                entities.push(entity);
                manager.addEntity(entity);
            }
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(10);
            for (let i = 0; i < entities.length; i += 2) {
                manager.removeEntity(entities[i].id);
            }
            (0, vitest_1.expect)(manager.getEntityCount()).toBe(5);
            for (let i = 1; i < entities.length; i += 2) {
                (0, vitest_1.expect)(manager.getEntity(entities[i].id)).toBeDefined();
            }
        });
    });
});
//# sourceMappingURL=entity.test.js.map