/**
 * Dice Plugin for MUD Engine
 *
 * This plugin adds dice rolling functionality to the MUD engine.
 * Usage: /roll d20, /roll 2d6, etc.
 */

const { BasePlugin } = require('../engine/core/plugin');
const { ColorScheme } = require('../engine/modules/networking/ansi');

class DicePlugin extends BasePlugin {
  constructor() {
    super({
      id: 'dice-plugin',
      name: 'Dice Plugin',
      version: '1.0.0',
      description: 'A plugin for rolling dice in the MUD engine'
    });
  }

  async initialize(context) {
    await super.initialize(context);

    // Register dice commands
    if (context.commandParser) {
      context.commandParser.registerCommand({
        command: 'roll',
        aliases: ['dice', 'd'],
        description: 'Roll dice',
        usage: 'roll <dice-spec> (e.g., d20, 2d6)',
        handler: async (sessionId, args) => {
          if (args.length === 0) {
            return ColorScheme.error('What do you want to roll? Usage: roll <dice-spec>');
          }

          const diceSpec = args[0].toLowerCase();
          const result = this.rollDice(diceSpec);

          if (result === null) {
            return ColorScheme.error('Invalid dice specification. Use format like: d20, 2d6, d10, etc.');
          }

          return ColorScheme.success(`You rolled: ${result}`);
        }
      });

      // Also register as /dice
      context.commandParser.registerCommand({
        command: 'dice',
        description: 'Roll dice (alias for roll)',
        usage: 'dice <dice-spec>',
        handler: async (sessionId, args) => {
          if (args.length === 0) {
            return ColorScheme.error('What do you want to roll? Usage: dice <dice-spec>');
          }

          const diceSpec = args[0].toLowerCase();
          const result = this.rollDice(diceSpec);

          if (result === null) {
            return ColorScheme.error('Invalid dice specification. Use format like: d20, 2d6, d10, etc.');
          }

          return ColorScheme.success(`You rolled: ${result}`);
        }
      });
    }

    console.log('🎲 Dice plugin initialized with roll commands');
  }

  rollDice(spec) {
    // Parse dice specification (e.g., "d20", "2d6", "d10")
    const diceRegex = /^(\d*)d(\d+)$/;
    const match = spec.match(diceRegex);

    if (!match) {
      return null; // Invalid format
    }

    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);

    // Validate ranges
    if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
      return null;
    }

    let total = 0;
    const rolls = [];

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    // Return detailed result for multiple dice
    if (count > 1) {
      return `${total} [${rolls.join(', ')}]`;
    }

    return total;
  }
}

// Support both CommonJS default export and named export patterns
module.exports = DicePlugin;
module.exports.default = DicePlugin;