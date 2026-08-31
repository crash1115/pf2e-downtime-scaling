export const LEVEL_BASED_DC = {"-1": 13, "0": 14, "1": 15, "2": 16, "3": 18, "4": 19, "5": 20, "6": 22, "7": 23, "8": 24, "9": 26, "10": 27, "11": 28, "12": 30, "13": 31, "14": 32, "15": 34, "16": 35, "17": 36, "18": 38, "19": 39, "20": 40, "21": 42, "22": 44, "23": 46, "24": 48, "25": 50}

export const RARITY_ADJUSTMENT = {"common": 0, "uncommon": 2, "rare": 5, "unique": 10};

export const PROFICENCIES = { 0: "untrained", 1: "trained", 2: "expert", 3: "master", 4: "legendary" };

export const EI_TABLE = {
    0: { failure: { cp: 1 }, trained:{ cp: 5 }, expert:{ cp: 5 }, master:{ cp: 5 }, legendary:{ cp: 5 } },
    1: { failure: { cp: 2 }, trained:{ sp: 2 }, expert:{ sp: 2 }, master:{ sp: 2 }, legendary:{ sp: 2 } },
    2: { failure: { cp: 4 }, trained:{ sp: 3 }, expert:{ sp: 3 }, master:{ sp: 3 }, legendary:{ sp: 3 } },
    3: { failure: { cp: 8 }, trained:{ sp: 5 }, expert:{ sp: 5 }, master:{ sp: 5 }, legendary:{ sp: 5 } },
    4: { failure: { sp: 1 }, trained:{ sp: 7 }, expert:{ sp: 8 }, master:{ sp: 8 }, legendary:{ sp: 8 } },
    5: { failure: { sp: 2 }, trained:{ sp: 9 }, expert:{ gp: 1 }, master:{ gp: 1 }, legendary:{ gp: 1 } },
    6: { failure: { sp: 3 }, trained:{ gp: 1, sp: 5 }, expert:{ gp: 2 }, master:{ gp: 2 }, legendary:{ gp: 2 } },
    7: { failure: { sp: 4 }, trained:{ gp: 2 }, expert:{ gp: 2, sp: 5 }, master:{ gp: 2, sp: 5 }, legendary:{ gp: 2, sp: 5 } },
    8: { failure: { sp: 5 }, trained:{ gp: 2, sp: 5 }, expert:{ gp: 3 }, master:{ gp: 3 }, legendary:{ gp: 3 } },
    9: { failure: { sp: 6 }, trained:{ gp: 3 }, expert:{ gp: 4 }, master:{ gp: 4 }, legendary:{ gp: 4 } },
    10: { failure: { sp: 7 }, trained:{ gp: 4 }, expert:{ gp: 5 }, master:{ gp: 6 }, legendary:{ gp: 6 } },
    11: { failure: { sp: 8 }, trained:{ gp: 5 }, expert:{ gp: 6 }, master:{ gp: 8 }, legendary:{ gp: 8 } },
    12: { failure: { sp: 9 }, trained:{ gp: 6 }, expert:{ gp: 8 }, master:{ gp: 10 }, legendary:{ gp: 10 } },
    13: { failure: { gp: 1 }, trained:{ gp: 7 }, expert:{ gp: 10 }, master:{ gp: 15 }, legendary:{ gp: 15 } },
    14: { failure: { gp: 1, sp: 5 }, trained:{ gp: 8 }, expert:{ gp: 15 }, master:{ gp: 20 }, legendary:{ gp: 20 } },
    15: { failure: { gp: 2 }, trained:{ gp: 10 }, expert:{ gp: 20 }, master:{ gp: 28 }, legendary:{ gp: 28 } },
    16: { failure: { gp: 2, sp: 5 }, trained:{ gp: 13 }, expert:{ gp: 25 }, master:{ gp: 36 }, legendary:{ gp: 40 } },
    17: { failure: { gp: 3 }, trained:{ gp: 15 }, expert:{ gp: 30 }, master:{ gp: 45 }, legendary:{ gp: 55 } },
    18: { failure: { gp: 4 }, trained:{ gp: 20 }, expert:{ gp: 45 }, master:{ gp: 70 }, legendary:{ gp: 90 } },
    19: { failure: { gp: 6 }, trained:{ gp: 30 }, expert:{ gp: 60 }, master:{ gp: 100 }, legendary:{ gp: 130 } },
    20: { failure: { gp: 8 }, trained:{ gp: 40 }, expert:{ gp: 75 }, master:{ gp: 150 }, legendary:{ gp: 200 } },
    21: { failure: { gp: 0 }, trained:{ gp: 50 }, expert:{ gp: 90 }, master:{ gp: 175 }, legendary:{ gp: 300 } },
};

export const DEGREE_NAME = { 
    "0": "Critical Failure", 
    "1": "Failure",
    "2": "Success", 
    "3": "Critical Success"
};

export const CRAFTING_DOS_TEXT = {
    "0":"You fail to complete the item. You ruin 10% of the raw materials you supplied, but you can salvage the rest. If you want to try again, you must start over.", 
    "1":"You fail to complete the item. You can salvage the raw materials you supplied for their full value. If you want to try again, you must start over.",      
    "2":"Your attempt is successful. Each additional day spent Crafting reduces the materials needed to complete the item by an amount based on your level and your proficiency rank.", 
    "3":"Your attempt is successful. Each additional day spent Crafting reduces the materials needed to complete the item by an amount based on your level + 1 and your proficiency rank in Crafting."
}
