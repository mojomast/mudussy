/**
 * Sample NPC Instances - demonstrates how to use the NPC templates
 */

import { INPCData } from './types';
import NPCTemplateFactory from './npc-templates';

/**
 * Collection of sample NPC instances created from templates
 */
export class SampleNPCs {

  /**
   * Create sample vendor NPCs
   */
  static createSampleVendors(): INPCData[] {
    const vendors: INPCData[] = [];

    // General goods merchant
    const generalMerchant = NPCTemplateFactory.createVendorTemplate(
      'general_merchant',
      'a cheerful merchant',
      'A cheerful merchant with a wide smile stands behind a cluttered counter filled with various goods. He wears a colorful vest adorned with small trinkets and seems eager to make a sale.',
      ['sword', 'shield', 'potion', 'bread', 'rope'],
      {
        'sword': 50,
        'shield': 30,
        'potion': 10,
        'bread': 2,
        'rope': 5
      },
      ['general_goods', 'weapons', 'consumables']
    );

    vendors.push(NPCTemplateFactory.templateToNPCData(
      generalMerchant,
      'eldoria:market_square',
      'town-sector'
    ));

    // Herbalist
    const herbalist = NPCTemplateFactory.createVendorTemplate(
      'herbalist',
      'a wise herbalist',
      'An elderly woman with gray hair and wrinkled hands carefully arranges bundles of herbs and vials of potions. She wears a simple robe stained with various plant dyes and has a knowledgeable look in her eyes.',
      ['healing_potion', 'strength_potion', 'herb_bundle', 'antidote', 'magic_herb'],
      {
        'healing_potion': 25,
        'strength_potion': 35,
        'herb_bundle': 8,
        'antidote': 20,
        'magic_herb': 15
      },
      ['herbs', 'potions', 'remedies']
    );

    vendors.push(NPCTemplateFactory.templateToNPCData(
      herbalist,
      'eldoria:herbalist_shop',
      'town-sector'
    ));

    // Blacksmith (enhanced version of existing)
    const blacksmith = NPCTemplateFactory.createVendorTemplate(
      'master_blacksmith',
      'a master blacksmith',
      'A muscular blacksmith with soot-stained skin and a leather apron hammers away at a glowing piece of metal. The air is filled with the scent of hot iron and coal smoke.',
      ['iron_sword', 'steel_armor', 'chainmail', 'helmet', 'hammer', 'anvil'],
      {
        'iron_sword': 75,
        'steel_armor': 150,
        'chainmail': 120,
        'helmet': 40,
        'hammer': 25,
        'anvil': 200
      },
      ['weapons', 'armor', 'tools']
    );

    vendors.push(NPCTemplateFactory.templateToNPCData(
      blacksmith,
      'eldoria:blacksmith',
      'town-sector'
    ));

    return vendors;
  }

  /**
   * Create sample king NPCs
   */
  static createSampleKings(): INPCData[] {
    const kings: INPCData[] = [];

    // King of Eldoria
    const kingOfEldoria = NPCTemplateFactory.createKingTemplate(
      'king_eldoria',
      'King Reginald the Wise',
      'A dignified king sits upon an ornate throne. He wears a golden crown and royal robes, exuding an air of authority and wisdom. His eyes show the weight of ruling a kingdom.',
      'Eldoria',
      [
        'All citizens must pay taxes by the full moon',
        'The royal tournament will be held next month',
        'Trade routes to the north are now open'
      ]
    );

    kings.push(NPCTemplateFactory.templateToNPCData(
      kingOfEldoria,
      'eldoria:throne_room',
      'castle-sector'
    ));

    return kings;
  }

