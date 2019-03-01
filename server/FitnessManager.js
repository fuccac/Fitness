// @ts-nocheck
/*jshint esversion: 6 */
Exercise = require("./Exercise");
Calc = require("./calc");
googleSheetList = require("../saves/googleJSON/exercisesGoogle.json");
googleSheetHistoryCaf = require("../saves/googleJSON/cafGoogle.json");
googleSheetHistoryGjf = require("../saves/googleJSON/gjfGoogle.json");
googleSheetHistoryJonny = require("../saves/googleJSON/jonnyGoogle.json");
googleSheetHistoryMuch = require("../saves/googleJSON/muchGoogle.json");
googleSheetHistoryPhilipp = require("../saves/googleJSON/philippGoogle.json");

calc = new Calc();

class FitnessManager {
    constructor() {
        this.name = "Caf-Fitness-Programm";
        this.exerciseCount = 0;
        this.exerciseList = {};
        var today = new Date();
        this.today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        this.history = { };
        this.registeredPlayers = {};

        this.importExercisesFromGoogle();



    }

    importExercisesFromGoogle() {
        var usesWeight = false;
        for (var entryNo in googleSheetList.JSONExport) {
            var entry = googleSheetList.JSONExport[entryNo];
            if (entry.exname == undefined || entry.diff == undefined) {
                continue;
            }
            if (entry.baseWeight > 0) {
                usesWeight = true;
            }
            else {
                usesWeight = false;
            }
            var exercise = new Exercise(entry.exname, entry.diff, entry.diff, entry.diff, entry.equip, usesWeight, entry.baseWeight, entry.exname + " Import from GS", "JsonImporter", entry.type, entry.unit);
            this.addExercise(exercise);
        }
        console.log("Exercises from JSON imported.");
        this.importHistoryFromGoogle();

    }

    importHistoryFromGoogle() {
        var historyData = [googleSheetHistoryCaf, googleSheetHistoryGjf, googleSheetHistoryJonny, googleSheetHistoryMuch, googleSheetHistoryPhilipp];
        var nameData = ["caf","gjf","jonny","much","philipp"];
        var date;
        var id;
        for (var i = 0; i < historyData.length; i++) {
            for (var dayEntryNo in historyData[i].JSONExportHistory) {
                var dayEntry = historyData[i].JSONExportHistory[dayEntryNo];
                date = new Date(dayEntry.Datum);
                for (var dayEntryKeyName in dayEntry) {
                    var dayEntryKeyValue = dayEntry[dayEntryKeyName];
                    var exerciseId = this.existExerciseName(dayEntryKeyName);
                    if (exerciseId > 0) {
                        id = Math.random().toFixed(16).slice(2);
                        var weight = this.exerciseList[exerciseId].baseWeight;
                        this.addToHistory(id, nameData[i], exerciseId, weight, dayEntryKeyValue, date);
                    }


                }
            }
        }
        console.log("Histories from JSON imported.");

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

    existExerciseName(name) {
        for (var i in this.exerciseList) {
            var exercise = this.exerciseList[i];
            if (exercise.name === name) {
                return exercise.id;
            }
        }
        return 0;
    }

    deleteExercise(id) {
        delete this.exerciseList[id];
    }

    deleteHistory(id){


    }

    addToHistory(id, playerName, exerciseId, weight, count, date) {
        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
            weight = 0;
        }
        this.setTime(date,0,0,0);
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count);
        if (this.history[date] != undefined) {
            for (var iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId && this.history[date].weight[iterator] == weight && this.history[date].playerName[iterator] == playerName) {
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


        var sortable = [];
        for (var historyEntry in this.history) {
            sortable.push([historyEntry, this.history[historyEntry]]);
        }

        sortable.sort(function (a, b) {
            return a[1] - b[1];
        });

        this.history = {};

        for (var entrys in sortable) {
            var entry = sortable[entrys];
            this.history[entry[0]] = entry[1];
        }



    }

    calculatePointsFromHistory(name) {
        var sumPoints5Days = 0;
        var sumPointsToday = 0;
        var sumPointsNegative = 0;
        var sumPointsTotal = 0;
        var sumPointsThisMonth = 0;
        var sumPointsLastMonth = 0;
        var thisMonthEntries = 0;
        var thisYear = new Date().getFullYear();
        var todayDate = new Date();
        todayDate.setMonth(todayDate.getMonth() - 1);
        var lastMonth = todayDate.getMonth();
        var lastMonthYear = todayDate.getFullYear();
        var thisMonth = new Date().getMonth();
        var dateMinus5Days = new Date();
        var dailyMax = 0;
        var resultingMaxPerDay = 0;
        todayDate = new Date();
        this.setTime(todayDate, 0, 0, 0);
        this.setTime(dateMinus5Days, 0, 0, 0);
        dateMinus5Days.setDate(dateMinus5Days.getDate() - 5);

        for (var dates in this.history) {
            var currentDate = new Date(dates);
            currentDate.setMonth(currentDate.getMonth() - 1);
            currentDate = new Date(dates);
            this.setTime(currentDate, 0, 0, 0);
            var historyEntry = this.history[dates];
            dailyMax = 0;
            for (var iterator in historyEntry.playerName) {
                var historyName = historyEntry.playerName[iterator];
                if (historyName.toUpperCase() === name.toUpperCase()) {
                    sumPointsTotal += Number(historyEntry.points[iterator]);
                    dailyMax += Number(historyEntry.points[iterator]);
                    if (currentDate > dateMinus5Days) {
                        sumPoints5Days += Number(historyEntry.points[iterator]);
                    }
                    if (currentDate.getDate() == todayDate.getDate() && currentDate.getMonth() == todayDate.getMonth() && currentDate.getFullYear() == todayDate.getFullYear()) {
                        sumPointsToday += Number(historyEntry.points[iterator]);
                    }
                    if (Number(historyEntry.points[iterator]) < 0) {
                        sumPointsNegative += Math.abs(Number(historyEntry.points[iterator]));
                    }
                    if (currentDate.getMonth() == thisMonth && currentDate.getFullYear() == thisYear) {
                        sumPointsThisMonth += Number(historyEntry.points[iterator]);
                        thisMonthEntries++;
                    }
                    if (currentDate.getMonth() == lastMonth && currentDate.getFullYear() == lastMonthYear) {
                        sumPointsLastMonth += Number(historyEntry.points[iterator]);
                    }
                }
            }
            if(dailyMax > resultingMaxPerDay){
                resultingMaxPerDay = dailyMax;
            }
        }
        var averageThisMonth = 0;
        if (thisMonthEntries > 0) {
            averageThisMonth = sumPointsThisMonth / thisMonthEntries;
        }
        var points = {
            total: sumPointsTotal,
            negative: sumPointsNegative,
            today: sumPointsToday,
            diffLastMonth: sumPointsLastMonth - sumPointsThisMonth,
            last5Days: sumPoints5Days,
            thisMonth: sumPointsThisMonth,
            dailyMax:resultingMaxPerDay,
            averageThisMonth: averageThisMonth,
        };

        this.registeredPlayers[name] = sumPointsTotal;
        return points;

    }

    setTime(d, h, m, s) {
        d.setHours(h);
        d.setMinutes(m);
        d.setSeconds(s);
    }
}

module.exports = FitnessManager;