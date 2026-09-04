import { MODULE } from "../pf2e-downtime-scaling.js";
import { LEVEL_BASED_DC, PROFICENCIES, EI_TABLE, DEGREE_NAME, EI_DOS_TEXT } from "../helpers/constants.js";

export class EarnIncomeHandler {
    static defaultEiDialogOptions = {
        actor: null,
        skill: null,
        days: null,
        level: null,
        mult: null,
    };

    static async openEiDialog(options = this.defaultOptions) {
        options = { ...EarnIncomeHandler.defaultEiDialogOptions, ...options };
        const actor = options.actor ? options.actor : (canvas.tokens.controlled[0]?.actor ?? game.user.character);
        if (!actor) {
            ui.notifications.error(`Select at least one token before rolling, or assign a default character.`);
            return;
        }

        const { createSelectInput, createFormGroup, createNumberInput } = foundry.applications.fields;
        const content = document.createElement("div");

        const skillOptions = Object.values(actor.skills).filter((s) => s.proficient).map((s) => ({ value: s.slug, label: s.label }));
        content.append(
            createFormGroup({
            label: "Select Skill",
            input: createSelectInput({
                options: skillOptions,
                name: "skill",
                value: options.skill ?? null,
                sort: true,
            }),
            }),
        );

        content.append(
            createFormGroup({
                label: "Task Level",
                input: foundry.applications.elements.HTMLRangePickerElement.create({
                    min: 0,
                    max: 20,
                    step: 1,
                    value: options.level ?? actor.level,
                    name: "level",
                }),
            }),
        );

        content.append(
            createFormGroup({
                label: "Days",
                input: createNumberInput({
                    integer: true,
                    min: 0,
                    nullable: false,
                    value: options.days ?? 1,
                    name: "days",
                }),
            }),
        );

        const profRank = actor.skills["athletics"].data.rank;
        const profMults = {
            "0": 1,
            "1": game.settings.get(MODULE, "eiMultTrained"),
            "2": game.settings.get(MODULE, "eiMultExpert"),
            "3": game.settings.get(MODULE, "eiMultMaster"),
            "4": game.settings.get(MODULE, "eiMultLegendary")
        };
        const mult = options.mult || profMults[profRank];
        content.append(
            createFormGroup({
                label: "Earnings Multiplier",
                input: createNumberInput({
                    integer: false,
                    min: 0,
                    value: mult,
                    name: "mult",
                }),
            }),
        );

        const title = "Earn Income (PF2e Downtime Enhancements)";
        const result = await foundry.applications.api.Dialog.input({
            window: { title },
            render: (_event, dialog) => {
                const skillInput = dialog.element.querySelector('select[name="skill"]');
                skillInput.addEventListener("change", (e) => {
                    const newSkill = e.currentTarget.value;
                    const newProfRank = actor.skills[newSkill].data.rank;
                    const newMult = profMults[newProfRank];
                    const multInput = dialog.element.querySelector('input[name="mult"');
                    multInput.value = newMult;
                });
            },
            content,
        });

        if (!result) return null;
       
        return {
            skill: result.skill,
            mult: Number(result.mult),
            days: Number(result.days),
            level: Number(result.level),
            actor: actor
        }
    
    } //end of method

    static defaultEiRollOptions = {
        dos: null
    };

    static async rollEi(eiData, options = defaultEiRollOptions){
        options = {...EarnIncomeHandler.defaultEiRollOptions, ...options};
            
        if(!eiData){
            ui.notifications.error("Earn Income failed: input not found.");
            return;
        }

        const skill = eiData.skill;
        const mult = Number(eiData.mult);
        const days = Number(eiData.days);
        const level = Number(eiData.level);
        const actor = eiData.actor;

        if(!(skill && mult && days && level && actor)){
            ui.notifications.error("Earn Income failed: input data malformed.");
            return;
        } 

        // Calculate DC
        const dc = LEVEL_BASED_DC[level];

        // Calculate Degree of Success
        let dos = options.dos ?? null;
        let eiRollMsg;
        if(dos === null){
            // Do the Roll
            const eiRoll = await actor.skills[skill].roll({
                dc: dc,
                traits: ["downtime", "action:earn-income"],
                callback: async (roll, outcome, message, event) => {
                    eiRollMsg = message;
                }
            });

            if(!eiRoll) return;

            // Calculate Degree of Success
            dos = eiRoll.degreeOfSuccess;
        };

        // Calculate Earnings Per Day
        const eiProf = PROFICENCIES[actor.skills[skill].data.rank];
        const eiPerDay = dos === 0 ? {gp: 0} : 
                        dos === 1 ? EI_TABLE[level]["failure"] :
                        dos === 3 ? EI_TABLE[level + 1][eiProf] :
                        EI_TABLE[level][eiProf];
        const coinsEiPerDay = new game.pf2e.Coins(eiPerDay);
        const coinsAdjEiPerDay = coinsEiPerDay.scale(mult);
        const coinsTotal = coinsAdjEiPerDay.scale(days);

        // Create Chat Message
        const chatHtml = await foundry.applications.handlebars.renderTemplate('modules/pf2e-downtime-scaling/templates/ei-card.hbs', {
            dos: DEGREE_NAME[dos],
            dosText: EI_DOS_TEXT[dos],
            earnings: {
                basePerDay: coinsEiPerDay.toString(),
                perDay: coinsAdjEiPerDay.toString(),
                total: coinsTotal.toString()
            },
            days: days,
            mult: mult,
            level: level,
            critFail: dos === 0
        });

        await ChatMessage.create({
            content: chatHtml,
            flavor: `<b>Earn Income Results</b>`,
            speaker: ChatMessage.implementation.getSpeaker({ actor }),
            flags: {
                "pf2e-downtime-scaling": {
                    "type": "earnIncome",
                    "context": { 
                        skill: skill,
                        mult: mult,
                        days: days,
                        actorId: actor.id,
                        level: level,
                        wages: coinsTotal
                    },
                    "rollMsgId": eiRollMsg?.id || null
                }
            }
        });
    };

    static async payWages(actor, coins){
        const oldCurrency = actor.inventory.coins.toString();
        const owed = new game.pf2e.Coins(coins).normalized();
        const payment = await actor.inventory.addCurrency(owed);   
        // Right now addCurrency doesn't return anything
        // Look at this again if the issue is resolved: https://github.com/foundryvtt/pf2e/issues/23141
        // if(!payment){
        //     ui.notifications.error(`Payment Incomplete: Couldn't pay ${actor.name} , something went wrong.`);
        //     return false;
        // } else {
        //     ui.notifications.success(`Payment Complete: ${owed.toString()} given to ${actor.name}.`);
        //     return true;
        // }
        ui.notifications.warn(`Payment: Check ${actor.name}'s inventory to verify funds were added. Used to have ${oldCurrency}.`, {permanent: true});
    }

}

