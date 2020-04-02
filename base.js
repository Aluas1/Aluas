// ---Misc Variables---
var fs = require('fs'); // enables filesystem module, which allows reading, writing and appending of external files
var inquirer = require('inquirer'); // enables inquirer module, which lets you avoid typing inputs for in-game choices, instead letting you cycle through them with up and down.
var cacheDir = 'cache.txt' // more for ease-of-access, I defined a cache directory for the cache function I use later.
var currentTime = new Date().getTime();

// ---FS Command Abbreviations---
// This is kind of a messy addition, but it shortens code later, read synchronously returns a txt's contents, append adds to it, the others are for caches.

function read(file) {
    var complete = fs.readFileSync(file, 'utf8')
    return complete
}

function append(file, addition) {
    var complete = fs.appendFileSync(file, addition)
    return complete
}

function cacheWipe() {
    var complete = fs.writeFileSync(cacheDir, "Location Cache\n-------------------------------", 'utf8')
    return complete
}

// ---"Dice"---
// This is just a randomiser 0 to X, where X is your input, it returns the picked number, it's used for combat and world generation, so the dice is a joke about DnD.

function diceRoll(sides) {

    return Math.floor(Math.random() * Math.floor(sides))
}

// ---Cache Location---
// Recieves the co-ordinates of the current tile, checks if it's currently cached in the cache.txt, if not it stores it with all relevant data.

function cacheLoc(one, two, three) {

    fs.readFile(cacheDir, function(err, data) {
        if (err) throw err;
        if (data.includes(String([one, two, three]))) {

            console.log(String([one, two, three]), "is already There!")
        } else {

            var newcell = "\n" + "---" + String([one, two, three]) + "---" + "\n"
            append(cacheDir, newcell)
            console.log(read(cacheDir))
        }
    })
}

// ---Sleep Function---
// With this being a menu based adventure, this was necessary.

function sleep(ms) {

   while (currentTime + ms >= new Date().getTime()) {
   }
}

// ---PC / NPC Constructer---
// Creates two classes for possible PCs and NPCs for use in combat.

var PC = class {
    constructor(nm, ty, hp, st, ac, it, sa, po) {

        this.nm = nm;
        this.ty = ty;
        this.hp = hp;
        this.st = st;
        this.ac = ac;
        this.it = it;
        this.sa = sa;
        this.po = po;
    }
};

var NPC = class {
    constructor(nm, ty, hp, st, ac, it, po) {

        this.nm = nm;
        this.ty = ty;
        this.hp = hp;
        this.st = st;
        this.ac = ac;
        this.it = it;
        this.po = po;
    }
};

// ---OG PC / NPC Container---
// While character stats are saved between games, these are the stats that a new character is created from.

var Grog = new PC("Grog", ["Human", "Fighter"], 46, 105, 16, 0, [0, 0], [0, 0, 0]);
var Kairyu = new PC("Kairyu", ["Dragonborn", "Sorcerer"], 30, 75, 15, 0, [0, 0], [0, 0, 0]);
var Aalthar = new PC("Aalthar", ["Halfling", "Barbarian/Warlock"], 46, 75, 15, 0, [0, 0], [0, 0, 0]);

var Frank = new NPC("Frank", ["Halfling", "Barbarian/Warlock"], 46, 75, 15, 0, [0, 0, 0]);

pclist = [Grog, Kairyu, Aalthar];
extra = [Frank];

// ---Coordinate Functions---
// This was a headache, I wanted 6 directions of movement, so it's an invisible hex grid
// These functions each represent an axis of movement, both forward and backwards on that axis (vector)
// after processing a co-ordinate into the now-moved value, the new location is run through the cache function

function leftdiag(start, vector) {

    if (vector == 1) {
        one = start[0] - 1
        two = start[1] + 1
        three = start[2]
    }
    if (vector == 0) {

        one = start[0] + 1
        two = start[1] - 1
        three = start[2]
    };

    cacheLoc(one, two, three)
    return [one, two, three]
}

