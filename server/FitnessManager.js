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
        this.today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        this.history = {

        };
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
        this.addExercise(new Exercise(exPack.name, exPack.difficulty, exPack.difficulty10, exPack.difficulty100, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit));
    }

    editExercise(id, editor, difficulty, difficulty10, difficulty100, unit, baseWeight, comment) {
        var newVote = {
            difficulty: difficulty,
            difficulty10: difficulty10,
            difficulty100: difficulty100,
            baseWeight: baseWeight,
            comment: comment
        };
        this.exerciseList[id].votes[editor] = newVote;
        this.exerciseList[id].unit = unit;
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

    deleteExercise(id) {
        delete this.exerciseList[id];
    }

    addToHistory(id, playerName, exerciseId, weight, count, date) {
        if(weight === "" || this.exerciseList[exerciseId].usesWeight === false){
            weight = 0;
        }
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count);
        if (this.history[date] != undefined) {
            for (var iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId && this.history[date].weight[iterator] == weight) {
                    this.history[date].count[iterator] += Number(count);
                    this.history[date].points[iterator] += Number(points);
                    return;
                }
            }

            this.history[date].id.push(id);
            this.history[date].date.push(date);
            this.history[date].playerName.push(playerName);
            this.history[date].exName.push(this.exerciseList[exerciseId].name);
            this.history[date].count.push(Number(count));
            this.history[date].points.push(Number(points));
            this.history[date].weight.push(Number(weight));
            this.history[date].exerciseId.push(exerciseId);

        }
        else {
            var newId = [], newDate = [], newPlayerName = [], newExName = [], newCount = [], newPoints = [], newWeight = [], newExerciseId = [];
            newId.push(id);
            newDate.push(date);
            newPlayerName.push(playerName);
            newExName.push(this.exerciseList[exerciseId].name);
            newCount.push(Number(count));
            newPoints.push(Number(points));
            newWeight.push(Number(weight));
            newExerciseId.push(exerciseId);

            var newHistoryEntry = {
                id: newId,
                date: newDate,
                playerName: newPlayerName,
                exName: newExName,
                count: newCount,
                points: newPoints,
                weight: newWeight,
                exerciseId: newExerciseId,
            };
            this.history[date] = newHistoryEntry;
        }



    }

    calculatePointsFromHistory(name) {
        var sumPoints = 0;
        for (var dates in this.history) {
            var historyEntry = this.history[dates];
            for(var iterator in historyEntry.playerName){
                var historyName = historyEntry.playerName[iterator];
                if(historyName ===name){
                    sumPoints += Number(historyEntry.points[iterator]);
                }
            }
        }

        return sumPoints;
    }
}

module.exports = FitnessManager;