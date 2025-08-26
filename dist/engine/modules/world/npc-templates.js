"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPCTemplateFactory = void 0;
class NPCTemplateFactory {
    static createVendorTemplate(id, name, description, inventory = [], prices = {}, specialties = []) {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'canned-branching',
            behaviors: ['merchant', 'helpful', 'greedy'],
            stats: {
                level: 5,
                health: 80,
                charisma: 12,
                intelligence: 8,
                perception: 10
            },
            flags: ['vendor', 'human', 'merchant'],
            inventory,
            prices,
            currency: 'gold',
            shopHours: {
                open: 8,
                close: 20
            },
            specialties,
            metadata: {
                type: 'vendor',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - A vendor NPC template`
            }
        };
    }
    static createKingTemplate(id, name, description, kingdom, decrees = []) {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'canned-branching',
            behaviors: ['regal', 'authoritative', 'wise', 'protective'],
            stats: {
                level: 20,
                health: 200,
                charisma: 18,
                intelligence: 16,
                wisdom: 17,
                leadership: 20
            },
            flags: ['king', 'human', 'royal', 'lawful', 'powerful'],
            kingdom,
            royalGuard: [],
            decrees,
            courtDate: new Date(),
            alliances: [],
            metadata: {
                type: 'king',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - King of ${kingdom}`
            }
        };
    }
    static createSoldierTemplate(id, name, description, rank = 'private', unit = 'town guard') {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'canned-branching',
            behaviors: ['disciplined', 'alert', 'protective', 'loyal'],
            stats: {
                level: 8,
                health: 120,
                strength: 14,
                defense: 12,
                agility: 10,
                discipline: 15
            },
            flags: ['soldier', 'human', 'lawful', 'armed'],
            rank,
            unit,
            patrolRoute: [],
            weapons: ['sword', 'shield'],
            armor: ['chainmail', 'helmet'],
            loyalty: 8,
            metadata: {
                type: 'soldier',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - ${rank} in ${unit}`
            }
        };
    }
    static createCommonerTemplate(id, name, description, occupation = 'villager', homeDistrict = 'town') {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'canned-branching',
            behaviors: ['friendly', 'busy', 'gossipy', 'helpful'],
            stats: {
                level: 3,
                health: 60,
                charisma: 8,
                intelligence: 6,
                perception: 7
            },
            flags: ['commoner', 'human', 'civilian'],
            occupation,
            homeDistrict,
            dailyRoutine: ['work', 'home', 'market'],
            relationships: {},
            concerns: ['weather', 'local_events', 'gossip'],
            wealth: 'middle',
            metadata: {
                type: 'commoner',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - ${occupation} from ${homeDistrict}`
            }
        };
    }
    static createJesterTemplate(id, name, description, jokes = [], courtPosition = false) {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'canned-branching',
            behaviors: ['humorous', 'cheerful', 'mischievous', 'entertaining'],
            stats: {
                level: 4,
                health: 70,
                charisma: 16,
                dexterity: 12,
                intelligence: 10,
                performance: 18
            },
            flags: ['jester', 'human', 'entertainer', 'chaotic'],
            jokes: jokes.length > 0 ? jokes : [
                'Why did the scarecrow win an award? Because he was outstanding in his field!',
                'What do you call fake spaghetti? An impasta!',
                'Why don\'t skeletons fight each other? They don\'t have the guts!'
            ],
            tricks: ['juggling', 'magic_tricks', 'acrobatics'],
            instruments: ['lute', 'flute', 'tambourine'],
            favoriteAudience: ['nobles', 'children', 'crowds'],
            courtPosition,
            metadata: {
                type: 'jester',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - A jester${courtPosition ? ' in the royal court' : ''}`
            }
        };
    }
    static createAnimalTemplate(id, name, description, species, domestication = 'wild', behavior = 'passive') {
        return {
            id,
            name,
            description,
            shortDescription: name,
            dialogueProvider: 'animal-sounds',
            behaviors: [behavior, 'animal', domestication],
            stats: {
                level: 2,
                health: 40,
                strength: 8,
                agility: 12,
                instinct: 14
            },
            flags: ['animal', species, domestication, behavior],
            species,
            domestication,
            habitat: ['forest', 'fields', 'mountains'],
            diet: ['plants', 'small_animals'],
            behavior,
            packSize: 1,
            metadata: {
                type: 'animal',
                version: '1.0.0',
                author: 'MUD Engine',
                description: `${name} - A ${domestication} ${species} with ${behavior} behavior`
            }
        };
    }
    static templateToNPCData(template, spawnRoomId, sectorId = 'default') {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            shortDescription: template.shortDescription,
            dialogueProvider: template.dialogueProvider,
            behaviors: template.behaviors,
            stats: template.stats,
            flags: template.flags,
            spawnData: {
                npcId: template.id,
                sectorId,
                spawnRoomId,
                spawnConditions: [{
                        type: 'player_enter',
                        value: true
                    }],
                despawnConditions: [{
                        type: 'no_players',
                        delay: 30000
                    }]
            },
            metadata: {
                version: template.metadata.version,
                created: new Date(),
                updated: new Date(),
                author: template.metadata.author
            }
        };
    }
}
exports.NPCTemplateFactory = NPCTemplateFactory;
exports.default = NPCTemplateFactory;
//# sourceMappingURL=npc-templates.js.map