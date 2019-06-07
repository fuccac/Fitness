// @ts-nocheck
/*jshint esversion: 6 */
Calc = require("./calc");
calc = new Calc();

class Statistic {
    constructor() {
        this.statisticData = {
            exerciseCount: 0,
            earnedPoints:{
                total: 0,
                negative: 0,
                today: 0,
                diffLastMonth: 0,
                last5Days: 0,
                thisMonth: 0,
                dailyMax:0,
                averageThisMonth: 0,
            },
            
        };

    }


}

module.exports = Statistic;