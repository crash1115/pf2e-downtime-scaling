import { PF2EDowntimeScalingApi } from "./api/public.js";
import { CraftingHandler } from "./crafting/CraftingHandler.js";
import { EarnIncomeHandler } from "./earn-income/EarnIncomeHandler.js";
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

        if(message.flags[MODULE].type==="crafting"){
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


        if(message.flags[MODULE].type==="earnIncome"){
            const eiData = message.flags[MODULE].context;
            const actor = await game.actors.get(eiData.actorId);
            const wages = eiData.wages;

            const getPaidBtn = html.querySelector("button[data-action=get-paid");
            if(getPaidBtn){
                getPaidBtn.addEventListener("click", async () => {
                    const owed = wages;
                    const paid = await EarnIncomeHandler.payWages(actor, owed);
                    return paid;
                })
            }
        }
    }
});


/*
    The next chunk of stuff is handling for rerolls, as described on Discord here:
    https://discord.com/channels/880968862240239708/880969304365994034/1470057955918479513

    When we roll a crafting check for the first time, we take a look at the roll's message, take its id, and save
    that message id in a flag on our results cards. This ensures that we always know which results card is related
    to which roll, in the event that there are multiple rolls with the same result in the chat log at the same time.

    reRollFromMessage is wrapped first, where we take a look at the old roll's message. If its id matches the data
        stored in a results message from this module, we save a copy the results message's id and the old roll.

    pf2e.reroll is hooked next. Here, old roll and new roll exist simultaneously. We check the old roll to see if
        it matches our saved one. If it does, we also save a copy of the new roll.

    Roll.toMessage is wrapped last. This method's this is the new roll. We compare that one more time against our
        saved copy of the new roll to verify this is the one we want. If it is, we delete our old results message
        and build a new one. Then we unset our storage vars so we can do it again.

    NOTE: The new roll data featured in pf2e.reroll is not yet tagged as being a reroll/not rerollable. It is so
        tagged in Roll.toMessage. The compareRolls helper method compares equality of two roll objects after
        removing those keys, so the stored copy of oldRoll and the one that appears in Roll.toMessage can be
        correctly identified as the same roll.
    
    None of this work is done async, so there shouldn't be any race conditions. - CRA 03 SEP 26
*/

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
                CraftingHandler.createRerollChatMsg(savedResultsMsgId, this);
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
    const modA = JSON.parse(JSON.stringify(rollA));
    delete modA.isReroll;
    delete modA.isRerollable;
    const modB = JSON.parse(JSON.stringify(rollA));
    delete modB.isReroll;
    delete modB.isRerollable;
    const sameWithoutRerolls = JSON.stringify(modA) == JSON.stringify(modB);
    return sameWithoutRerolls;
}