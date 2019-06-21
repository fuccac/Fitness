// @ts-nocheck
/*jshint esversion: 6 */
Exercise = require("./Exercise");
Calc = require("./calc");
Log = require("./Log");
Config = require("./Config");
var config = new Config();

googleSheetList = require("../saves/googleJSON/exercisesGoogle.json");
googleSheetHistoryCaf = require("../saves/googleJSON/cafGoogle.json");
googleSheetHistoryGjf = require("../saves/googleJSON/gjfGoogle.json");
googleSheetHistoryJonny = require("../saves/googleJSON/jonnyGoogle.json");
googleSheetHistoryMuch = require("../saves/googleJSON/muchGoogle.json");
googleSheetHistoryPhilipp = require("../saves/googleJSON/philippGoogle.json");
googleSheetHistoryLisi = require("../saves/googleJSON/lisiGoogle.json");

achievementList = require("../saves/config/achievementList");

var logFile = new Log();
calc = new Calc();

class FitnessManager {
    constructor() {
        this.name = "Caf-Fitness-Programm";
        this.exerciseCount = 0;
        this.exerciseList = {};
        this.today = calc.createZeroDate();
        this.history = {};
        this.registeredPlayers = {};
        this.uploadTimer = 0;
        this.needsUpload = {
            history: false,
            registeredPlayers: false,
            exerciseList: false,
            eventLog: false
        };
        this.dailyWins = {};
        this.eventLog = {
            time:[],
            msg:[]
        };

        //this.importGoogleSheetStuff(function (result) {
        //    logFile.log(result,false,0);
        //}.bind(this));

    }

    importGoogleSheetStuff(result) {
        this.importExercisesFromGoogle(function (resultEx) {
            logFile.log(resultEx, false, 0);
            this.importHistoryFromGoogle(function (resultHistory) {
                logFile.log(resultHistory, false, 0);
                result("GoogleSheet Stuff loaded");
            }.bind(this));

        }.bind(this));
    }

