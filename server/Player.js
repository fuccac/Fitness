// @ts-nocheck
/*jshint esversion: 6 */
Calc = require("./calc");
calc = new Calc();

class Player {
    constructor(id) {
        this.name = "RandomName" + calc.rand(1, 10000, 0);
        this.online = false;
        this.active = true;
        this.regDate = new Date();
        this.addedExercises = 0;
        this.deletedExercises = 0;
        this.modifiedExercises = 0;
        this.bestExercises = 0;
        this.id = id;
        this.isAdmin = false;

    }


}

module.exports = Player;