import { CraftingHandler } from "../crafting/CraftingHandler.js";

export class PF2EDowntimeScalingApi {
    /**
   * Craft an item
   * @returns {Promise<void>}
   */
    static async craft(){
        const craftingData = await CraftingHandler.openCraftingDialog();
        if(!craftingData) return;
        const options = {free: false};
        return await CraftingHandler.craftItem(craftingData, options);
    };
}

