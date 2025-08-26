"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleNPCs = void 0;
const npc_templates_1 = __importDefault(require("./npc-templates"));
class SampleNPCs {
    static createSampleVendors() {
        const vendors = [];
        const generalMerchant = npc_templates_1.default.createVendorTemplate('general_merchant', 'a cheerful merchant', 'A cheerful merchant with a wide smile stands behind a cluttered counter filled with various goods. He wears a colorful vest adorned with small trinkets and seems eager to make a sale.', ['sword', 'shield', 'potion', 'bread', 'rope'], {
            'sword': 50,
            'shield': 30,
            'potion': 10,
            'bread': 2,
            'rope': 5
        }, ['general_goods', 'weapons', 'consumables']);
        vendors.push(npc_templates_1.default.templateToNPCData(generalMerchant, 'eldoria:market_square', 'town-sector'));
        const herbalist = npc_templates_1.default.createVendorTemplate('herbalist', 'a wise herbalist', 'An elderly woman with gray hair and wrinkled hands carefully arranges bundles of herbs and vials of potions. She wears a simple robe stained with various plant dyes and has a knowledgeable look in her eyes.', ['healing_potion', 'strength_potion', 'herb_bundle', 'antidote', 'magic_herb'], {
            'healing_potion': 25,
            'strength_potion': 35,
            'herb_bundle': 8,
            'antidote': 20,
            'magic_herb': 15
        }, ['herbs', 'potions', 'remedies']);
        vendors.push(npc_templates_1.default.templateToNPCData(herbalist, 'eldoria:herbalist_shop', 'town-sector'));
        const blacksmith = npc_templates_1.default.createVendorTemplate('master_blacksmith', 'a master blacksmith', 'A muscular blacksmith with soot-stained skin and a leather apron hammers away at a glowing piece of metal. The air is filled with the scent of hot iron and coal smoke.', ['iron_sword', 'steel_armor', 'chainmail', 'helmet', 'hammer', 'anvil'], {
            'iron_sword': 75,
            'steel_armor': 150,
            'chainmail': 120,
            'helmet': 40,
            'hammer': 25,
            'anvil': 200
        }, ['weapons', 'armor', 'tools']);
        vendors.push(npc_templates_1.default.templateToNPCData(blacksmith, 'eldoria:blacksmith', 'town-sector'));
        return vendors;
    }
    static createSampleKings() {
        const kings = [];
        const kingOfEldoria = npc_templates_1.default.createKingTemplate('king_eldoria', 'King Reginald the Wise', 'A dignified king sits upon an ornate throne. He wears a golden crown and royal robes, exuding an air of authority and wisdom. His eyes show the weight of ruling a kingdom.', 'Eldoria', [
            'All citizens must pay taxes by the full moon',
            'The royal tournament will be held next month',
            'Trade routes to the north are now open'
        ]);
        kings.push(npc_templates_1.default.templateToNPCData(kingOfEldoria, 'eldoria:throne_room', 'castle-sector'));
        return kings;
    }
    static createSampleSoldiers() {
        const soldiers = [];
        const guardCaptain = npc_templates_1.default.createSoldierTemplate('royal_guard_captain', 'Captain Valeria Storm', 'A stern woman in polished armor stands at attention. Her captain\'s insignia gleams on her shoulder, and she watches everything with keen, disciplined eyes.', 'captain', 'Royal Guard');
        guardCaptain.commandingOfficer = 'royal_guard_captain';
        guardCaptain.stats.leadership = 18;
        soldiers.push(npc_templates_1.default.templateToNPCData(guardCaptain, 'eldoria:castle_entrance', 'castle-sector'));
        const townGuard = npc_templates_1.default.createSoldierTemplate('town_guard', 'a vigilant town guard', 'A sturdy guard patrols the streets, keeping watch for any signs of trouble. His armor bears the town\'s crest and he carries himself with professional alertness.', 'guard', 'Town Watch');
        soldiers.push(npc_templates_1.default.templateToNPCData(townGuard, 'eldoria:town_gate', 'town-sector'));
        const eliteArcher = npc_templates_1.default.createSoldierTemplate('elite_archer', 'an elite archer', 'A skilled archer with keen eyesight stands ready with bow in hand. His leather armor is reinforced with metal plates, and he has a quiver full of precisely crafted arrows.', 'elite_marksman', 'Royal Archers');
        eliteArcher.stats.agility = 16;
        eliteArcher.stats.perception = 18;
        eliteArcher.weapons = ['longbow', 'dagger'];
        soldiers.push(npc_templates_1.default.templateToNPCData(eliteArcher, 'eldoria:castle_wall', 'castle-sector'));
        return soldiers;
    }
    static createSampleCommoners() {
        const commoners = [];
        const baker = npc_templates_1.default.createCommonerTemplate('baker', 'a friendly baker', 'A plump woman with flour-dusted apron smiles as she arranges fresh loaves of bread in her shop window. The warm scent of baking fills the air.', 'baker', 'Market District');
        baker.concerns = ['fresh_ingredients', 'customer_satisfaction', 'weather'];
        commoners.push(npc_templates_1.default.templateToNPCData(baker, 'eldoria:bakery', 'town-sector'));
        const farmer = npc_templates_1.default.createCommonerTemplate('farmer', 'a weathered farmer', 'A weathered farmer with calloused hands leans against his pitchfork. His face is tanned from long days in the sun, and he wears simple work clothes covered in dirt.', 'farmer', 'Countryside');
        farmer.concerns = ['crop_yields', 'weather', 'market_prices'];
        farmer.wealth = 'poor';
        commoners.push(npc_templates_1.default.templateToNPCData(farmer, 'eldoria:farmland', 'countryside-sector'));
        const servant = npc_templates_1.default.createCommonerTemplate('noble_servant', 'a diligent servant', 'A neatly dressed servant hurries about, carrying linens and cleaning supplies. She moves with purpose but keeps her head down, avoiding eye contact.', 'housekeeper', 'Noble District');
        servant.concerns = ['duties', 'master_satisfaction', 'gossip'];
        servant.wealth = 'poor';
        servant.behaviors = ['submissive', 'efficient', 'discreet'];
        commoners.push(npc_templates_1.default.templateToNPCData(servant, 'eldoria:noble_house', 'noble-sector'));
        return commoners;
    }
    static createSampleJesters() {
        const jesters = [];
        const courtJester = npc_templates_1.default.createJesterTemplate('court_jester', 'Jingle the Magnificent', 'A colorful jester with bells on his hat and multicolored clothes capers about. His face is painted white with exaggerated features, and he carries various props for his performances.', [
            'Why did the king go to art school? To learn how to draw his sword!',
            'What\'s a king\'s favorite type of music? Royal-ty!',
            'Why was the math book sad at the royal library? Because it had too many problems!'
        ], true);
        jesters.push(npc_templates_1.default.templateToNPCData(courtJester, 'eldoria:great_hall', 'castle-sector'));
        const travelingJester = npc_templates_1.default.createJesterTemplate('traveling_jester', 'a wandering jester', 'A dusty jester with a well-worn lute slung over his back wanders the streets. His clothes are patched but colorful, and he has a mischievous twinkle in his eye.', [
            'Why don\'t mermaids use smartphones? They prefer shell phones!',
            'What do you call a fish with no eyes? Fsh!',
            'Why did the scarecrow become a successful comedian? Because he was outstanding in his field!'
        ], false);
        travelingJester.stats.performance = 15;
        travelingJester.favoriteAudience = ['commoners', 'merchants', 'travelers'];
        jesters.push(npc_templates_1.default.templateToNPCData(travelingJester, 'eldoria:tavern', 'town-sector'));
        return jesters;
    }
    static createSampleAnimals() {
        const animals = [];
        const wolf = npc_templates_1.default.createAnimalTemplate('wild_wolf', 'a gray wolf', 'A sleek gray wolf with piercing yellow eyes watches from the shadows. Its fur blends with the forest surroundings, and it moves with predatory grace.', 'wolf', 'wild', 'aggressive');
        wolf.stats.strength = 12;
        wolf.stats.agility = 15;
        wolf.packSize = 3;
        animals.push(npc_templates_1.default.templateToNPCData(wolf, 'eldoria:dark_forest', 'forest-sector'));
        const dog = npc_templates_1.default.createAnimalTemplate('farm_dog', 'a loyal farm dog', 'A friendly brown dog with floppy ears wags its tail enthusiastically. It seems well-fed and happy, clearly accustomed to human company.', 'dog', 'domesticated', 'passive');
        dog.stats.loyalty = 18;
        dog.owner = 'farmer';
        dog.habitat = ['farm', 'village'];
        animals.push(npc_templates_1.default.templateToNPCData(dog, 'eldoria:farmhouse', 'countryside-sector'));
        const squirrel = npc_templates_1.default.createAnimalTemplate('curious_squirrel', 'a curious squirrel', 'A small red squirrel with a bushy tail chatters from a tree branch. It seems more interested in observing than fleeing from your presence.', 'squirrel', 'wild', 'curious');
        squirrel.stats.agility = 18;
        squirrel.stats.instinct = 12;
        squirrel.diet = ['nuts', 'seeds', 'berries'];
        animals.push(npc_templates_1.default.templateToNPCData(squirrel, 'eldoria:park', 'town-sector'));
        return animals;
    }
    static getAllSampleNPCs() {
        return [
            ...this.createSampleVendors(),
            ...this.createSampleKings(),
            ...this.createSampleSoldiers(),
            ...this.createSampleCommoners(),
            ...this.createSampleJesters(),
            ...this.createSampleAnimals()
        ];
    }
    static getSampleNPCsByType(type) {
        const allNPCs = this.getAllSampleNPCs();
        return allNPCs.filter(npc => {
            const npcType = npc.flags.find(flag => ['vendor', 'king', 'soldier', 'commoner', 'jester', 'animal'].includes(flag));
            return npcType === type;
        });
    }
}
exports.SampleNPCs = SampleNPCs;
exports.default = SampleNPCs;
//# sourceMappingURL=sample-npcs.js.map