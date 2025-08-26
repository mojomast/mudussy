/**
 * NPC Templates - defines templates and factories for different NPC types
 */

import { INPCData, INPCSpawnData } from './types';

// Base NPC template interface
export interface INPCTemplate {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  dialogueProvider: string;
  behaviors: string[];
  stats: Record<string, any>;
  flags: string[];
  metadata: {
    type: string;
    version: string;
    author: string;
    description: string;
  };
}

// Vendor-specific data interface
export interface IVendorData extends INPCTemplate {
  inventory: string[]; // Item IDs available for purchase
  prices: Record<string, number>; // itemId -> price mapping
  currency: string;
  shopHours?: {
    open: number; // Hour of day (0-23)
    close: number;
  };
  specialties: string[]; // Types of items they specialize in
}

// King-specific data interface
export interface IKingData extends INPCTemplate {
  kingdom: string;
  royalGuard: string[]; // NPC IDs of royal guards
  decrees: string[]; // Active decrees or laws
  courtDate: Date; // Next court session
  alliances: string[]; // Allied kingdoms or factions
}

// Soldier-specific data interface
export interface ISoldierData extends INPCTemplate {
  rank: string;
  unit: string;
  commandingOfficer?: string; // NPC ID of commanding officer
  patrolRoute: string[]; // Room IDs for patrol path
  weapons: string[]; // Weapon item IDs
  armor: string[]; // Armor item IDs
  loyalty: number; // 1-10 scale
}

// Commoner-specific data interface
export interface ICommonerData extends INPCTemplate {
  occupation: string;
  homeDistrict: string;
  dailyRoutine: string[]; // Activities or locations they visit
  relationships: Record<string, string>; // npcId -> relationship type
  concerns: string[]; // Current worries or topics of conversation
  wealth: 'poor' | 'middle' | 'wealthy';
}

// Jester-specific data interface
export interface IJesterData extends INPCTemplate {
  jokes: string[]; // Collection of jokes
  tricks: string[]; // Types of tricks they can perform
  instruments: string[]; // Musical instruments they play
  favoriteAudience: string[]; // Types of people they prefer to entertain
  courtPosition: boolean; // Whether they're employed by the court
}

// Animal-specific data interface
export interface IAnimalData extends INPCTemplate {
  species: string;
  domestication: 'wild' | 'tame' | 'domesticated';
  habitat: string[]; // Preferred environments
  diet: string[]; // What they eat
  behavior: 'aggressive' | 'passive' | 'skittish' | 'curious';
  packSize?: number; // For animals that travel in groups
  owner?: string; // NPC ID if owned by someone
}

/**
 * NPC Template Factory - creates NPC templates with default values
 */
export class NPCTemplateFactory {

  /**
   * Create a vendor NPC template
   */
  static createVendorTemplate(
    id: string,
    name: string,
    description: string,
    inventory: string[] = [],
    prices: Record<string, number> = {},
    specialties: string[] = []
  ): IVendorData {
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

  /**
   * Create a king NPC template
   */
  static createKingTemplate(
    id: string,
    name: string,
    description: string,
    kingdom: string,
    decrees: string[] = []
  ): IKingData {
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

  /**
   * Create a soldier NPC template
   */
  static createSoldierTemplate(
    id: string,
    name: string,
    description: string,
    rank: string = 'private',
    unit: string = 'town guard'
  ): ISoldierData {
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

  /**
   * Create a commoner NPC template
   */
  static createCommonerTemplate(
    id: string,
    name: string,
    description: string,
    occupation: string = 'villager',
    homeDistrict: string = 'town'
  ): ICommonerData {
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

  /**
   * Create a jester NPC template
   */
  static createJesterTemplate(
    id: string,
    name: string,
    description: string,
    jokes: string[] = [],
    courtPosition: boolean = false
  ): IJesterData {
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

  /**
   * Create an animal NPC template
   */
  static createAnimalTemplate(
    id: string,
    name: string,
    description: string,
    species: string,
    domestication: 'wild' | 'tame' | 'domesticated' = 'wild',
    behavior: 'aggressive' | 'passive' | 'skittish' | 'curious' = 'passive'
  ): IAnimalData {
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

  /**
   * Convert template to NPC data format for spawning
   */
  static templateToNPCData(
    template: INPCTemplate,
    spawnRoomId: string,
    sectorId: string = 'default'
  ): INPCData {
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

export default NPCTemplateFactory;