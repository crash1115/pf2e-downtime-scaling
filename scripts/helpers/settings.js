import { MODULE } from "../pf2e-downtime-scaling.js";

export function registerSettings(){
    game.settings.register(MODULE, "craftingMult", {
        name: "Crafting Speed Multiplier",
        hint: "When Crafting, the discount earned per day from the Earn Income table will be multiplied by this amount.",
        scope: "world",
        config: true,
        default: "1",
        type: Number,
    });

    game.settings.register(MODULE, "eiMult", {
        name: "Earn Income Speed Multiplier",
        hint: "When Earning Income, the amount earned per day from the Earn Income table will be multiplied by this amount. Does not stack with crafting multipliers.",
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