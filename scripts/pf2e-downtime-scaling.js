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
        const cost = craftingData.cost;
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
                const project = await CraftingHandler.createDowntimeProject(craftingData);
                return project;
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


let savedOldRoll, savedNewRoll, savedResultsMsgId;

Hooks.once("ready", () => {
    libWrapper.register(
        MODULE,
        "game.pf2e.Check.rerollFromMessage",
        function (wrapped, ...args) {
            const message = args[0];
            const craftingMsgs = game.messages.filter(m => m.flags[MODULE]?.rollMsgId === message.id);
            if(craftingMsgs.length > 0){
                savedOldRoll = foundry.utils.deepClone(message.rolls[0]);
                savedResultsMsgId = craftingMsgs[0].id;
            }
            return wrapped(...args);
        },
        "WRAPPER"
    );

    libWrapper.register(
        MODULE,
        "Roll.prototype.toMessage",
        function (wrapped, ...args) {
            if (compareRolls(this, savedNewRoll)){
                CraftingHandler.createRerollChatMsg(savedResultsMsgId, this)
                savedOldRoll = undefined;
                savedNewRoll = undefined;
                savedResultsMsgId = undefined;
            }
            return wrapped(...args);
        },
        "WRAPPER"
    );
});

Hooks.on("pf2e.reroll", (oldRoll, newRoll, resource, options) => {
    if( compareRolls(oldRoll, savedOldRoll) ){
        savedNewRoll = foundry.utils.deepClone(newRoll)
    }    
});

function compareRolls (rollA, rollB){
    if(!rollA || !rollB) return false
    // copy a and b, but remove isReroll and isRerollable
    let modA = JSON.parse(JSON.stringify(rollA));
    delete modA.isReroll;
    delete modA.isRerollable;
    const modB = JSON.parse(JSON.stringify(rollA));
    delete modB.isReroll;
    delete modB.isRerollable;

    const sameWithoutRerolls = JSON.stringify(modA) == JSON.stringify(modB);
    return sameWithoutRerolls;
}