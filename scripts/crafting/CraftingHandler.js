import { LEVEL_BASED_DC, RARITY_ADJUSTMENT, PROFICENCIES, EI_TABLE, DEGREE_NAME, CRAFTING_DOS_TEXT, SPELL_CONSUMABLES, TRADITIONS } from "../helpers/constants.js";
import { MODULE } from "../pf2e-downtime-scaling.js";

export class CraftingHandler {
    static defaultCraftingDialogOptions = {
        item: null,
        qty: 1,
        mult: null,
        actor: null
    };

    static async openCraftingDialog(options = this.defaultOptions){
        options = {...CraftingHandler.defaultCraftingDialogOptions, ...options};
        const actor = options.actor ? options.actor : (canvas.tokens.controlled[0]?.actor ?? game.user.character);
        if(!actor){
            ui.notifications.error(`Select at least one token before rolling, or assign a default character.`)
            return;
        }

        const {HTMLDocumentTagsElement} = foundry.applications.elements;
        const {createFormGroup, createNumberInput} = foundry.applications.fields;
        const content = document.createElement("div");

        content.append(createFormGroup({
            label: "Item to Craft",
            input: HTMLDocumentTagsElement.create({ type: "Item", single: true,  name: "item", value: options.item?.uuid ?? null })
        }));

        content.append(createFormGroup({
            label: "Quantity",  
            input: createNumberInput({ integer: false,  min: 0, value: options.qty ?? 1, name: "qty" })
        }));


        const profRank = actor.skills["crafting"].data.rank;
        const profMults = {
            "0": 1,
            "1": game.settings.get(MODULE, "craftingMultTrained"),
            "2": game.settings.get(MODULE, "craftingMultExpert"),
            "3": game.settings.get(MODULE, "craftingMultMaster"),
            "4": game.settings.get(MODULE, "craftingMultLegendary")
        };
        const mult = options.mult || profMults[profRank];
        content.append(createFormGroup({
            label: "Speed Multiplier", 
            input: createNumberInput({integer: false, min: 0, value: mult, name: "mult" })
        }));

        const title = "Crafting (PF2e Downtime Enhancements)";
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

    static defaultCraftItemOptions = {
        free: false,
        dos: null
    }
    
    static async craftItem(craftingData, options = defaultCraftItemOptions){
        options = {...CraftingHandler.defaultCraftItemOptions, ...options};
        
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

        // Handle Free Crafting
        if(options.free){
            // Send Chat Message
            const chatHtml = await foundry.applications.handlebars.renderTemplate('modules/pf2e-downtime-scaling/templates/crafting-card-free.hbs', {
                item: item,
                qty: qty,
                actorName: actor.name
            });

            await ChatMessage.create({
                content: chatHtml,
                flavor: `<b>Crafting Results</b>`,
                speaker: ChatMessage.implementation.getSpeaker({ actor }),
                flags: {
                    "pf2e-downtime-scaling": {
                        "context": { 
                            itemUuid: item.uuid,
                            qty: qty,
                            mult: mult,
                            actorId: actor.id,
                            skill: "crafting",
                            free: options.free,
                            cost: {
                                full: null,
                                half: null,
                                tenth: null
                            },
                            perDay: null
                        },
                        "rollMsgId": null
                    }
                }
            });
            return;
        };

        // Calculate DC
        const itemLevel = item.system.level.value || -1;
        const itemRarity = item.system.traits.rarity || "common";
        const craftingDc = LEVEL_BASED_DC[itemLevel] + RARITY_ADJUSTMENT[itemRarity];

        // Calculate Degree of Success
        let dos = options.dos ?? null;
        let craftingRollMsg;
        if(dos === null){
            // Do the Crafting Roll

            const craftingRoll = actor.skills["crafting"].extend({
                rollOptions: [`action:craft`]
            });
            
            await craftingRoll.roll({
                dc: craftingDc,
                traits: ["downtime", "manipulate"],
                callback: async (roll, outcome, message, event) => {
                    craftingRollMsg = message;
                },
                createMessage: true
            });

            if(!craftingRoll) return;

            // Calculate Degree of Success
            dos = craftingRoll.degreeOfSuccess;
        }

        // Calculate Costs
        const price = game.pf2e.Coins.fromPrice(item.price, qty);
        const materialsCost = price.scale(0.5);
        const critFailCost = materialsCost.scale(0.1);

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
                flavor: `<b>Crafting Results</b>`,
                speaker: ChatMessage.implementation.getSpeaker({ actor }),
                flags: {
                    "pf2e-downtime-scaling": {
                        "context": { 
                            itemUuid: item.uuid,
                            qty: qty,
                            mult: mult,
                            actorId: actor.id,
                            skill: "crafting",
                            free: options.free,
                            cost: {
                                full: price,
                                half: materialsCost,
                                tenth: critFailCost
                            },
                            perDay: null
                        },
                        "rollMsgId": craftingRollMsg?.id || null 
                    }
                }
            });
            return;
        };

        // Calculate Progress Per Day
        const craftingProf = PROFICENCIES[actor.skills["crafting"].data.rank];
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
            days: daysToComplete,
            trackerIntegration: game.settings.get(MODULE, "trackerIntegration") && game.settings.get("pf2e-downtime", "downtimeUnit").toLowerCase() === "day"
        });

        await ChatMessage.create({
            content: chatHtml,
            flavor: `<b>Crafting Results</b>`,
            speaker: ChatMessage.implementation.getSpeaker({ actor }),
            flags: {
                "pf2e-downtime-scaling": {
                    "context": { 
                        itemUuid: item.uuid,
                        qty: qty,
                        mult: mult,
                        actorId: actor.id,
                        skill: "crafting",
                        free: options.free,
                        cost: {
                            full: price,
                            half: materialsCost,
                            tenth: critFailCost
                        },
                        perDay: progressPerDay
                    },
                    "rollMsgId": craftingRollMsg?.id || null
                }
            }
        });
    }

    static async payCost(actor, coins){
        const owed = new game.pf2e.Coins(coins);
        const payment = await actor.inventory.removeCurrency(owed);
        if(!payment){
            ui.notifications.error(`Payment Incomplete: ${actor.name} has insufficient funds, or something went wrong.`);
            return false;
        } else {
            ui.notifications.success(`Payment Complete: ${owed.toString()} removed from ${actor.name}.`);
            return true;
        }
    }

    static async giveItem(actor, item, qty){
        const spellItemIds = Object.keys(SPELL_CONSUMABLES);
        if(spellItemIds.includes(item.sourceId)){
            return await this.giveSpellConsumable(actor, item, qty)
        }

        const itemSrc = { ...item.toObject()};
        itemSrc.system.quantity = qty;
        const given = await actor.addToInventory(itemSrc);

        if(!given){
            ui.notifications.error(`Something went wrong: item not given to ${actor.name}.`);
            return false;
        } else {
            ui.notifications.success(`Success: ${qty}x ${item.name}(s) given to ${actor.name}.`);
            return true;
        }
    }

    static async giveSpellConsumable(actor, item, qty){
        // This code is adapted from the PF2e system
        // https://github.com/foundryvtt/pf2e/blob/v14-dev/src/module/actor/character/crafting/helpers.ts#L110
        const rank = SPELL_CONSUMABLES[item.sourceId].rank;
        const type = SPELL_CONSUMABLES[item.sourceId].type;

        // Get possible spells
        const allSpells = await game.packs.get("pf2e.spells-srd").getDocuments();
        const filtered = allSpells.filter(s => s.system.level.value <= rank  && !s.isCantrip && !s.isRitual && !s.isFocusSpell);
        const spellOptions = filtered.map(t => ({ value: t.uuid, label: t.name })); 

        // Create spell selection dialog
        const { createSelectInput, createFormGroup } = foundry.applications.fields;
        const content = document.createElement("div");
        content.append(createFormGroup({
            label: "Select Spell",
            input: createSelectInput({
                options: spellOptions,
                name: "spell",
                sort: true
            })
        }));

        const dropdown = await foundry.applications.api.DialogV2.input({
            window: { title: "Spell Consumable Spell Selection" },
            content: content.outerHTML,
            ok: { label: "Confirm" }
        });
        if (!dropdown){
            ui.notifications.warn("Item not added to actor: no spell chosen.")
            return false;
        } 
        
        // Configure item data
        const spell = await fromUuid(dropdown.spell);
        const consumable = await fromUuid(item.sourceId);
        if (!consumable?.isOfType("consumable")) {
            ui.notifications.warn("Item not added to actor: failed to retrieve consumable item");
            return false;
        }

        const consumableSource = { ...consumable.toObject(), _id: null };
        
        const traits = consumableSource.system.traits;
        traits.value = traits.value.concat(spell.system.traits.value);
        traits.rarity = spell.rarity;
        if (traits.value.includes("magical") && traits.value.some((t) => TRADITIONS.includes(t))) {
            traits.value.splice(traits.value.indexOf("magical"), 1);
        }
        traits.value.sort();

        const name = `${type} of ${spell.name} (Rank ${rank})`;
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        consumableSource.name = formattedName;
        
        const description = consumableSource.system.description.value;
        consumableSource.system.description.value = (() => {
            const paragraphElement = document.createElement("p");
            paragraphElement.append(spell.sourceId ? `@UUID[${spell.sourceId}]{${spell.name}}` : spell.description);

            const containerElement = document.createElement("div");
            const hrElement = document.createElement("hr");
            containerElement.append(paragraphElement, hrElement);
            hrElement.insertAdjacentHTML("afterend", description);

            return containerElement.innerHTML;
        })();

        consumableSource.system.spell = foundry.utils.mergeObject(
            spell._source,
            { _id: foundry.utils.randomID(), system: { location: { value: null, heightenedLevel: rank } } },
            { inplace: false },
        );
       
        consumableSource.system.quantity = qty;
        
        consumableSource.system.size = actor.size === "tiny" ? "tiny" : "med";

        // Give item to actor
        const itemToGive = new CONFIG.PF2E.Item.documentClasses.consumable(consumableSource);
        const given = await actor.addToInventory(itemToGive);
        if(!given){
            ui.notifications.error(`Something went wrong: item not given to ${actor.name}.`);
            return false;
        } else {
            ui.notifications.success(`Success: ${qty}x ${itemToGive.name} given to ${actor.name}.`);
            return true;
        }
    }

    static async createDowntimeProject(craftingData){
        const actor = await game.actors.get(craftingData.actorId);
        const item = await fromUuid(craftingData.itemUuid)
        const projectName = `Craft ${craftingData.qty}x ${item.name}`;
        const goldMax = new game.pf2e.Coins(craftingData.cost.full).goldValue;
        const goldCurrent = new game.pf2e.Coins(craftingData.cost.half).goldValue;
        const goldPerDay = new game.pf2e.Coins(craftingData.perDay).goldValue;
        
        const project =   {
            id: foundry.utils.randomID(),
            owner: actor.id,
            name: projectName,
            img: "icons/commodities/tech/blueprint.webp",
            category: "Crafting Projects",
            progress: {
                current: goldCurrent,
                max: goldMax,
                label: "gp",
                perDay: goldPerDay
            },
            note: "Project created by the PF2e Downtime Enhancements module.",
            playerCanEdit: true,
            playerCanView: true,
            disableSpend: false
        };

        const api = game.modules.get('pf2e-downtime')?.api;
        const allProjects = api.getAllProjectsForActor(actor.id);
        allProjects.push(project);
        const projectAdded = await actor.setFlag("pf2e-downtime", "projects", allProjects);
        if(!projectAdded){
            ui.notifications.error(`Project Creation Failed: something went wrong.`);
            return false;
        } else {
            ui.notifications.success(`Project Created: New crafting downtime project added to ${actor.name}.`);
            return true;
        }
    }

    static async createRerollChatMsg(oldMsgId, newRoll){
        const oldMsg = game.messages.get(oldMsgId);
        const context = oldMsg.flags[MODULE].context;
        await oldMsg.delete();          

        const options = {
            free: context.free,
            dos: newRoll.degreeOfSuccess
        };

        const craftingData = {
            item:await fromUuid(context.itemUuid),
            qty: context.qty,
            mult: context.mult,
            actor: game.actors.get(context.actorId),
            skill: context.skill
        }

        return await this.craftItem(craftingData, options);
    }
}