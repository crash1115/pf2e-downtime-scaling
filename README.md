# PF2e Downtime Scaling
This is a module for Foundry VTY's Pathfinder 2e system that allows you to set multipliers for the daily rates for both Crafting and Earn Income downtime activities, to make those things go faster. Multipliers are set individually for each activity, and can be set to vary based on the proficiency level of the skill being used (so you could do something like Trained is x2, Expert is x3).

## What's It Do?
Because there isn't a good way to hook into the system's crafting code to modify how that works, this module is a ground-up rewrite crafting and earn income. As such, some things might be handled differently or not at all. See Known Issues below

Two new macros are provided in a compendium - one for Crafting, and for Earn Income. If you want your multipliers to work, you need to use these rather than the ones that come with the system or other modules.

The default Craft button on the crafting tab of a character sheet will be replaced by one that does the module's code rather than the system crafting.

## Module Compatibility
- [PF2e Downtime Tracking](https://github.com/crash1115/pf2e-downtime). An option in settings will make it so that a successful Crafting check will also provide the option to create a tracked activity, so you can easily keep track of long term crafting projects you can't finish in one chunk of downtime.
- Anything else that replaces the Crafting button or changes the crafting workflow in any way will not benefit from the changes this module provides.

## Known Issues
- There's currently no handling for spell-based consumable items like scrolls and wands.
- Occasionally you'll get a very minor rounding error when looking at costs or earnings. This is due to how the system handles scaling currency; I can't do anything about this.
