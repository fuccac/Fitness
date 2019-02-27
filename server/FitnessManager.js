// @ts-nocheck
/*jshint esversion: 6 */
Exercise = require("./Exercise");
Calc = require("./calc");
calc = new Calc();

class FitnessManager {
    constructor() {
        this.name = "Caf-Fitness-Programm";
        this.exerciseCount = 0;
        this.exerciseList = {};
        var today = new Date();
        this.today = new Date(today.getFullYear(), today.getMonth(),today.getDate());
        this.history = {};
    }

    addExercise(exercise) {
        this.exerciseList[exercise.id] = exercise;
        this.exerciseCount++;
    }

    removeExercise(id) {
        delete this.exerciseList[id];
        this.exerciseCount--;
    }

    createExercise(exPack, usesWeight, creator) {
        this.addExercise(new Exercise(exPack.name, exPack.difficulty,exPack.difficulty10,exPack.difficulty100, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit));
    }

    editExercise(id, editor, difficulty,difficulty10,difficulty100, baseWeight, comment) {
        var newVote = {
            difficulty: difficulty,
            difficulty10: difficulty10,
            difficulty100: difficulty100,
            baseWeight: baseWeight,
            comment: comment
        };
        this.exerciseList[id].votes[editor] = newVote;

        calc.calculateNewFactor(this.exerciseList[id]);
        
    }

    existExercise(name, equipment) {
        for (var i in this.exerciseList) {
            var exercise = this.exerciseList[i];
            if (exercise.name === name && exercise.equipment === equipment) {
                return exercise.id;
            }
        }
        return 0;
    }

    deleteExercise(id){
        delete this.exerciseList[id];
    }

    addToHistory(id,playerName,exerciseId,weight,count,date){
        var points = calc.calculatePoints(this.exerciseList[exerciseId],weight,count);
        var newHistoryEntry = {
            date:date,
            playerName:playerName,
            exName:this.exerciseList[exerciseId].name,
            count:Number(count),
            points:Number(points),
            weight:Number(weight),
            exerciseId:exerciseId,        
        };
        this.history[id] = newHistoryEntry;
        return points;

    }

    calculatePointsFromHistory(name){
        var sumPoints = 0;
        for (var id in this.history){
            var historyEntry = this.history[id];

            if (historyEntry.playerName === name){
                sumPoints += historyEntry.points;
            }

        }

        return sumPoints;
    }
}

module.exports = FitnessManager;