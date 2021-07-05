// @ts-check
/*jshint esversion: 6 */
var Calc = require("./calc");
var calc = new Calc();
var Config = require("./Config");
var config = new Config();

class Challenge {
    constructor(name, exerciseId,startDate, endDate,toDo, creator) {
        this.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
        this.name = name;
        this.exerciseList = [exerciseId];
        this.startDate = startDate;
        this.endDate = endDate;
        this.creator = creator;
        this.participants = [creator];
        this.progress = {};
        this.html = ""
        this.toDo = toDo
        this.finished = false

        var newProgress = {
            percent: 0,
            done: 0,
        }

        this.progress[creator] = newProgress;
    }

    
}

module.exports = Challenge;