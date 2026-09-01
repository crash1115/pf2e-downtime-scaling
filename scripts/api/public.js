import { CraftingHandler } from "../crafting/CraftingHandler.js";

export class PF2EDowntimeScalingApi {
    static async craft(options){
        const craftingData = await CraftingHandler.openCraftingDialog(options);
        if(!craftingData) return;
        return await CraftingHandler.craftItem(craftingData, options);
    };

    static async payCost(actor, coins){
        return await CraftingHandler.payCost(actor, coins);
    };

    static async giveItems(actor, item, qty){
        return await CraftingHandler.giveItems(actor, item, qty);
    };

}