  /**
   * Create sample soldier NPCs
   */
  static createSampleSoldiers(): INPCData[] {
    const soldiers: INPCData[] = [];

    // Royal Guard Captain
    const guardCaptain = NPCTemplateFactory.createSoldierTemplate(
      'royal_guard_captain',
      'Captain Valeria Storm',
      'A stern woman in polished armor stands at attention. Her captain\'s insignia gleams on her shoulder, and she watches everything with keen, disciplined eyes.',
      'captain',
      'Royal Guard'
    );

    // Set commanding officer to self (as captain)
    (guardCaptain as any).commandingOfficer = 'royal_guard_captain';
    guardCaptain.stats.leadership = 18;

    soldiers.push(NPCTemplateFactory.templateToNPCData(
      guardCaptain,
      'eldoria:castle_entrance',
      'castle-sector'
    ));

    // Town Guard
    const townGuard = NPCTemplateFactory.createSoldierTemplate(
      'town_guard',
      'a vigilant town guard',
      'A sturdy guard patrols the streets, keeping watch for any signs of trouble. His armor bears the town\'s crest and he carries himself with professional alertness.',
      'guard',
      'Town Watch'
    );

    soldiers.push(NPCTemplateFactory.templateToNPCData(
      townGuard,
      'eldoria:town_gate',
      'town-sector'
    ));

    // Elite Archer
    const eliteArcher = NPCTemplateFactory.createSoldierTemplate(
      'elite_archer',
      'an elite archer',
      'A skilled archer with keen eyesight stands ready with bow in hand. His leather armor is reinforced with metal plates, and he has a quiver full of precisely crafted arrows.',
      'elite_marksman',
      'Royal Archers'
    );

    eliteArcher.stats.agility = 16;
    eliteArcher.stats.perception = 18;
    eliteArcher.weapons = ['longbow', 'dagger'];

    soldiers.push(NPCTemplateFactory.templateToNPCData(
      eliteArcher,
      'eldoria:castle_wall',
      'castle-sector'
    ));

    return soldiers;
  }

  /**
   * Create sample commoner NPCs
   */
  static createSampleCommoners(): INPCData[] {
    const commoners: INPCData[] = [];

    // Baker
    const baker = NPCTemplateFactory.createCommonerTemplate(
      'baker',
      'a friendly baker',
      'A plump woman with flour-dusted apron smiles as she arranges fresh loaves of bread in her shop window. The warm scent of baking fills the air.',
      'baker',
      'Market District'
    );

    baker.concerns = ['fresh_ingredients', 'customer_satisfaction', 'weather'];

    commoners.push(NPCTemplateFactory.templateToNPCData(
      baker,
      'eldoria:bakery',
      'town-sector'
    ));

    // Farmer
    const farmer = NPCTemplateFactory.createCommonerTemplate(
      'farmer',
      'a weathered farmer',
      'A weathered farmer with calloused hands leans against his pitchfork. His face is tanned from long days in the sun, and he wears simple work clothes covered in dirt.',
      'farmer',
      'Countryside'
    );

    farmer.concerns = ['crop_yields', 'weather', 'market_prices'];
    farmer.wealth = 'poor';

    commoners.push(NPCTemplateFactory.templateToNPCData(
      farmer,
      'eldoria:farmland',
      'countryside-sector'
    ));

    // Noble's Servant
    const servant = NPCTemplateFactory.createCommonerTemplate(
      'noble_servant',
      'a diligent servant',
      'A neatly dressed servant hurries about, carrying linens and cleaning supplies. She moves with purpose but keeps her head down, avoiding eye contact.',
      'housekeeper',
      'Noble District'
    );

    servant.concerns = ['duties', 'master_satisfaction', 'gossip'];
    servant.wealth = 'poor';
    servant.behaviors = ['submissive', 'efficient', 'discreet'];

    commoners.push(NPCTemplateFactory.templateToNPCData(
      servant,
      'eldoria:noble_house',
      'noble-sector'
    ));

    return commoners;
  }