function rightdiag(start, vector) {

    if (vector == 1) {
        one = start[0]
        two = start[1] + 1
        three = start[2] - 1
    }

    if (vector == 0) {
        one = start[0]
        two = start[1] - 1
        three = start[2] + 1
    };

    cacheLoc(one, two, three)
    return [one, two, three]
};

function horizontal(start, vector) {

    if (vector == 1) {
        one = start[0] - 1
        two = start[1]
        three = start[2] + 1
    }

    if (vector == 0) {
        one = start[0] + 1
        two = start[1]
        three = start[2] - 1
    };

    cacheLoc(one, two, three)
    return [one, two, three]
};

// ---Question Functions---
// These are essentially used for every single encounter, I tried to make them as modular as possible
// only 2 things are needed, a message for before the question and an array to pick from, either integer or string

function qDecide(at, n) { // this decides if the askQuestion choices section is a text array. 

    if (at == "yes") { 

        if (Array.isArray(n)) {

            return n // if n is an array, the items are sent as choices to askQuestion()
        } else {

            return ["Something", "Went", "Wrong"] // this handles errors with n not being an array.
        }
    } if (isNaN(n)) { // if n is Not a Number (NaN) qDecide returns the options ["Something", "Went", "Wrong"]

        return ["Something", "Went", "Wrong"] // this handles errors with n not being an integer.
    } else {

        return Array.from(Array(n + 1).keys()).splice(1)
        // if n is an integer and at is not "yes" an array of numbers 0 to n is made
        // .splice removes the first option and (n + 1) adds another number to the end.
    }
}

function askQuestion(m, at, n) { // This is used to make a menu that can be selected through.

    return new Promise((resolve, reject) => { // This promise forces a wait until the end resolution for async functions.

        inquirer // module callup, I put a line break here for visibility.

            .prompt([{
                type: 'list', // Possible values: input, number, confirm, list, rawlist, expand, checkbox, password, editor
                name: 'input', // used for later in the answer hash.
                message: m, // The question to log in the console (or any message)
                choices: qDecide(at, n) // at = arrayText (n must be an array if "Yes") and n = array range (integer)
            }])

            .then(answer => {

                answer = answer.input

                resolve(answer); // This resolves the promise, allowing a continue on the async function.
            });
    });
}

// ---Game---

var selection = 0
var selected = pclist[selection]


// This is a blueprint for using askQuestion(m,at,n) for a menu, it will first be used to make the start menu.

//async function start() {
//
//    m = "Pick a number between 1 and 7!"
//    at = "yes"
//    n = 7
//    var answer = await askQuestion(m, at, n)
//
//    switch (answer) {
//
//        case 1:
//            selected.po = leftdiag(selected.po, 0)
//            break;
//
//        case 2:
//            selected.po = leftdiag(selected.po, 1)
//            break;
//
//        case 3:
//            selected.po = rightdiag(selected.po, 0)
//            break;
//
//        case 4:
//            selected.po = rightdiag(selected.po, 1)
//            break;
//
//        case 5:
//            selected.po = horizontal(selected.po, 0)
//            break;
//
//        case 6:
//            selected.po = horizontal(selected.po, 1)
//            break;
//
//        case 7:
//            console.log("Leaving")
//            break;
//    }
//}
//start()

async function optionsMenu() {
console.clear()

    m = "Options"
    at = "yes"
    n = ["Clear cache files", "Fire missiles", "back"]
    var answer = await askQuestion(m, at, n)

    switch (answer) {

        case n[0]:
            cacheWipe()
            console.log("Task Complete")
            //sleep(3000)
            optionsMenu()

        case n[1]:
            console.log("You must have Administrator permissions to perform that task")
            sleep(3000)
            optionsMenu()

        case n[2]:
            mainMenu()
    }
}

async function mainMenu() {
console.clear()

    m = "Select"
    at = "yes"
    n = ["Start Adventure", "Options", "Exit Game"]
    var answer = await askQuestion(m, at, n)

    switch (answer) {

        case n[0]:
            console.log("Plug the rest now")

        case n[1]:
            optionsMenu()
            break

        case n[2]:
            console.log("This might work")
    }
}
mainMenu()
//Options -> wipe cache doesn't work