    recalculateAllExercisesWithHistory(result) {
        for (var id in this.exerciseList) {
            this.recalculateExercise(id, this.exerciseList[id].name, function (result) {

            });

        }
        this.calculateHistoryDailyMax();
        result("recalculated all exercises with history + dailyMax");

        setTimeout(function () {
            this.needsUpload.history = true;
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    addExerciseAchievement(exId, repsToGetOverall, repsToGetDaily, repsToGetMonthly, achievementCategory) {
        repsToGetOverall = repsToGetOverall.map(Number);
        repsToGetDaily = repsToGetDaily.map(Number);
        repsToGetMonthly = repsToGetMonthly.map(Number);

        var textOverall = "";
        var textDaily = "";
        var textMonthly = "";
        var achievementActive = false;
        if (calc.getNonZeroValuesOfArray(repsToGetOverall) > 0) {
            textOverall = achievementCategory + " Achievement (Gesamt)";
            achievementActive = true;
        }
        if (calc.getNonZeroValuesOfArray(repsToGetDaily) > 0) {
            textDaily = achievementCategory + " Achievement (Täglich)";
            achievementActive = true;
        }
        if (calc.getNonZeroValuesOfArray(repsToGetMonthly) > 0) {
            textMonthly = achievementCategory + " Achievement (Monatlich)";
            achievementActive = true;
        }

        this.achievementInfo = {
            achievementActive: achievementActive,
            repsToGetOverall: repsToGetOverall,
            repsToGetDaily: repsToGetDaily,
            repsToGetMonthly: repsToGetMonthly,
            textOverall: textOverall,
            textDaily: textDaily,
            textMonthly: textMonthly,
            achievementCategory: achievementCategory,
        };


        this.exerciseList[exId].achievementInfo = achievementInfo;

        setTimeout(function () {
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    createGraph(fromDate, toDate) {
        var chunk = this.getDefinedHistory(fromDate, toDate);
        var graph = {};
        for (var playerName in this.registeredPlayers) {
            var entryFound = false;
            var xAxis = [];
            var yAxis = [];
            var date;
            fromDate = calc.createZeroDate(fromDate);
            var sumPoints = this.calculatePointsFromHistory(playerName, fromDate).total;
            for (var historyIterator = 0; historyIterator < chunk.length; historyIterator++) {
                entryFound = false;
                for (var historyEntryIterator = 0; historyEntryIterator < chunk[historyIterator].points.length; historyEntryIterator++) {
                    if (chunk[historyIterator].playerName[historyEntryIterator].toUpperCase() != playerName.toUpperCase()) {
                        continue;
                    }

                    sumPoints += chunk[historyIterator].points[historyEntryIterator];
                    entryFound = true;
                    date = chunk[historyIterator].date[historyEntryIterator];

                }
                if (entryFound) {
                    xAxis[historyIterator] = sumPoints;
                    yAxis[historyIterator] = date;
                }
                else {
                    xAxis[historyIterator] = sumPoints;
                    var newDate = calc.createZeroDate(yAxis[historyIterator]);
                    newDate.setDate(newDate.getDate() + 1);
                    yAxis[historyIterator] = calc.getDateFormat(newDate, "DD.MM.YYYY");
                }

            }

            graph[playerName] = {
                xAxis: xAxis,
                yAxis: yAxis,
            };
        }
        //calc.getDateFormat(date,"DD.MM.YYYY");
        return graph;
    }

    createMonthChartData() {

        var data = {};

        var chunk = this.getDefinedHistory("1970-01-01", "9999-01-01");
        var MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

        for (var historyIterator = 0; historyIterator < chunk.length; historyIterator++) {
            for (var historyEntryIterator = 0; historyEntryIterator < chunk[historyIterator].points.length; historyEntryIterator++) {
                var currentDate = chunk[historyIterator].date[historyEntryIterator];
                var currentMonth = MONTHS[Number(currentDate.substring(5, 5 + 2)) - 1] + " " + currentDate.substring(0, 0 + 4);
                var currentName = chunk[historyIterator].playerName[historyEntryIterator];


                if (data[currentMonth] == undefined) {
                    var player = {};
                    player[currentName] = Number(chunk[historyIterator].points[historyEntryIterator]);
                    data[currentMonth] = player;

                }
                else {
                    if (data[currentMonth][currentName] == undefined) {
                        data[currentMonth][currentName] = Number(chunk[historyIterator].points[historyEntryIterator]);
                    }
                    else {
                        data[currentMonth][currentName] += Number(chunk[historyIterator].points[historyEntryIterator]);
                    }

                }

            }
        }
        return data;
    }

    importExercisesFromGoogle(result) {
        var usesWeight = false;
        for (var entryNo in googleSheetList.JSONExportÜbungen) {
            var entry = googleSheetList.JSONExportÜbungen[entryNo];
            if (entry.exname == undefined || entry.diff == undefined) {
                continue;
            }
            if (entry.baseWeight > 0) {
                usesWeight = true;
            }
            else {
                usesWeight = false;
            }
            var exercise = new Exercise(
                entry.exname,
                entry.diff,
                entry.diff,
                entry.diff,
                entry.equip,
                usesWeight,
                entry.baseWeight,
                entry.exname + " Import from GS",
                "caf",
                entry.type,
                entry.unit,
                entry.bothSides
            );

            var achievementActive = false;
            var repsToGetOverall;
            var repsToGetDaily;
            var repsToGetMonthly;
            var achievementCategory;
            var achievementText;
            try {
                repsToGetOverall = entry.repsToGetOverall.split(";").map(Number);
                achievementActive = true;
            }
            catch (err) {
                repsToGetOverall = [0];
            }
            try {
                repsToGetDaily = entry.repsToGetDaily.split(";").map(Number);
                achievementActive = true;
            }
            catch (err) {
                repsToGetDaily = [0];
            }
            try {
                repsToGetMonthly = entry.repsToGetMonthly.split(";").map(Number);
                achievementActive = true;
            }
            catch (err) {
                repsToGetMonthly = [0];
            }
            try {
                achievementCategory = entry.achievementCategory;
                if (achievementCategory == undefined) {
                    achievementCategory = entry.exname;
                }
            }
            catch (err) {
                achievementCategory = entry.exname;
            }
            try {
                achievementText = entry.achievementText;
                if (achievementText == undefined) {
                    achievementText = "";
                }
            }
            catch (err) {
                achievementText = "";
            }
            exercise.achievementInfo.achievementActive = achievementActive;
            exercise.achievementInfo.repsToGetOverall = repsToGetOverall;
            exercise.achievementInfo.repsToGetDaily = repsToGetDaily;
            exercise.achievementInfo.repsToGetMonthly = repsToGetMonthly;
            exercise.achievementInfo.achievementCategory = achievementCategory;
            exercise.achievementInfo.textDaily = achievementText;
            exercise.achievementInfo.textMonthly = achievementText;
            exercise.achievementInfo.textOverall = achievementText;

            this.addExercise(exercise);
        }
        result("Exercises from JSON imported.");

    }

    importHistoryFromGoogle(result) {
        var historyData = [googleSheetHistoryCaf, googleSheetHistoryGjf, googleSheetHistoryJonny, googleSheetHistoryMuch, googleSheetHistoryPhilipp, googleSheetHistoryLisi];
        var nameData = ["caf", "gjf", "jonny", "much", "philipp", "lisi"];
        var date;
        var id;
        for (var i = 0; i < historyData.length; i++) {
            for (var dayEntryNo in historyData[i].JSONExportHistory) {
                var dayEntry = historyData[i].JSONExportHistory[dayEntryNo];
                date = calc.createZeroDate(dayEntry.Datum);
                for (var dayEntryKeyName in dayEntry) {
                    var dayEntryKeyValue = dayEntry[dayEntryKeyName];
                    var exerciseId = this.existExerciseName(dayEntryKeyName);
                    if (exerciseId > 0) {
                        id = Math.random().toFixed(16).slice(2);
                        var weight = this.exerciseList[exerciseId].baseWeight;
                        this.addToHistory(id, nameData[i], exerciseId, weight, dayEntryKeyValue, date);
                    }
                    else {
                        if (dayEntryKeyName != "Datum") {
                            logFile.log(dayEntry, false, 0);
                            logFile.log(dayEntryKeyValue, false, 0);
                            logFile.log(dayEntryKeyName, false, 0);
                        }
                    }
                }
            }
        }
        for (var nameIterator = 0; nameIterator < nameData.length; nameIterator++) {
            this.calculatePointsFromHistory(nameData[nameIterator]);
        }

        result("Histories from JSON imported.");
    }

    addExercise(exercise) {
        this.exerciseList[exercise.id] = exercise;
        this.exerciseCount++;

        setTimeout(function () {
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
        return "add Exercise finished";
    }

    removeExercise(id) {
        delete this.exerciseList[id];
        this.exerciseCount--;
        setTimeout(function () {
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    createExercise(exPack, usesWeight, creator, result) {
        this.addToEventLog(creator + " erstellt eine neue Übung: " + exPack.name);
        result(this.addExercise(new Exercise(exPack.name, exPack.difficulty, exPack.difficulty10, exPack.difficulty100, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit, exPack.bothSides)));
    }


    getAchievementList(player, result) {
        var achievementList = {};
        var notEarnedAchievements = [];
        var achievementIterator = 0;
        var achievementCategory;
        var currentLevel = 0;

        var earned = player.earnedAchievements;
        var notEarned = player.notEarnedAchievements;

        achievementIterator = 0;
        for (achievementCategory in notEarned) {
            currentLevel = 0;
            if (notEarned[achievementCategory].level.split("/").map(Number)[0] > 1) {
                currentLevel = earned[achievementCategory].level;
            }

            notEarnedAchievements[achievementIterator] = {
                achievementCategory: achievementCategory,
                achievementProgress: notEarned[achievementCategory].progress,
                achievementText: notEarned[achievementCategory].text,
                achievementPercent: notEarned[achievementCategory].percent,
                achievementLevel: currentLevel,
                achievementNextLevel: notEarned[achievementCategory].level,

            };
            achievementIterator++;
        }

        for (achievementCategory in earned) {
            currentLevel = 0;
            if (earned[achievementCategory].level.split("/").map(Number)[0] == earned[achievementCategory].level.split("/").map(Number)[1]) {
                currentLevel = earned[achievementCategory].level;
            }
            else {
                continue;
            }

            notEarnedAchievements[achievementIterator] = {
                achievementCategory: achievementCategory,
                achievementProgress: earned[achievementCategory].progress,
                achievementText: earned[achievementCategory].text,
                achievementPercent: earned[achievementCategory].percent,
                achievementLevel: currentLevel,
                achievementNextLevel: "-"

            };
            achievementIterator++;
        }


        var entry = {
            notEarnedAchievements: notEarnedAchievements
        };

        achievementList[player.name] = entry;
        result(achievementList);
    }

    editExercise(data, editor, result) {
        var newVote = {
            difficulty: data.difficulty,
            difficulty10: data.difficulty10,
            difficulty100: data.difficulty100,
            baseWeight: data.baseWeight,
            comment: data.comment
        };
        this.exerciseList[data.id].bothSides = (data.bothSides.toUpperCase() === 'TRUE');
        this.exerciseList[data.id].votes[editor] = newVote;
        this.exerciseList[data.id].unit = data.unit;
        this.exerciseList[data.id].name = data.name;
        this.exerciseList[data.id].type = data.type;
        this.exerciseList[data.id].equipment = data.equipment;

        calc.calculateNewFactor(this.exerciseList[data.id]);
        this.recalculateExercise(data.id, data.name, function (result) {
            logFile.log(result, false, 0);
            this.needsUpload.exerciseList = true;
        }.bind(this));
        this.addToEventLog(editor + " bearbeitet eine Übung: " + data.name);
        result("editExercise done");
    }

    recalculateExercise(id, exName, result) {
        var sumPoints = 0;
        var currentCount = 0;
        var currentWeight = 0;
        var currentName;
        var points;
        var pointsPerPlayer = {};
        var repsPerPlayer = {};

        for (var historyDate in this.history) {
            var historyEntry = this.history[historyDate];
            for (var historyIterator = 0; historyIterator < historyEntry.exerciseId.length; historyIterator++) {
                if (historyEntry.exerciseId[historyIterator] != id) {
                    continue;
                }
                currentWeight = historyEntry.weight[historyIterator];
                currentCount = historyEntry.count[historyIterator];
                currentName = historyEntry.playerName[historyIterator];
                if (config.RECALCULATE_HISTORY_ON_CHANGES) {
                    points = calc.calculatePoints(this.exerciseList[historyEntry.exerciseId[historyIterator]], currentWeight, currentCount);
                    historyEntry.points[historyIterator] = points;
                }
                else {
                    points = historyEntry.points[historyIterator];
                }

                historyEntry.exName[historyIterator] = exName;
                sumPoints += Number(points);


                if (repsPerPlayer[currentName] == undefined) {
                    repsPerPlayer[currentName] = currentCount;
                }
                else {
                    repsPerPlayer[currentName] += currentCount;
                }

                if (pointsPerPlayer[currentName] == undefined) {
                    pointsPerPlayer[currentName] = points;
                }
                else {
                    pointsPerPlayer[currentName] += points;
                }

                continue;
            }

        }
        this.exerciseList[id].points = sumPoints;
        this.exerciseList[id].repsPerPlayer = repsPerPlayer;
        this.exerciseList[id].pointsPerPlayer = pointsPerPlayer;
        return result("recalculate all Exercises " + exName + " done");


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

    deleteExercise(id, result) {
        delete this.exerciseList[id];
        result("deleted Exercise");
        setTimeout(function () {
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    deleteHistory(id, date, result) {
        var deleter = "";
        var exercise = "";
        var exerciseIdToRecalculate;
        for (var historyEntryIterator in this.history[date].id) {
            if (this.history[date].id[historyEntryIterator] == id) {
                deleter = this.history[date].playerName[historyEntryIterator];
                exercise = this.history[date].exName[historyEntryIterator];
                exerciseIdToRecalculate = this.history[date].exerciseId[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].repsPerPlayer[this.history[date].playerName[historyEntryIterator]] -= this.history[date].count[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].pointsPerPlayer[this.history[date].playerName[historyEntryIterator]] -= this.history[date].points[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].points -= this.history[date].points[historyEntryIterator];
                this.history[date].dailySum[this.history[date].playerName[historyEntryIterator]] -= this.history[date].points[historyEntryIterator];
                for (var historyEntry in this.history[date]) {
                    if (historyEntry != "dailySum" && historyEntry != "dailyWinner") {
                        this.history[date][historyEntry].splice(historyEntryIterator, 1);
                    }
                }
            }
        }

        this.addToEventLog(deleter + " entfernt einen Eintrag aus seiner History: " + exercise + " am " + date);

        result("deleted History Entry: " + exerciseIdToRecalculate + " | " + this.checkDailyWinner(date));
        setTimeout(function () {
            this.needsUpload.history = true;
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);

    }

    checkDailyWinner(date) {
        var max = 100;
        var dailyWinner = "Keiner";

        if (this.history[date].dailyWinner == undefined) {
            this.history[date].dailyWinner = dailyWinner;
        }
        for (var playerName in this.history[date].dailySum) {
            if (this.history[date].dailySum[playerName] > max) {
                max = this.history[date].dailySum[playerName];
                dailyWinner = playerName;
            }
        }

        if (this.history[date].dailyWinner != dailyWinner) {
            var lastWinner = this.history[date].dailyWinner;

            this.history[date].dailyWinner = dailyWinner;
            if (this.dailyWins[dailyWinner] != undefined) {
                this.dailyWins[dailyWinner]++;
                this.dailyWins[lastWinner]--;
                if (dailyWinner != "Keiner"){
                    this.addToEventLog(dailyWinner + " hat mit " + max + " Punkten den Tagessieg, bis jetzt!");
                }
                
            }
            else {
                this.dailyWins[dailyWinner] = 1;
                this.dailyWins[lastWinner]--;
                if (dailyWinner != "Keiner"){
                    this.addToEventLog(dailyWinner + " hat mit " + max + " Punkten den Tagessieg, bis jetzt!");
                }
            }
        }




        return "daily Winner of date " + date + " calculated";

    }


    getDefinedHistory(fromDate, toDate) {
        fromDate = calc.createZeroDate(fromDate);
        toDate = calc.createZeroDate(toDate);
        var sortable = [];
        var historyChunk = [];
        for (var historyEntry in this.history) {
            var currentDate = calc.createZeroDate(historyEntry);
            if (currentDate >= fromDate && currentDate <= toDate) {
                sortable.push([historyEntry, this.history[historyEntry]]);
            }
        }
        sortable.sort(function (a, b) {
            return calc.createZeroDate(a[0]) - calc.createZeroDate(b[0]);
        });
        for (var iterator = 0; iterator < sortable.length; iterator++) {
            historyChunk[iterator] = sortable[iterator][1];
        }
        return historyChunk;
    }

    addToHistory(id, playerName, exerciseId, weight, count, date, result) {
        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
            weight = 0;
        }
        date = calc.createZeroDate(date);
        date = calc.getDateFormat(date, "YYYY-MM-DD");
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count);
        if (this.history[date] != undefined) {
            for (var iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId && this.history[date].weight[iterator] == weight && this.history[date].playerName[iterator].toUpperCase() == playerName.toUpperCase()) {
                    this.history[date].count[iterator] += Number(count);
                    this.history[date].points[iterator] += Number(points);
                    this.history[date].dailySum[playerName] += Number(points);

                    if (this.exerciseList[exerciseId].pointsPerPlayer[playerName] == undefined) {
                        this.exerciseList[exerciseId].pointsPerPlayer[playerName] = Number(points);
                    }
                    else {
                        this.exerciseList[exerciseId].pointsPerPlayer[playerName] += Number(points);
                    }

                    if (this.exerciseList[exerciseId].repsPerPlayer[playerName] == undefined) {
                        this.exerciseList[exerciseId].repsPerPlayer[playerName] = Number(count);
                    }
                    else {
                        this.exerciseList[exerciseId].repsPerPlayer[playerName] += Number(count);
                    }
                    this.addToEventLog(playerName + " hat etwas am " + date + " gemacht: " + count + " " + this.exerciseList[exerciseId].name);
                    result("added workout to existing history" + " | " + this.checkDailyWinner(date));

                    setTimeout(function () {
                        this.needsUpload.history = true;
                        this.needsUpload.exerciseList = true;
                    }.bind(this), 10);
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
            if (this.history[date].dailySum[playerName] == undefined) {
                this.history[date].dailySum[playerName] = Number(points);
            }
            else {
                this.history[date].dailySum[playerName] += Number(points);
            }

            setTimeout(function () {
                this.needsUpload.history = true;
                this.needsUpload.exerciseList = true;
            }.bind(this), 10);

        }
        else {
            var newId = [], newDate = [], newPlayerName = [], newExName = [], newCount = [], newPoints = [], newWeight = [], newExerciseId = [], newDailySum = {};
            newId.push(id);
            newDate.push(date);
            newPlayerName.push(playerName);
            newExName.push(this.exerciseList[exerciseId].name);
            newCount.push(Number(count));
            newPoints.push(Number(points));
            newWeight.push(Number(weight));
            newExerciseId.push(exerciseId);
            newDailySum[playerName] = Number(points);

            var newHistoryEntry = {
                id: newId,
                date: newDate,
                playerName: newPlayerName,
                exName: newExName,
                count: newCount,
                points: newPoints,
                weight: newWeight,
                exerciseId: newExerciseId,
                dailySum: newDailySum,
            };
            this.history[date] = newHistoryEntry;
        }

        if (this.exerciseList[exerciseId].pointsPerPlayer[playerName] == undefined) {
            this.exerciseList[exerciseId].pointsPerPlayer[playerName] = Number(points);
        }
        else {
            this.exerciseList[exerciseId].pointsPerPlayer[playerName] += Number(points);
        }

        if (this.exerciseList[exerciseId].repsPerPlayer[playerName] == undefined) {
            this.exerciseList[exerciseId].repsPerPlayer[playerName] = Number(count);
        }
        else {
            this.exerciseList[exerciseId].repsPerPlayer[playerName] += Number(count);
        }

        this.addToEventLog(playerName + " hat etwas am " + date + " gemacht: " + count + " " + this.exerciseList[exerciseId].name);
        result("added workout to history" + " | " + this.checkDailyWinner(date));


        setTimeout(function () {
            this.needsUpload.history = true;
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    checkPlayerStuff(player, result) {
        this.setBestExerciserNumber(player, function (result) {
            logFile.log(result, false, 0);
            this.checkForAchievements(player, function (result) {
                logFile.log(result, false, 0);

            }.bind(this));
        }.bind(this));
        result("checkPlayerStuff done");
    }

    setBestExerciserNumber(player, result) {
        var sum = 0;
        for (var exId in this.exerciseList) {
            var exercise = this.exerciseList[exId];
            var maxReps = 0;
            var bestPlayer = "Keiner";
            for (var playerName in exercise.repsPerPlayer) {
                var reps = exercise.repsPerPlayer[playerName];
                if (reps > maxReps) {
                    maxReps = reps;
                    bestPlayer = playerName;
                }
            }
            if (player.name.toUpperCase() === bestPlayer.toUpperCase()) {
                sum++;
            }
        }

        player.bestExercises = sum;
        result("setBestExerciserNumber done");
    }

    getMaxExerciseCounts(exId, playerName, ignoreCategory) {
        var sumMonthly = 0;
        var sumDaily = 0;
        var sumOverall = 0;
        var exCat;
        if (ignoreCategory) {
            exCat = undefined;
        }
        else {
            exCat = this.exerciseList[exId].achievementInfo.achievementCategory;
        }
        var maxSumMonthly = 0;
        var maxSumDaily = 0;

        var historyChunk = this.getDefinedHistory("1970-01-01", "9999-01-01");
        if (historyChunk.length == 0) {
            return 0;
        }
        var currentDate = calc.createZeroDate(historyChunk[0].date[0]);
        for (var historyIterator = 0; historyIterator < historyChunk.length; historyIterator++) {
            sumDaily = 0;
            var newDate = calc.createZeroDate(historyChunk[historyIterator].date[0]);
            if (currentDate < newDate && ((currentDate.getMonth() < newDate.getMonth()) || (currentDate.getMonth() > newDate.getMonth() && currentDate.getFullYear() < newDate.getFullYear()))) {
                //new Month
                currentDate = calc.createZeroDate(historyChunk[historyIterator].date[0]);
                sumMonthly = 0;
            }
            var historyEntry = historyChunk[historyIterator];
            for (var entryIterator in historyEntry.playerName) {
                var currentCategory = this.exerciseList[historyEntry.exerciseId[entryIterator]].achievementInfo.achievementCategory;
                if ((historyEntry.playerName[entryIterator].toUpperCase() === playerName.toUpperCase() && historyEntry.exerciseId[entryIterator] == exId) ||
                    (historyEntry.playerName[entryIterator].toUpperCase() === playerName.toUpperCase() && currentCategory == exCat)) {
                    sumMonthly += Number(historyEntry.count[entryIterator]);
                    sumDaily += Number(historyEntry.count[entryIterator]);
                    sumOverall += Number(historyEntry.count[entryIterator]);
                }
                else {
                    continue;
                }

            }
            if (sumMonthly > maxSumMonthly) {
                maxSumMonthly = sumMonthly;
            }
            if (sumDaily > maxSumDaily) {
                maxSumDaily = sumDaily;
            }

        }
        var sum = {
            daily: maxSumDaily,
            monthly: maxSumMonthly,
            overall: sumOverall
        };
        return sum;
    }


    checkForAchievements(player, result) {
        //exercise Achievements
        player.earnedAchievements = {};
        player.notEarnedAchievements = {};
        var endLastLevel;
        var endThisLevel;
        var diff;
        var percent;

        for (var exId in this.exerciseList) {
            var exercise = this.exerciseList[exId];
            if (!exercise.achievementInfo.achievementActive) {
                continue;
            }
            var exCat = this.exerciseList[exId].achievementInfo.achievementCategory;
            var sum = this.getMaxExerciseCounts(exId, player.name, false);
            var playerReps = sum.overall;
            var playerRepsMonthly = sum.monthly;
            var repsToGetDaily = sum.daily;
            var repsThisLevel;

            for (var levelOverallIterator = 0; levelOverallIterator < exercise.achievementInfo.repsToGetOverall.length; levelOverallIterator++) {
                if (exercise.achievementInfo.repsToGetOverall[levelOverallIterator] > 0) {
                    if (playerReps >= exercise.achievementInfo.repsToGetOverall[levelOverallIterator]) {
                        player.earnedAchievements["Overall" + exCat] = {
                            level: (levelOverallIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetOverall),
                            text: exercise.achievementInfo.textOverall,
                            progress: playerReps + "/" + exercise.achievementInfo.repsToGetOverall[levelOverallIterator],
                            percent: 100,
                        };
                        if (levelOverallIterator == exercise.achievementInfo.repsToGetOverall.length) {
                            delete player.notEarnedAchievements["Overall" + exCat];
                        }
                    }
                    else {
                        if (levelOverallIterator > 0) {
                            endLastLevel = exercise.achievementInfo.repsToGetOverall[levelOverallIterator - 1];
                            endThisLevel = exercise.achievementInfo.repsToGetOverall[levelOverallIterator];
                            diff = endThisLevel - endLastLevel;
                            repsThisLevel = playerReps - endLastLevel;
                            percent = repsThisLevel / diff * 100;
                        }
                        else {
                            percent = playerReps / exercise.achievementInfo.repsToGetOverall[levelOverallIterator] * 100;
                        }
                        player.notEarnedAchievements["Overall" + exCat] = {
                            level: (levelOverallIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetOverall),
                            text: exercise.achievementInfo.textOverall,
                            progress: playerReps + "/" + exercise.achievementInfo.repsToGetOverall[levelOverallIterator],
                            percent: percent,
                        };
                        break;
                    }
                }
                else {
                    continue;
                }
            }
            for (var levelMonthIterator = 0; levelMonthIterator < exercise.achievementInfo.repsToGetMonthly.length; levelMonthIterator++) {
                if (exercise.achievementInfo.repsToGetMonthly[levelMonthIterator] > 0) {
                    if (playerRepsMonthly >= exercise.achievementInfo.repsToGetMonthly[levelMonthIterator]) {
                        player.earnedAchievements["Month" + exCat] = {
                            level: (levelMonthIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetMonthly),
                            text: exercise.achievementInfo.textMonthly,
                            progress: playerRepsMonthly + "/" + exercise.achievementInfo.repsToGetMonthly[levelMonthIterator],
                            percent: 100,
                        };

                    }
                    else {
                        if (levelMonthIterator > 0) {
                            endLastLevel = exercise.achievementInfo.repsToGetMonthly[levelMonthIterator - 1];
                            endThisLevel = exercise.achievementInfo.repsToGetMonthly[levelMonthIterator];
                            diff = endThisLevel - endLastLevel;
                            repsThisLevel = playerRepsMonthly - endLastLevel;
                            percent = repsThisLevel / diff * 100;
                        }
                        else {
                            percent = playerRepsMonthly / exercise.achievementInfo.repsToGetMonthly[levelMonthIterator] * 100;
                        }
                        player.notEarnedAchievements["Month" + exCat] = {
                            level: (levelMonthIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetMonthly),
                            text: exercise.achievementInfo.textMonthly,
                            progress: playerRepsMonthly + "/" + exercise.achievementInfo.repsToGetMonthly[levelMonthIterator],
                            percent: percent,
                        };
                        break;
                    }
                }
                else {
                    continue;
                }
            }
            for (var levelDayIterator = 0; levelDayIterator < exercise.achievementInfo.repsToGetDaily.length; levelDayIterator++) {
                if (exercise.achievementInfo.repsToGetDaily[levelDayIterator] > 0) {
                    if (repsToGetDaily >= exercise.achievementInfo.repsToGetDaily[levelDayIterator]) {
                        player.earnedAchievements["Day" + exCat] = {
                            level: (levelDayIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetDaily),
                            text: exercise.achievementInfo.textDaily,
                            progress: repsToGetDaily + "/" + exercise.achievementInfo.repsToGetDaily[levelDayIterator],
                            percent: 100,
                        };
                    }
                    else {
                        if (levelDayIterator > 0) {
                            endLastLevel = exercise.achievementInfo.repsToGetDaily[levelDayIterator - 1];
                            endThisLevel = exercise.achievementInfo.repsToGetDaily[levelDayIterator];
                            diff = endThisLevel - endLastLevel;
                            repsThisLevel = repsToGetDaily - endLastLevel;
                            percent = repsThisLevel / diff * 100;
                        }
                        else {
                            percent = repsToGetDaily / exercise.achievementInfo.repsToGetDaily[levelDayIterator] * 100;
                        }
                        player.notEarnedAchievements["Day" + exCat] = {
                            level: (levelDayIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetDaily),
                            text: exercise.achievementInfo.textDaily,
                            progress: repsToGetDaily + "/" + exercise.achievementInfo.repsToGetDaily[levelDayIterator],
                            percent: percent,
                        };
                        break;
                    }
                }
                else {
                    continue;
                }
            }
        }

        //player achievements
        var levelIterator;
        var needArray;
        var achievementName;
        var achievementText;
        var pointsThisLevel;
        for (var achievementCategory in achievementList.content) {
            if (achievementCategory === "pointAchievements") {
                for (var pointAchievementCategory in achievementList.content[achievementCategory]) {
                    if (pointAchievementCategory === "daily") {
                        needArray = achievementList.content[achievementCategory][pointAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][pointAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][pointAchievementCategory].text;

                        for (levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (player.points.dailyMax >= needArray[levelIterator]) {
                                player.earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.dailyMax + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = player.points.dailyMax - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = player.points.dailyMax / needArray[levelIterator] * 100;
                                }
                                player.notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.dailyMax.toFixed(2) + "/" + needArray[levelIterator],
                                    percent: percent,
                                };
                                break;

                            }


                        }

                    }
                    if (pointAchievementCategory === "monthly") {
                        needArray = achievementList.content[achievementCategory][pointAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][pointAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][pointAchievementCategory].text;

                        for (levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (player.points.monthlyMax >= needArray[levelIterator]) {
                                player.earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.monthlyMax + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = player.points.monthlyMax - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = player.points.monthlyMax / needArray[levelIterator] * 100;
                                }
                                player.notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.monthlyMax.toFixed(2) + "/" + needArray[levelIterator],
                                    percent: percent,
                                };
                                break;

                            }


                        }

                    }
                    if (pointAchievementCategory === "overall") {
                        needArray = achievementList.content[achievementCategory][pointAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][pointAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][pointAchievementCategory].text;

                        for (levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (player.points.total >= needArray[levelIterator]) {
                                player.earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.total + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = player.points.total - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = player.points.total / needArray[levelIterator] * 100;
                                }
                                player.notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: player.points.total.toFixed(2) + "/" + needArray[levelIterator],
                                    percent: percent,
                                };
                                break;

                            }


                        }

                    }
                }
            }
            if (achievementCategory === "winAchievements") {
                for (var winAchievementCategory in achievementList.content[achievementCategory]) {
                    if (winAchievementCategory === "daily") {
                        needArray = achievementList.content[achievementCategory][winAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][winAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][winAchievementCategory].text;

                        for (levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (this.dailyWins[player.name] >= needArray[levelIterator]) {
                                player.earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.dailyWins[player.name] + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = this.dailyWins[player.name] - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = this.dailyWins[player.name] / needArray[levelIterator] * 100;
                                }
                                player.notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.dailyWins[player.name] + "/" + needArray[levelIterator],
                                    percent: percent,
                                };

                                break;

                            }


                        }

                    }

                }

            }


        }
        result("checkForAchievements done");

    }

    getPlayerList(playerList, result) {
        var returnList = {};
        for (var idPlayer in playerList) {
            returnList[playerList[idPlayer].name] = playerList[idPlayer].points;
            returnList[playerList[idPlayer].name].online = true;
        }
        for (var name in this.registeredPlayers) {
            if (returnList[name] != undefined) {
                continue;
            }
            else {
                returnList[name] = this.calculatePointsFromHistory(name);
                returnList[name].online = false;
            }
        }
        return result(returnList);
    }

    calculatePointsFromHistory(name, toDateNotIncluding) {
        if (toDateNotIncluding == "") {
            toDateNotIncluding = calc.createZeroDate("9999-01-01");
        }
        else {
            toDateNotIncluding = calc.createZeroDate(toDateNotIncluding);
        }

        var sumPoints5Days = 0;
        var sumPointsToday = 0;
        var sumPointsNegative = 0;
        var sumPointsTotal = 0;
        var sumPointsThisMonth = 0;
        var sumPointsLastMonth = 0;
        var sumPointsCardio = 0;
        var sumPointsStrength = 0;
        var thisMonthEntries = 0;
        var thisYear = calc.createZeroDate().getFullYear();
        var todayDate = calc.createZeroDate();
        todayDate.setMonth(todayDate.getMonth() - 1);
        var lastMonth = todayDate.getMonth();
        var lastMonthYear = todayDate.getFullYear();
        var thisMonth = calc.createZeroDate().getMonth();
        var dateMinus5Days = calc.createZeroDate();
        var dailyMax = 0;
        var monthlyMax = 0;
        var resultingMaxPerDay = 0;
        var resultingMaxPerMonth = 0;
        var currentMonth;
        var currentYear;
        todayDate = calc.createZeroDate();
        dateMinus5Days.setDate(dateMinus5Days.getDate() - 5);
        for (var dates in this.history) {
            var currentDate = calc.createZeroDate(dates);
            currentDate = calc.createZeroDate(dates);

            if (currentDate.getMonth() > currentMonth && currentDate.getFullYear() >= currentYear ||
                currentDate.getMonth() == currentMonth && currentDate.getFullYear() > currentYear ||
                currentDate.getMonth() < currentMonth && currentDate.getFullYear() > currentYear) {
                monthlyMax = 0;
            }

            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();

            if (currentDate >= toDateNotIncluding) {
                continue;
            }
            var historyEntry = this.history[dates];
            dailyMax = 0;
            for (var iterator in historyEntry.playerName) {
                var historyName = historyEntry.playerName[iterator];
                var exerciseId = historyEntry.exerciseId[iterator];
                if (historyName.toUpperCase() === name.toUpperCase()) {
                    if (this.exerciseList[exerciseId].type === "Cardio") {
                        sumPointsCardio += Number(historyEntry.points[iterator]);
                    }
                    else if (this.exerciseList[exerciseId].type === "Kraft") {
                        sumPointsStrength += Number(historyEntry.points[iterator]);
                    }
                    sumPointsTotal += Number(historyEntry.points[iterator]);
                    dailyMax += Number(historyEntry.points[iterator]);
                    monthlyMax += Number(historyEntry.points[iterator]);
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
            if (dailyMax > resultingMaxPerDay) {
                resultingMaxPerDay = dailyMax;
            }
            if (monthlyMax > resultingMaxPerMonth) {
                resultingMaxPerMonth = monthlyMax;
            }
        }
        var averageThisMonth = 0;
        if (thisMonthEntries > 0) {
            averageThisMonth = sumPointsThisMonth / thisMonthEntries;
        }
        var points = {
            total: sumPointsTotal,
            cardio: sumPointsCardio,
            strength: sumPointsStrength,
            negative: sumPointsNegative,
            today: sumPointsToday,
            diffLastMonth: sumPointsLastMonth - sumPointsThisMonth,
            last5Days: sumPoints5Days,
            thisMonth: sumPointsThisMonth,
            dailyMax: resultingMaxPerDay,
            monthlyMax: resultingMaxPerMonth,
            averageThisMonth: averageThisMonth,
        };

        this.registeredPlayers[name] = sumPointsTotal;

        setTimeout(function () {
            this.needsUpload.registeredPlayers = true;
        }.bind(this), 10);

        return points;

    }

    setTime(d, h, m, s) {
        d.setHours(h);
        d.setMinutes(m);
        d.setSeconds(s);
    }


    calculateHistoryDailyMax() {
        var dailySum = {};
        this.dailyWins = {};
        for (var historyDate in this.history) {
            var historyEntry = this.history[historyDate];
            for (var historyIterator = 0; historyIterator < historyEntry.exerciseId.length; historyIterator++) {
                if (dailySum[historyEntry.playerName[historyIterator]] == undefined) {
                    dailySum[historyEntry.playerName[historyIterator]] = historyEntry.points[historyIterator];
                }
                else {
                    dailySum[historyEntry.playerName[historyIterator]] += historyEntry.points[historyIterator];
                }

            }
            this.history[historyDate].dailySum = dailySum;

            var max = 100;
            var dailyWinner = "Keiner";
            for (var playerName in this.history[historyDate].dailySum) {
                if (this.history[historyDate].dailySum[playerName] > max) {
                    max = this.history[historyDate].dailySum[playerName];
                    dailyWinner = playerName;
                }
            }

            this.history[historyDate].dailyWinner = dailyWinner;
            if (this.dailyWins[dailyWinner] != undefined) {
                this.dailyWins[dailyWinner]++;
            }
            else {
                this.dailyWins[dailyWinner] = 1;
            }
            dailySum = {};
        }

    }

    addToEventLog(msg) {
        var date = calc.createViennaDate();
        var seconds = date.getSeconds();
        var minutes = date.getMinutes();
        var hours = date.getHours();

        if (seconds < 10) {
            seconds = "0" + seconds.toString();
        }
        if (minutes < 10) {
            minutes = "0" + minutes.toString();
        }
        if (hours < 10) {
            hours = "0" + hours.toString();
        }

        if (this.eventLog.time.length == 50){
            this.eventLog.time = this.eventLog.time.slice(1);
            this.eventLog.msg = this.eventLog.msg.slice(1);
        }
        this.eventLog.time.push(calc.getDateFormat(date, "DD.MM.YYYY") + " | " + hours + ":" + minutes + ":" + seconds);
        this.eventLog.msg.push(msg);

        
        this.needsUpload.eventLog = true;
    }



}

module.exports = FitnessManager;