  /**
   * Create sample jester NPCs
   */
  static createSampleJesters(): INPCData[] {
    const jesters: INPCData[] = [];

    // Royal Court Jester
    const courtJester = NPCTemplateFactory.createJesterTemplate(
      'court_jester',
      'Jingle the Magnificent',
      'A colorful jester with bells on his hat and multicolored clothes capers about. His face is painted white with exaggerated features, and he carries various props for his performances.',
      [
        'Why did the king go to art school? To learn how to draw his sword!',
        'What\'s a king\'s favorite type of music? Royal-ty!',
        'Why was the math book sad at the royal library? Because it had too many problems!'
      ],
      true // Court position
    );

    jesters.push(NPCTemplateFactory.templateToNPCData(
      courtJester,
      'eldoria:great_hall',
      'castle-sector'
    ));

    // Traveling Jester
    const travelingJester = NPCTemplateFactory.createJesterTemplate(
      'traveling_jester',
      'a wandering jester',
      'A dusty jester with a well-worn lute slung over his back wanders the streets. His clothes are patched but colorful, and he has a mischievous twinkle in his eye.',
      [
        'Why don\'t mermaids use smartphones? They prefer shell phones!',
        'What do you call a fish with no eyes? Fsh!',
        'Why did the scarecrow become a successful comedian? Because he was outstanding in his field!'
      ],
      false // Not in court
    );

    travelingJester.stats.performance = 15;
    travelingJester.favoriteAudience = ['commoners', 'merchants', 'travelers'];

    jesters.push(NPCTemplateFactory.templateToNPCData(
      travelingJester,
      'eldoria:tavern',
      'town-sector'
    ));

    return jesters;
  }

  /**
   * Create sample animal NPCs
   */
  static createSampleAnimals(): INPCData[] {
    const animals: INPCData[] = [];

    // Wild Wolf
    const wolf = NPCTemplateFactory.createAnimalTemplate(
      'wild_wolf',
      'a gray wolf',
      'A sleek gray wolf with piercing yellow eyes watches from the shadows. Its fur blends with the forest surroundings, and it moves with predatory grace.',
      'wolf',
      'wild',
      'aggressive'
    );

    wolf.stats.strength = 12;
    wolf.stats.agility = 15;
    wolf.packSize = 3;

    animals.push(NPCTemplateFactory.templateToNPCData(
      wolf,
      'eldoria:dark_forest',
      'forest-sector'
    ));

    // Domesticated Dog
    const dog = NPCTemplateFactory.createAnimalTemplate(
      'farm_dog',
      'a loyal farm dog',
      'A friendly brown dog with floppy ears wags its tail enthusiastically. It seems well-fed and happy, clearly accustomed to human company.',
      'dog',
      'domesticated',
      'passive'
    );

    dog.stats.loyalty = 18;
    dog.owner = 'farmer';
    dog.habitat = ['farm', 'village'];

    animals.push(NPCTemplateFactory.templateToNPCData(
      dog,
      'eldoria:farmhouse',
      'countryside-sector'
    ));

    // Curious Squirrel
    const squirrel = NPCTemplateFactory.createAnimalTemplate(
      'curious_squirrel',
      'a curious squirrel',
      'A small red squirrel with a bushy tail chatters from a tree branch. It seems more interested in observing than fleeing from your presence.',
      'squirrel',
      'wild',
      'curious'
    );

    squirrel.stats.agility = 18;
    squirrel.stats.instinct = 12;
    squirrel.diet = ['nuts', 'seeds', 'berries'];

    animals.push(NPCTemplateFactory.templateToNPCData(
      squirrel,
      'eldoria:park',
      'town-sector'
    ));

    return animals;
  }

  /**
   * Get all sample NPCs
   */
  static getAllSampleNPCs(): INPCData[] {
    return [
      ...this.createSampleVendors(),
      ...this.createSampleKings(),
      ...this.createSampleSoldiers(),
      ...this.createSampleCommoners(),
      ...this.createSampleJesters(),
      ...this.createSampleAnimals()
    ];
  }

  /**
   * Get sample NPCs by type
   */
  static getSampleNPCsByType(type: string): INPCData[] {
    const allNPCs = this.getAllSampleNPCs();
    return allNPCs.filter(npc => {
      const npcType = npc.flags.find(flag =>
        ['vendor', 'king', 'soldier', 'commoner', 'jester', 'animal'].includes(flag)
      );
      return npcType === type;
    });
  }
}

export default SampleNPCs;