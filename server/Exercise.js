// @ts-nocheck
/*jshint esversion: 6 */
Calc = require("./calc");
calc = new Calc();
var Config = require("./Config");
var config = new Config();

class Exercise {
    constructor(name, difficulty,difficulty10,difficulty100,equipment, usesWeight, baseWeight, comment, creator, type, unit) {
        this.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
        this.name = name;
        this.factor = (Number(difficulty)+Number(difficulty10)+Number(difficulty100))/3;
        this.points = 0;
        this.difficulty = difficulty;
        this.difficulty10 = difficulty10;
        this.difficulty100 = difficulty100;
        this.type = type;
        this.unit = unit;
        this.equipment = equipment;
        this.usesWeight = usesWeight;
        this.baseWeight = baseWeight;
        this.comment = comment;
        this.creator = creator;
        this.votes = {};
        
        var newVote = {
            difficulty: difficulty,
            difficulty10: difficulty10,
            difficulty100: difficulty100,
            baseWeight: baseWeight,
            comment: comment
        };
        this.votes[creator] = newVote;
    }


}

module.exports = Exercise;