"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const entity_1 = require("../../core/entity");
class Player extends entity_1.BaseEntity {
    constructor(username, sessionId, initialRoomId = 'tavern') {
        super(username, 'player');
        this.type = 'player';
        this.username = username;
        this.sessionId = sessionId;
        this.currentRoomId = initialRoomId;
        this.stats = {
            level: 1,
            experience: 0,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            constitution: 10
        };
        this.inventory = [];
        this.equipment = {};
        this.flags = [];
        this.quests = [];
        this.skills = {};
        this.currency = { gold: 0, silver: 0 };
        this.factionRelations = {};
        this.lastLogin = new Date();
        this.playTime = 0;
    }
    addItem(itemId, quantity = 1) {
        if (quantity <= 0)
            return false;
        const existingItem = this.inventory.find(item => item.itemId === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            this.inventory.push({
                itemId,
                quantity,
                flags: []
            });
        }
        this.update();
        return true;
    }
    removeItem(itemId, quantity = 1) {
        const itemIndex = this.inventory.findIndex(item => item.itemId === itemId);
        if (itemIndex === -1)
            return false;
        const item = this.inventory[itemIndex];
        if (item.quantity < quantity)
            return false;
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.inventory.splice(itemIndex, 1);
        }
        this.update();
        return true;
    }
    hasItem(itemId, quantity = 1) {
        const item = this.inventory.find(item => item.itemId === itemId);
        return item ? item.quantity >= quantity : false;
    }
    getItemQuantity(itemId) {
        const item = this.inventory.find(item => item.itemId === itemId);
        return item ? item.quantity : 0;
    }
    setStat(statName, value) {
        this.stats[statName] = value;
        this.update();
    }
    getStat(statName) {
        return this.stats[statName];
    }
    hasFlag(flag) {
        return this.flags.includes(flag);
    }
    addFlag(flag) {
        if (!this.hasFlag(flag)) {
            this.flags.push(flag);
            this.update();
        }
    }
    removeFlag(flag) {
        const index = this.flags.indexOf(flag);
        if (index !== -1) {
            this.flags.splice(index, 1);
            this.update();
        }
    }
    updateQuestProgress(questId, objective, completed) {
        let quest = this.quests.find(q => q.questId === questId);
        if (!quest) {
            quest = {
                questId,
                status: 'in_progress',
                objectives: {},
                variables: {},
                started: new Date()
            };
            this.quests.push(quest);
        }
        quest.objectives[objective] = completed;
        const allCompleted = Object.values(quest.objectives).every(obj => obj === true);
        if (allCompleted && quest.status !== 'completed') {
            quest.status = 'completed';
            quest.completed = new Date();
        }
        this.update();
    }
    getQuestProgress(questId) {
        return this.quests.find(q => q.questId === questId);
    }
    addSkill(skillName, level) {
        this.skills[skillName] = level;
        this.update();
    }
    getSkillLevel(skillName) {
        return this.skills[skillName] || 0;
    }
    addCurrency(currencyType, amount) {
        if (amount < 0)
            return;
        this.currency[currencyType] = (this.currency[currencyType] || 0) + amount;
        this.update();
    }
    getCurrency(currencyType) {
        return this.currency[currencyType] || 0;
    }
    setFactionRelation(factionName, relation) {
        this.factionRelations[factionName] = Math.max(-100, Math.min(100, relation));
        this.update();
    }
    getFactionRelation(factionName) {
        return this.factionRelations[factionName] || 0;
    }
    moveToRoom(roomId) {
        this.currentRoomId = roomId;
        this.update();
        return true;
    }
    getCurrentRoom() {
        return this.currentRoomId;
    }
    updatePlayTime(additionalTime) {
        this.playTime += additionalTime;
        this.update();
    }
    toSaveData() {
        return {
            id: this.id,
            username: this.username,
            sessionId: this.sessionId,
            stats: { ...this.stats },
            inventory: this.inventory.map(item => ({ ...item })),
            equipment: { ...this.equipment },
            location: {
                roomId: this.currentRoomId,
                areaId: 'default'
            },
            flags: [...this.flags],
            quests: this.quests.map(quest => ({ ...quest })),
            skills: { ...this.skills },
            currency: { ...this.currency },
            factionRelations: { ...this.factionRelations },
            lastLogin: new Date(this.lastLogin),
            playTime: this.playTime,
            created: new Date(this.created),
            updated: new Date(this.updated)
        };
    }
    static fromSaveData(saveData) {
        const player = new Player(saveData.username, saveData.sessionId, saveData.location.roomId);
        player.id = saveData.id;
        player.created = new Date(saveData.created);
        player.updated = new Date(saveData.updated);
        player.stats = { ...saveData.stats };
        player.inventory = saveData.inventory.map(item => ({ ...item }));
        player.equipment = { ...saveData.equipment };
        player.flags = [...saveData.flags];
        player.quests = saveData.quests.map(quest => ({ ...quest }));
        player.skills = { ...saveData.skills };
        player.currency = { ...saveData.currency };
        player.factionRelations = { ...saveData.factionRelations };
        player.lastLogin = new Date(saveData.lastLogin);
        player.playTime = saveData.playTime;
        return player;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            username: this.username,
            sessionId: this.sessionId,
            stats: this.stats,
            inventory: this.inventory,
            equipment: this.equipment,
            currentRoomId: this.currentRoomId,
            flags: this.flags,
            quests: this.quests,
            skills: this.skills,
            currency: this.currency,
            factionRelations: this.factionRelations,
            lastLogin: this.lastLogin.toISOString(),
            playTime: this.playTime
        };
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map