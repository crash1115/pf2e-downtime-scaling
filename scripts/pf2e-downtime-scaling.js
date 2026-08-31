import { PF2EDowntimeScalingApi } from "./api/public.js";
import { registerSettings } from "./helpers/settings.js"

export const MODULE = "pf2e-downtime-scaling";

Hooks.on(`init`, () => {
    // Register Settings
    registerSettings();

    // Provide the public api
    game.modules.get(MODULE).api = PF2EDowntimeScalingApi;
});