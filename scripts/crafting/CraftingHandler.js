import { LEVEL_BASED_DC, RARITY_ADJUSTMENT, PROFICENCIES, EI_TABLE, DEGREE_NAME, CRAFTING_DOS_TEXT } from "../helpers/constants.js";
import { MODULE } from "../pf2e-downtime-scaling.js";

export class CraftingHandler {
    
    static async openCraftingDialog(defaults = {uuid: null, qty: 1, actor: null}){
        const actor = defaults.actor ? defaults.actor : (game.user.character ?? canvas.tokens.controlled[0]?.actor);
        if(!actor){
            ui.notifications.error(`Select at least one token before rolling, or assign a default character.`)
            return;
        }

        const {HTMLDocumentTagsElement} = foundry.applications.elements;
        const {createFormGroup, createNumberInput} = foundry.applications.fields;
        const content = document.createElement("div");

        content.append(createFormGroup({
            label: "Item to Craft",
            input: HTMLDocumentTagsElement.create({ type: "Item", single: true,  name: "item", value: defaults.uuid ?? null })
        }));

        content.append(createFormGroup({
            label: "Quantity",  
            input: createNumberInput({ integer: false,  min: 0, value: defaults.qty ?? 1, name: "qty" })
        }));

        //TODO: Handle alternate skills - the system doesn't actually do this, but it'd be nice to do.
        const profRank = actor.skills.crafting.data.rank;
        const profMults = {
            "0": 1,
            "1": game.settings.get(MODULE, "craftingMultTrained"),
            "2": game.settings.get(MODULE, "craftingMultExpert"),
            "3": game.settings.get(MODULE, "craftingMultMaster"),
            "4": game.settings.get(MODULE, "craftingMultLegendary")
        };
        const mult = profMults[profRank];
        content.append(createFormGroup({
            label: "Speed Multiplier", 
            input: createNumberInput({integer: false, min: 0, value: mult, name: "mult" })
        }));

        const title = "Crafting (PF2e Downtime Tracker)";
        const result = await foundry.applications.api.Dialog.input({
            window: { title },
            content
        });

        if (!result) return null;

        return {
            item: await fromUuid(result.item),
            qty: result.qty,
            mult: result.mult,
            actor: actor
        }
    }

    static async craftItem(craftingData){
        if(!craftingData){
            ui.notifications.error("Crafting failed: input not found.");
            return;
        }

        const item = craftingData.item;
        const qty = craftingData.qty;
        const mult = craftingData.mult;
        const actor = craftingData.actor;

        if(!(item && qty && mult && actor)){
            ui.notifications.error("Crafting failed: input data malformed.");
            return;
        } 

        if(!item.isOfType("physical")){
            ui.notifications.error("Crafting failed: item must be a physical item.");
            return;
        }

        //TODO: Handle spell consumables - wands and scrolls

        // Calculate DC
        const itemLevel = item.system.level.value || -1;
        const itemRarity = item.system.traits.rarity || "common";
        const craftingDc = LEVEL_BASED_DC[itemLevel] + RARITY_ADJUSTMENT[itemRarity];

        // Do the Crafting Roll
        const craftingRoll = await actor.skills.crafting.roll({dc: craftingDc});

        if(!craftingRoll) return;

        // Calculate Degree of Success
        const dos = craftingRoll.degreeOfSuccess;

        // Calculate Costs
        const price = game.pf2e.Coins.fromPrice(item.price, qty);
        const materialsCost = price.scale(0.5);

        // Handle Failure
        if(dos < 2){
            // Send Chat Message
            const chatHtml = await foundry.applications.handlebars.renderTemplate('modules/pf2e-downtime-scaling/templates/crafting-card-failure.hbs', {
                dos: DEGREE_NAME[dos],
                dosText: CRAFTING_DOS_TEXT[dos],
                item: item,
                qty: qty,
                cost: { 
                    total: price.toString(),
                    each: item.price.value.toString(),
                    materials: materialsCost.toString()
                },
              critFail: dos === 0
            });

            await ChatMessage.create({
                content: chatHtml,
                flavor: `<b>Crafting Check Results</b>`,
                speaker: ChatMessage.implementation.getSpeaker({ actor })
            });
            return;
        };

        // Calculate Progress Per Day
        const craftingProf = PROFICENCIES[actor.skills.crafting.data.rank];
        const eiPerDay = dos === 3 ? EI_TABLE[actor.level + 1][craftingProf] : EI_TABLE[actor.level][craftingProf];
        const coinsEiPerDay = new game.pf2e.Coins(eiPerDay);
        const progressPerDay = coinsEiPerDay.scale(mult);

        // Calculate Days Til Zero Cost
        const daysToComplete = Math.ceil((price.copperValue - materialsCost.copperValue) / progressPerDay.copperValue);

        // Send Chat Message
        const chatHtml = await foundry.applications.handlebars.renderTemplate('modules/pf2e-downtime-scaling/templates/crafting-card-success.hbs', {
            dos: DEGREE_NAME[dos],
            dosText: CRAFTING_DOS_TEXT[dos],
            item: item,
            qty: qty,
            cost: {
                total: price.toString(),
                each: item.price.value.toString(),
                materials: materialsCost.toString()
            },
            mult: mult,
            progressPerDay: progressPerDay.toString(),
            eiPerDay: coinsEiPerDay.toString(),
            days: daysToComplete
        });

        await ChatMessage.create({
            content: chatHtml,
            flavor: `<b>Crafting Check Results</b>`,
            speaker: ChatMessage.implementation.getSpeaker({ actor })
        });
    }
}