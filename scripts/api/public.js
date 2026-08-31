import { CraftingHandler } from "../crafting/CraftingHandler.js";

export class PF2EDowntimeScalingApi {
    /**
   * Craft an item
   * @returns {Promise<void>}
   */
    static async craft(){
        const craftingData = await CraftingHandler.openCraftingDialog();
        return await CraftingHandler.craftItem(craftingData);
    }
}

