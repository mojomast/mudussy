export interface IEntity {
    id: string;
    name: string;
    type: string;
    created: Date;
    updated: Date;
    metadata: Map<string, any>;
}
export declare abstract class BaseEntity implements IEntity {
    id: string;
    name: string;
    type: string;
    created: Date;
    updated: Date;
    metadata: Map<string, any>;
    constructor(name: string, type: string);
    update(): void;
    setMetadata(key: string, value: any): void;
    getMetadata(key: string): any;
    hasMetadata(key: string): boolean;
    removeMetadata(key: string): boolean;
    toJSON(): object;
}
export declare class EntityManager {
    private entities;
    private entitiesByType;
    addEntity(entity: BaseEntity): void;
    removeEntity(entityId: string): boolean;
    getEntity(entityId: string): BaseEntity | undefined;
    getEntitiesByType(type: string): BaseEntity[];
    getAllEntities(): BaseEntity[];
    findEntities(predicate: (entity: BaseEntity) => boolean): BaseEntity[];
    getEntityCount(): number;
    getEntityCountByType(type: string): number;
    clear(): void;
}
