# PF2e Downtime Enhancements
This is a module for Foundry VTT's Pathfinder 2e system that provides a few enhancements for Earn Income and Crafting downtime activities.

## Features
**Speed Multipliers.** Set multipliers for the daily rates for both Crafting and Earn Income downtime activities, to make those things go faster. Multipliers are set individually for each activity, and can be set to vary based on the proficiency level of the skill being used (so you could do something like Trained is x2, Expert is x3, etc). These multipliers are used as defaults for the appropriate actions, but can be overridden on a case by case basis.

**Magical Consumable Crafting.** When you successfully craft a wand or scroll, clicking the button in the chat card to add the items to your sheet will let you select the spell for the item you crafted. It'll then add that specific scroll or wand to your inventory, rather than a generic one.

**Macros.** Two new macros are provided in a compendium - one for Crafting, and one for Earn Income. These should be used in place of any other macro that comes with the system or other modules.

**Craft with Other Skills.** Crafting from a PC's sheet or the included macro will provide an option to use a skill other than Crafting. [COMING SOON]

**Integration with [PF2e Downtime Tracking](https://github.com/crash1115/pf2e-downtime).** A successful Crafting check will provide options that tie into PF2e Downtime Tracking's features. If your downtime unit is set to "days", you'll see an option to pay the materials cost, spend downtime, and receive the item. Regardless of your downtime unit settings, you'll see an option to create a tracked activity, so you can easily keep track of long term crafting projects you can't finish in one chunk of downtime.

## Module Compatibility
Any module that replaces or makes changes to the crafting workflow will not benefit from the changes this module provides. This includes stuff like Heroic Crafting and the associated automation module.

## Known Issues
Because there isn't a good way to hook into the system's crafting code to modify how that works, this module is a ground-up rewrite of those features. As such, some things might be handled differently, poorly, or not at all.
- Occasionally you'll get a very minor rounding error when looking at costs or earnings. This is due to how the system handles scaling currency; I can't do anything about this.

## API

Foundry recommends modules expose their API in a specific way, so I did that. You can access the API like so:
```js
const api = game.modules.get('pf2e-downtime-scaling')?.api;
```

To craft an item using this module's code rather than the base system code:
```js
const item = game.items.getName("Longsword");
const actor = game.actors.getName("My Actor");
const options = {
    actor: actor,  // The actor doing the crafting
    item: item,  // The item to craft
    qty: 4,  // The quantity you want to craft
    mult: 99,  // The speed multiplier for the crafting
    free: false  // When true, no crafting check is made, and materials cost nothing,
    dos: null // When set, skips the check and provides the given result. Can be 0, 1, 2, or 3 for Critical Failure, Failure, Success, or Critical Success respectively
}

const api = game.modules.get('pf2e-downtime-scaling')?.api;
await api.craft(options); // My Actor will craft 4 Longswords, with a speed multiplier of 99
```
Each key in `options` is optional. Not providing them will fall back to module defaults:
- `actor` falls back to a selected token or assigned character, in that order.
- `item` falls back to null, allowing user selection in the crafting window.
- `qty` falls back to 1.
- `mult`'s fallback will be determined based on the module's settings and the actor's proficiency.
- `free` falls back to `false`, which means a cost w
- `dos` falls back to `null`, which means a roll will be made

Not providing `options` at all, or providing an empty object, will use the defaults for everything:
```js
const api = game.modules.get('pf2e-downtime-scaling')?.api;
await api.craft(); // Will open the crafting dialog with defaults selected
```
