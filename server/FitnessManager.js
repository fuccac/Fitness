// @ts-nocheck
/*jshint esversion: 6 */
Exercise = require("./Exercise");
Calc = require("./calc");
googleSheetList = require("../saves/exercisesGoogle.json");
googleSheetHistory = require("../saves/cafGoogle.json");
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
            var exercise = new Exercise(entry.exname, entry.diff, entry.diff, entry.diff, entry.equip, usesWeight, entry.baseWeight, entry.exname + " Import from GS", "caf", entry.type, entry.unit);
            this.addExercise(exercise);
        }

        this.importHistoryFromGoogle();

    }

    importHistoryFromGoogle() {
        var date;
        var id;
        for (var dayEntryNo in googleSheetHistory.JSONExportHistory) {
            var dayEntry = googleSheetHistory.JSONExportHistory[dayEntryNo];
            date = new Date(dayEntry.Datum);
            for (var dayEntryKeyName in dayEntry) {
                var dayEntryKeyValue = dayEntry[dayEntryKeyName];
                var exerciseId = this.existExerciseName(dayEntryKeyName);
                if (exerciseId > 0) {
                    id = Math.random().toFixed(16).slice(2);
                    var weight = this.exerciseList[exerciseId].baseWeight;
                    this.addToHistory(id, "caf", exerciseId, weight, dayEntryKeyValue, date);
                }


            }
        }

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

    addToHistory(id, playerName, exerciseId, weight, count, date) {
        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
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
        var lastYear = new Date().getFullYear() - 1;
        var todayDate = new Date();
        todayDate.setMonth(todayDate.getMonth() - 1);
        var lastMonth = todayDate.getMonth();
        var lastMonthYear = todayDate.getFullYear();
        var thisMonth = new Date().getMonth();
        var dateMinus5Days = new Date();

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
            
            for (var iterator in historyEntry.playerName) {
                var historyName = historyEntry.playerName[iterator];
                if (historyName === name) {
                    sumPointsTotal += Number(historyEntry.points[iterator]);
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
        }
        var averageThisMonth = 0;
        if (thisMonthEntries > 0) {
            averageThisMonth = sumPointsThisMonth / thisMonthEntries;
        }

        var points = {
            today: sumPointsToday,
            negative: sumPointsNegative,
            thisMonth: sumPointsThisMonth,
            diffLastMonth: sumPointsLastMonth - sumPointsThisMonth,
            averageThisMonth: averageThisMonth,
            last5Days: sumPoints5Days,
            total: sumPointsTotal,
        };
        return points;

    }

    setTime(d, h, m, s) {
        d.setHours(h);
        d.setMinutes(m);
        d.setSeconds(s);
    }
}

module.exports = FitnessManager;