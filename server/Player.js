// @ts-nocheck
/*jshint esversion: 6 */
Calc = require("./calc");
calc = new Calc();

class Player {
    constructor(id) {
        this.name = "RandomName" + calc.rand(1, 10000, 0);
        this.points = {
            total: 0,
            cardio: 0,
            strength: 0,
            negative: 0,
            today: 0,
            diffLastMonth: 0,
            last5Days: 0,
            thisMonth: 0,
            dailyMax: 0,
            monthlyMax: 0,
            averageThisMonth: 0,
        };

        this.active = true;
        this.regDate = new Date();
        this.addedExercises = 0;
        this.deletedExercises = 0;
        this.modifiedExercises = 0;
        this.bestExercises = 0;
        this.id = id;
        this.earnedAchievements = {};
        this.notEarnedAchievements = {};



    }


}

module.exports = Player;