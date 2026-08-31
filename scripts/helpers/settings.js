import { MODULE } from "../pf2e-downtime-scaling.js";

export function registerSettings(){
    game.settings.register(MODULE, "craftingMultTrained", {
        name: "Crafting Speed Multiplier (Trained)",
        hint: "When Trained in the skill used to craft, the discount earned per day from the Earn Income table will be multiplied by this amount.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "craftingMultExpert", {
        name: "Crafting Speed Multiplier (Expert)",
        hint: "When Expert in the skill used to craft, the discount earned per day from the Earn Income table will be multiplied by this amount.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "craftingMultMaster", {
        name: "Crafting Speed Multiplier (Master)",
        hint: "When Master in the skill used to craft, the discount earned per day from the Earn Income table will be multiplied by this amount.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "craftingMultLegendary", {
        name: "Crafting Speed Multiplier (Legendary)",
        hint: "When Legendary in the skill used to craft, the discount earned per day from the Earn Income table will be multiplied by this amount.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "eiMultTrained", {
        name: "Earn Income Speed Multiplier (Trained)",
        hint: "When Trained in the skill used to Earn Income, the amount earned per day from the Earn Income table will be multiplied by this amount. Does not stack with crafting multipliers.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "eiMultExpert", {
        name: "Earn Income Speed Multiplier (Expert)",
        hint: "When Expert in the skill used to Earn Income, the amount earned per day from the Earn Income table will be multiplied by this amount. Does not stack with crafting multipliers.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "eiMultMaster", {
        name: "Earn Income Speed Multiplier (Master)",
        hint: "When Master in the skill used to Earn Income, the amount earned per day from the Earn Income table will be multiplied by this amount. Does not stack with crafting multipliers.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "eiMultLegendary", {
        name: "Earn Income Speed Multiplier (Legendary)",
        hint: "When Legendary in the skill used to Earn Income, the amount earned per day from the Earn Income table will be multiplied by this amount. Does not stack with crafting multipliers.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "trackerIntegration", {
        name: "Enable PF2e Downtime Tracker Integration",
        hint: "If using PF2e Downtime Tracker module, will add an option to successful Craft check chat cards to create a tracked project in the Downtime tab of the PC's sheet.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
}