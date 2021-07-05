// @ts-check
/*jshint esversion: 6 */
var Calc = require("./calc");
var calc = new Calc();
var Config = require("./Config");
var config = new Config();

class Exercise {
    constructor(name, difficulty, difficulty10, difficulty100,paceConstant,isPaceExercise, equipment, usesWeight, baseWeight, comment, creator, type, unit, bothSides,calcMethod) {
        this.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
        this.name = name;
        this.factor = (Number(difficulty) + Number(difficulty10) + Number(difficulty100)) / 3;
        this.points = 0;
        this.difficulty = Number(difficulty);
        this.difficulty10 = Number(difficulty10);
        this.difficulty100 = Number(difficulty100);
        this.type = type;
        this.bothSides = (bothSides.toString().toUpperCase() === 'TRUE');
        this.unit = unit;
        this.equipment = equipment;
        this.usesWeight = usesWeight;
        this.baseWeight = Number(baseWeight);
        this.comment = comment;
        this.creator = creator;
        this.pointsPerPlayer = {};
        this.repsPerPlayer = {};
        this.votes = {};
        this.achievementInfo = {
            achievementActive: false,
            repsToGetOverall: [0],
            repsToGetDaily: [0],
            repsToGetMonthly: [0],
            textOverall: "",
            textDaily: "",
            textMonthly: "",
            achievementCategory: "none",
        };

        var newVote = {
            difficulty: Number(difficulty),
            difficulty10: Number(difficulty10),
            difficulty100: Number(difficulty100),
            baseWeight: Number(baseWeight),
            comment: comment,
            paceConstant:Number(paceConstant),
        };
        this.votes[creator] = newVote;
        this.paceConstant = Number(paceConstant);
        this.isPaceExercise = isPaceExercise;
        this.deleted = false;
        this.isHidden = {};
        this.calcMethod = calcMethod;
    }
}

module.exports = Exercise;