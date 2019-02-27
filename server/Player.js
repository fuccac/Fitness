// @ts-nocheck
/*jshint esversion: 6 */
Calc = require("./calc");
calc = new Calc();

class Player {
    constructor(id) {
        this.id = id;
        this.name = "RandomName" + calc.rand(1, 10000, 0);
        this.active = true;
        this.regDate = new Date();
        this.addedExercises = 0;
        this.deletedExercises = 0;
        this.modifiedExercises = 0;
        this.points = {
            today: 0,
            negative: 0,
            thisMonth: 0,
            diffLastMonth: 0,
            averageThisMonth: 0,
            last5Days: 0,
            total: 0,
        };

        
    }


}

module.exports = Player;