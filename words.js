// ==========================================
//  SCRAMBLOX — WORD DATABASE
// ==========================================
// Add or remove words here to customize the game.
// All words must be UPPERCASE.

var WORDS = {
    easy: [
        'TRAIN', 'PLANT', 'LIGHT', 'STONE', 'DREAM'
    ],
    medium: [
        'APPLE', 'SILVER', 'GARDEN', 'PILLOW', 'FLOWER',
        'BUTTON', 'CIRCLE', 'PLANET', 'FOREST', 'CASTLE',
        'BRIDGE', 'LADDER', 'ROCKET', 'ARTIST', 'ENERGY',
        'TRAVEL', 'SCHOOL', 'MARKET', 'WINDOW', 'PUZZLE'
    ],
    hard: [
        'COMPUTER', 'TRIANGLE', 'ELEPHANT', 'LANGUAGE', 'SCRAMBLE',
        'HOSPITAL', 'FOOTBALL', 'DINOSAUR', 'AIRPLANE', 'MOUNTAIN'
    ]
};

// Timer durations per difficulty (in seconds)
var TIMERS = {
    easy: 30,
    medium: 45,
    hard: 60
};

// Points awarded per correct answer (before bonuses)
var POINTS = {
    easy: 100,
    medium: 150,
    hard: 250
};
