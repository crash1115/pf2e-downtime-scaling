import { PF2EDowntimeScalingApi } from "./api/public.js";
import { CraftingHandler } from "./crafting/CraftingHandler.js";
import { registerSettings } from "./helpers/settings.js"

export const MODULE = "pf2e-downtime-scaling";

Hooks.on(`init`, () => {
    // Register Settings
    registerSettings();

    // Provide the public api
    game.modules.get(MODULE).api = PF2EDowntimeScalingApi;
});

Hooks.on("renderCharacterSheetPF2e", async (data, html) => {
    const craftingTab = html.find('.tab.crafting');
    const formulas = craftingTab.find(".known-formulas");
    const itemRows = formulas.find(".formula-item");
    
    // Remove system crafting buttons
    const systemCraftBtn = itemRows.find("button.craft");
    systemCraftBtn.remove();
    
    // Add module crafting buttons
    const itemControls = itemRows.find(".item-controls");
    itemControls.before(`<button type="button" class="pf2e-downtime-scaling-craft-btn" data-action="pf2e-downtime-scaling-craft"><i class="fa-solid fa-hammer"></i>Craft</button>`);

    // Add event listeners to module crafting buttons
    itemRows.find("button[data-action=pf2e-downtime-scaling-craft]").on("click", async (event) => {
        const uuid = event.currentTarget.parentElement.attributes['data-item-uuid'].value || null;
        const qty =  event.currentTarget.previousElementSibling.children[1].valueAsNumber || 1;
        const actor = data.actor;
        const options = {
            item: await fromUuid(uuid),
            qty: qty,
            actor: actor
        };
        const craftingData = await CraftingHandler.openCraftingDialog(options);
        if(craftingData){
            const btn = craftingTab.find("button[data-action=toggle-free-crafting]");
            const checkbox = btn.find("input")[0];
            const freeCraftingEnabled = checkbox.checked;
            const options = { free: freeCraftingEnabled };
            return await CraftingHandler.craftItem(craftingData, options);
        }
    });
});

Hooks.on("renderChatMessageHTML", async (message, html, context) => {
    if(message.flags[MODULE]){
        const craftingData = message.flags[MODULE].context;
        const cost = message.flags[MODULE].cost;
        const actor = await game.actors.get(craftingData.actorId);
        const item = await fromUuid(craftingData.itemUuid);
        
        const payTenthBtn = html.querySelector("button[data-action=pay-tenth]");
        if(payTenthBtn){
            payTenthBtn.addEventListener("click", async () => {
                const owed = cost.tenth;
                const payment = await CraftingHandler.payCost(actor, owed);
                return payment;
            })
        }

        const payFullBtn = html.querySelector("button[data-action=pay-full]");
        if(payFullBtn){
            payFullBtn.addEventListener("click", async () => {
                const owed = cost.full;
                const payment = await CraftingHandler.payCost(actor, owed);
                if(!payment) return;
                const given = await CraftingHandler.giveItem(actor, item, craftingData.qty)
                return given;
            })
        }
        
        const payHalfBtn = html.querySelector("button[data-action=pay-half]");
        if(payHalfBtn){
            payHalfBtn.addEventListener("click", async () => {
                const owed = cost.half;
                const payment = await CraftingHandler.payCost(actor, owed);
                if(!payment) return;
                const given = await CraftingHandler.giveItem(actor, item, craftingData.qty)
                return given;
            })
        }

        const createProjectBtn = html.querySelector("button[data-action=create-project]");
        if(createProjectBtn){
            createProjectBtn.addEventListener("click", async () => {
                const owed = cost.half;
                const payment = await CraftingHandler.payCost(actor, owed);
                if(!payment) return;
                // todo: add project
                return console.log("adding downtime project")
            })
        }
        
        const getItemsBtn = html.querySelector("button[data-action=get-items]");
        if(getItemsBtn){
            getItemsBtn.addEventListener("click", async () => {
                const given = await CraftingHandler.giveItem(actor, item, craftingData.qty)
                return given;
            })
        }
    }
});