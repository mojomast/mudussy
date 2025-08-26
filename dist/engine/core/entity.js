"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = exports.BaseEntity = void 0;
const uuid_1 = require("uuid");
class BaseEntity {
    constructor(name, type) {
        this.id = (0, uuid_1.v4)();
        this.name = name;
        this.type = type;
        this.created = new Date();
        this.updated = new Date();
        this.metadata = new Map();
    }
    update() {
        this.updated = new Date();
    }
    setMetadata(key, value) {
        this.metadata.set(key, value);
        this.update();
    }
    getMetadata(key) {
        return this.metadata.get(key);
    }
    hasMetadata(key) {
        return this.metadata.has(key);
    }
    removeMetadata(key) {
        const result = this.metadata.delete(key);
        if (result)
            this.update();
        return result;
    }
    toJSON() {
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
exports.BaseEntity = BaseEntity;
class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entitiesByType = new Map();
    }
    addEntity(entity) {
        this.entities.set(entity.id, entity);
        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type).add(entity.id);
    }
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity)
            return false;
        const typeSet = this.entitiesByType.get(entity.type);
        if (typeSet) {
            typeSet.delete(entityId);
            if (typeSet.size === 0) {
                this.entitiesByType.delete(entity.type);
            }
        }
        return this.entities.delete(entityId);
    }
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    getEntitiesByType(type) {
        const entityIds = this.entitiesByType.get(type);
        if (!entityIds)
            return [];
        return Array.from(entityIds)
            .map(id => this.entities.get(id))
            .filter(entity => entity !== undefined);
    }
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    findEntities(predicate) {
        return Array.from(this.entities.values()).filter(predicate);
    }
    getEntityCount() {
        return this.entities.size;
    }
    getEntityCountByType(type) {
        const typeSet = this.entitiesByType.get(type);
        return typeSet ? typeSet.size : 0;
    }
    clear() {
        this.entities.clear();
        this.entitiesByType.clear();
    }
}
exports.EntityManager = EntityManager;
//# sourceMappingURL=entity.js.map