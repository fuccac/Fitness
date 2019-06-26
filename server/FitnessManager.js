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
            eventLog: false,
            achievements: false,
        };
        this.dailyWins = {};
        this.monthlyWins = {};
        this.monthlyData = {};
        this.fullGraph = {};
        this.eventLog = {
            time: [],
            msg: []
        };
        this.achievements = {};
        this.loadingDone = false;
        this.maxExerciseCounts = {};
        this.maxExerciseCountsCategory = {};

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
        fromDate = calc.createZeroDate(fromDate);
        toDate = calc.createZeroDate(toDate);

        var resultGraph = {};
        var firstIndex = -1;
        var lastIndex = -1;

        for (var playerName in this.fullGraph) {
            var currentGraph = this.fullGraph[playerName];
            for (var graphIterator = 0; graphIterator < currentGraph.yAxis.length; graphIterator++) {
                if (firstIndex == -1 && calc.createZeroDate(currentGraph.yAxis[graphIterator]) >= fromDate) {
                    firstIndex = graphIterator;
                }
                if (lastIndex == -1 && calc.createZeroDate(currentGraph.yAxis[graphIterator]) > toDate) {
                    lastIndex = graphIterator;
                }
                if (firstIndex != -1 && lastIndex != -1) {
                    break;
                }
            }
            if (lastIndex == -1) {
                lastIndex = currentGraph.yAxis.length - 1;
            }
            resultGraph[playerName] = {
                yAxis: currentGraph.yAxis.slice(firstIndex, lastIndex),
                xAxis: currentGraph.xAxis.slice(firstIndex, lastIndex)
            };

        }
        return resultGraph;
    }

    createMonthChartData() {
        return this.monthlyData;
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

        var earned = this.achievements[player.name].earnedAchievements;
        var notEarned = this.achievements[player.name].notEarnedAchievements;

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
        this.addToEventLog(editor + " bearbeitet eine Übung: " + data.name);
        result("editExercise done");
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

        result("deleted History Entry: " + exerciseIdToRecalculate + " | "); //+ this.checkDailyWinner(date)
        setTimeout(function () {
            this.needsUpload.history = true;
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);

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
                    result("added workout to existing history" + " | "); // + this.checkDailyWinner(date)

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
        result("added workout to history" + " | "); //+ this.checkDailyWinner(date)


        setTimeout(function () {
            this.needsUpload.history = true;
            this.needsUpload.exerciseList = true;
        }.bind(this), 10);
    }

    checkPlayerStuff(player, playerStuffResult) {
        this.fullRefresh(function (fullRefreshResult) {
            logFile.log(fullRefreshResult, false, 0);
            this.setBestExerciserNumber(player, function (result) {
                logFile.log(result, false, 0);
                this.checkForAchievements(player, function (result) {
                    logFile.log(result, false, 0);
                    playerStuffResult("checkPlayerStuff done");
                }.bind(this));
            }.bind(this));
        }.bind(this));


    }

    setBestExerciserNumber(player, result) {
        let start = Date.now();
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
        let end = Date.now();
        result(`setBestExerciserNumber done in ${end - start}`);
    }

    checkForAchievements(player, result) {
        let start = Date.now(); // milliseconds count from 1 Jan 1970
        //exercise Achievements
        this.achievements[player.name] = {
            earnedAchievements: {},
            notEarnedAchievements: {}
        };

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

            //this.getMaxExerciseCounts(exId, player.name, false);
            var playerReps = this.maxExerciseCountsCategory[exCat].overall[player.name] == undefined ? 0 : this.maxExerciseCountsCategory[exCat].overall[player.name];
            var playerRepsMonthly = this.maxExerciseCountsCategory[exCat].monthly[player.name] == undefined ? 0 : this.maxExerciseCountsCategory[exCat].monthly[player.name];
            var repsToGetDaily = this.maxExerciseCountsCategory[exCat].daily[player.name] == undefined ? 0 : this.maxExerciseCountsCategory[exCat].daily[player.name];
            var repsThisLevel;

            for (var levelOverallIterator = 0; levelOverallIterator < exercise.achievementInfo.repsToGetOverall.length; levelOverallIterator++) {
                if (exercise.achievementInfo.repsToGetOverall[levelOverallIterator] > 0) {
                    if (playerReps >= exercise.achievementInfo.repsToGetOverall[levelOverallIterator]) {
                        this.achievements[player.name].earnedAchievements["Overall" + exCat] = {
                            level: (levelOverallIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetOverall),
                            text: exercise.achievementInfo.textOverall,
                            progress: playerReps + "/" + exercise.achievementInfo.repsToGetOverall[levelOverallIterator],
                            percent: 100,
                        };
                        if (levelOverallIterator == exercise.achievementInfo.repsToGetOverall.length) {
                            delete this.achievements[player.name].notEarnedAchievements["Overall" + exCat];
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
                        this.achievements[player.name].notEarnedAchievements["Overall" + exCat] = {
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
                        this.achievements[player.name].earnedAchievements["Month" + exCat] = {
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
                        this.achievements[player.name].notEarnedAchievements["Month" + exCat] = {
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
                        this.achievements[player.name].earnedAchievements["Day" + exCat] = {
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
                        this.achievements[player.name].notEarnedAchievements["Day" + exCat] = {
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
                                this.achievements[player.name].earnedAchievements[achievementName] = {
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
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
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
                                this.achievements[player.name].earnedAchievements[achievementName] = {
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
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
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
                                this.achievements[player.name].earnedAchievements[achievementName] = {
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
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
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
                                this.achievements[player.name].earnedAchievements[achievementName] = {
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
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
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
        this.needsUpload.achievements = true;
        let end = Date.now();
        result(`checkForAchievements done in ${end - start} ms`);
    }

    getPlayerList(playerList, result) {
        let start = Date.now();
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
                returnList[name] = this.registeredPlayers[name].points;
                returnList[name].online = false;
            }
        }
        let end = Date.now();
        logFile.log(`getPlayerList done in ${end - start} ms`, false, 0);
        result(returnList);
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

        if (this.eventLog.time.length == 50) {
            this.eventLog.time = this.eventLog.time.slice(1);
            this.eventLog.msg = this.eventLog.msg.slice(1);
        }
        this.eventLog.time.push(calc.getDateFormat(date, "DD.MM.YYYY") + " | " + hours + ":" + minutes + ":" + seconds);
        this.eventLog.msg.push(msg);


        this.needsUpload.eventLog = true;
    }



    addNewPlayer(name) {
        this.registeredPlayers[name] = 0;
        this.dailyWins[name] = 0;
        this.needsUpload.registeredPlayers = true;
    }


    fullRefresh(result) {
        let start = Date.now(); // milliseconds count from 1 Jan 1970

        var chunk = this.getDefinedHistory(new Date("01/08/2000"), new Date("01/08/9999"));
        //graph
        var xAxis = {}; //points
        var yAxis = []; //date

        //exercise counts + reps
        var repsPerPlayer = {};
        var pointsPerPlayer = {};
        var maxExerciseCountsDaily = {};
        var maxExerciseCountsMonthly = {};
        var maxExerciseCountsOverall = {};

        var maxExerciseCountsCategoryDaily = {};
        var maxExerciseCountsCategoryMonthly = {};
        var maxExerciseCountsCategoryOverall = {};

        //registered players
        for (var playerName in this.registeredPlayers) {

            var data = {
                entries: 0,
                points: {
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
                }
            };
            this.registeredPlayers[playerName] = data;
        }
        //daily max
        var dailySum = {};
        this.dailyWins = {};



        //points
        var MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        var thisYear = calc.createZeroDate().getFullYear();
        var todayDate = calc.createZeroDate();
        todayDate.setMonth(todayDate.getMonth() - 1);
        var lastMonth = todayDate.getMonth();
        var lastMonthYear = todayDate.getFullYear();
        var thisMonth = calc.createZeroDate().getMonth();
        var dateMinus5Days = calc.createZeroDate();
        var currentMonth;
        var currentYear;
        todayDate = calc.createZeroDate();
        dateMinus5Days.setDate(dateMinus5Days.getDate() - 5);
        var sumPointsLastMonth = {};
        var monthlySum = {};
        var monthlyNegative = {};
        var monthlySumWithNegative = {};
        var daysThisMonth = todayDate.getDate();
        var currentMonthName;

        for (var overallIterator = 0; overallIterator < chunk.length; overallIterator++) {
            var historyDate = chunk[overallIterator].date[0];
            var historyEntry = this.history[historyDate];
            //common
            var currentDate = calc.createZeroDate(historyDate);
            //graph
            yAxis.push(historyDate);

            //points

            //exercise counts + reps
            maxExerciseCountsDaily = {};
            maxExerciseCountsCategoryDaily = {};


            if (currentDate.getMonth() > currentMonth && currentDate.getFullYear() >= currentYear ||
                currentDate.getMonth() == currentMonth && currentDate.getFullYear() > currentYear ||
                currentDate.getMonth() < currentMonth && currentDate.getFullYear() > currentYear) {


                monthlySum = {};
                monthlyNegative = {};
                monthlySumWithNegative = {};
                maxExerciseCountsMonthly = {};
                maxExerciseCountsCategoryMonthly = {};
                this.monthlyWins = {};

            }


            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();

            for (var historyIteratorPerDate = 0; historyIteratorPerDate < historyEntry.playerName.length; historyIteratorPerDate++) {
                // ENTRIES INSIDE DATE
                // common
                var historyName = historyEntry.playerName[historyIteratorPerDate];
                var exerciseId = historyEntry.exerciseId[historyIteratorPerDate];
                //set correct exercise names in history
                this.history[historyDate].exName[historyIteratorPerDate] = this.exerciseList[exerciseId].name;


                //exercise counts + reps
                if (repsPerPlayer[exerciseId] == undefined) {
                    repsPerPlayer[exerciseId] = {};
                    repsPerPlayer[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (repsPerPlayer[exerciseId][historyName] == undefined) {
                        repsPerPlayer[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        repsPerPlayer[exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (pointsPerPlayer[exerciseId] == undefined) {
                    pointsPerPlayer[exerciseId] = {};
                    pointsPerPlayer[exerciseId][historyName] = historyEntry.points[historyIteratorPerDate];

                }
                else {
                    if (pointsPerPlayer[exerciseId][historyName] == undefined) {
                        pointsPerPlayer[exerciseId][historyName] = historyEntry.points[historyIteratorPerDate];
                    } else {
                        pointsPerPlayer[exerciseId][historyName] += historyEntry.points[historyIteratorPerDate];
                    }
                }

                if (maxExerciseCountsMonthly[exerciseId] == undefined) {
                    maxExerciseCountsMonthly[exerciseId] = {};
                    maxExerciseCountsMonthly[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsMonthly[exerciseId][historyName] == undefined) {
                        maxExerciseCountsMonthly[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsMonthly[exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (maxExerciseCountsDaily[exerciseId] == undefined) {
                    maxExerciseCountsDaily[exerciseId] = {};
                    maxExerciseCountsDaily[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsDaily[exerciseId][historyName] == undefined) {
                        maxExerciseCountsDaily[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsDaily[exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (maxExerciseCountsOverall[exerciseId] == undefined) {
                    maxExerciseCountsOverall[exerciseId] = {};
                    maxExerciseCountsOverall[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsOverall[exerciseId][historyName] == undefined) {
                        maxExerciseCountsOverall[exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsOverall[exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (this.maxExerciseCounts[exerciseId] == undefined) {
                    this.maxExerciseCounts[exerciseId] = {};
                    this.maxExerciseCounts[exerciseId].daily = {};
                    this.maxExerciseCounts[exerciseId].monthly = {};
                    this.maxExerciseCounts[exerciseId].overall = {};

                    this.maxExerciseCounts[exerciseId].daily = maxExerciseCountsDaily[exerciseId];
                    this.maxExerciseCounts[exerciseId].monthly = maxExerciseCountsMonthly[exerciseId];
                    this.maxExerciseCounts[exerciseId].overall = maxExerciseCountsOverall[exerciseId];
                }
                else {
                    if (this.maxExerciseCounts[exerciseId].daily[historyName] == undefined) {
                        this.maxExerciseCounts[exerciseId].daily[historyName] = maxExerciseCountsDaily[exerciseId][historyName]
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].daily[historyName] < maxExerciseCountsDaily[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].daily[historyName] = maxExerciseCountsDaily[exerciseId][historyName];
                        }
                    }

                    if (this.maxExerciseCounts[exerciseId].monthly[historyName] == undefined) {
                        this.maxExerciseCounts[exerciseId].monthly[historyName] = maxExerciseCountsMonthly[exerciseId][historyName]
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].monthly[historyName] < maxExerciseCountsMonthly[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].monthly[historyName] = maxExerciseCountsMonthly[exerciseId][historyName];
                        }
                    }


                    if (this.maxExerciseCounts[exerciseId].overall[historyName] == undefined) {
                        this.maxExerciseCounts[exerciseId].overall[historyName] = maxExerciseCountsOverall[exerciseId][historyName]
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].overall[historyName] < maxExerciseCountsOverall[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].overall[historyName] = maxExerciseCountsOverall[exerciseId][historyName];
                        }
                    }


                }


                //Category reps
                var exCategory = this.exerciseList[exerciseId].achievementInfo.achievementCategory;

                if (maxExerciseCountsCategoryMonthly[exCategory] == undefined) {
                    maxExerciseCountsCategoryMonthly[exCategory] = {};
                    maxExerciseCountsCategoryMonthly[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsCategoryMonthly[exCategory][historyName] == undefined) {
                        maxExerciseCountsCategoryMonthly[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsCategoryMonthly[exCategory][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (maxExerciseCountsCategoryDaily[exCategory] == undefined) {
                    maxExerciseCountsCategoryDaily[exCategory] = {};
                    maxExerciseCountsCategoryDaily[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsCategoryDaily[exCategory][historyName] == undefined) {
                        maxExerciseCountsCategoryDaily[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsCategoryDaily[exCategory][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (maxExerciseCountsCategoryOverall[exCategory] == undefined) {
                    maxExerciseCountsCategoryOverall[exCategory] = {};
                    maxExerciseCountsCategoryOverall[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];

                }
                else {
                    if (maxExerciseCountsCategoryOverall[exCategory][historyName] == undefined) {
                        maxExerciseCountsCategoryOverall[exCategory][historyName] = historyEntry.count[historyIteratorPerDate];
                    } else {
                        maxExerciseCountsCategoryOverall[exCategory][historyName] += historyEntry.count[historyIteratorPerDate];
                    }
                }

                if (this.maxExerciseCountsCategory[exCategory] == undefined) {
                    this.maxExerciseCountsCategory[exCategory] = {};
                    this.maxExerciseCountsCategory[exCategory].daily = {};
                    this.maxExerciseCountsCategory[exCategory].monthly = {};
                    this.maxExerciseCountsCategory[exCategory].overall = {};

                    this.maxExerciseCountsCategory[exCategory].daily = maxExerciseCountsCategoryDaily[exCategory];
                    this.maxExerciseCountsCategory[exCategory].monthly = maxExerciseCountsCategoryMonthly[exCategory];
                    this.maxExerciseCountsCategory[exCategory].overall = maxExerciseCountsCategoryOverall[exCategory];
                }
                else {
                    if (this.maxExerciseCountsCategory[exCategory].daily[historyName] == undefined) {
                        this.maxExerciseCountsCategory[exCategory].daily[historyName] = maxExerciseCountsCategoryDaily[exCategory][historyName]
                    }
                    else {
                        if (this.maxExerciseCountsCategory[exCategory].daily[historyName] < maxExerciseCountsCategoryDaily[exCategory][historyName]) {
                            this.maxExerciseCountsCategory[exCategory].daily[historyName] = maxExerciseCountsCategoryDaily[exCategory][historyName];
                        }
                    }

                    if (this.maxExerciseCountsCategory[exCategory].monthly[historyName] == undefined) {
                        this.maxExerciseCountsCategory[exCategory].monthly[historyName] = maxExerciseCountsCategoryMonthly[exCategory][historyName]
                    }
                    else {
                        if (this.maxExerciseCountsCategory[exCategory].monthly[historyName] < maxExerciseCountsCategoryMonthly[exCategory][historyName]) {
                            this.maxExerciseCountsCategory[exCategory].monthly[historyName] = maxExerciseCountsCategoryMonthly[exCategory][historyName];
                        }
                    }


                    if (this.maxExerciseCountsCategory[exCategory].overall[historyName] == undefined) {
                        this.maxExerciseCountsCategory[exCategory].overall[historyName] = maxExerciseCountsCategoryOverall[exCategory][historyName]
                    }
                    else {
                        if (this.maxExerciseCountsCategory[exCategory].overall[historyName] < maxExerciseCountsCategoryOverall[exCategory][historyName]) {
                            this.maxExerciseCountsCategory[exCategory].overall[historyName] = maxExerciseCountsCategoryOverall[exCategory][historyName];
                        }
                    }


                }



                this.exerciseList[exerciseId].repsPerPlayer = repsPerPlayer[exerciseId];
                this.exerciseList[exerciseId].pointsPerPlayer = pointsPerPlayer[exerciseId];


                //registered players
                this.registeredPlayers[historyName].entries++;

                //daily max
                if (dailySum[historyName] == undefined) {
                    dailySum[historyName] = historyEntry.points[historyIteratorPerDate];
                }
                else {
                    dailySum[historyName] += historyEntry.points[historyIteratorPerDate];
                }
                //points

                if (this.exerciseList[exerciseId].type === "Cardio") {
                    this.registeredPlayers[historyName].points.cardio += Number(historyEntry.points[historyIteratorPerDate]);
                }
                else if (this.exerciseList[exerciseId].type === "Kraft") {
                    this.registeredPlayers[historyName].points.strength += Number(historyEntry.points[historyIteratorPerDate]);
                }
                this.registeredPlayers[historyName].points.total += Number(historyEntry.points[historyIteratorPerDate]);


                if (dailySum[historyName] > this.registeredPlayers[historyName].points.dailyMax) {
                    this.registeredPlayers[historyName].points.dailyMax = dailySum[historyName];
                }

                if (dailySum[historyName] > this.registeredPlayers[historyName].points.dailyMax) {
                    this.registeredPlayers[historyName].points.dailyMax = dailySum[historyName];
                }

                if (Number(historyEntry.points[historyIteratorPerDate] <= 0)) {
                    if (monthlyNegative[historyName] == undefined) {
                        monthlyNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        monthlyNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }
                }
                else {
                    if (monthlySum[historyName] == undefined) {
                        monthlySum[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        monthlySum[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }
                }

                if (monthlySumWithNegative[historyName] == undefined) {
                    monthlySumWithNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                }
                else {
                    monthlySumWithNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                }




                if (monthlySum[historyName] > this.registeredPlayers[historyName].points.monthlyMax) {
                    var negative = 0;
                    if (monthlyNegative[historyName] != undefined) {
                        negative = monthlyNegative[historyName]
                    }
                    this.registeredPlayers[historyName].points.monthlyMax = monthlySum[historyName] + negative;
                }


                if (dailySum[historyName] > this.registeredPlayers[historyName].points.dailyMax) {
                    this.registeredPlayers[historyName].points.dailyMax = dailySum[historyName];
                }

                if (currentDate > dateMinus5Days) {
                    this.registeredPlayers[historyName].points.last5Days += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (currentDate.getDate() == todayDate.getDate() && currentDate.getMonth() == todayDate.getMonth() && currentDate.getFullYear() == todayDate.getFullYear()) {
                    this.registeredPlayers[historyName].points.today += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (Number(historyEntry.points[historyIteratorPerDate]) < 0) {
                    this.registeredPlayers[historyName].points.negative += Math.abs(Number(historyEntry.points[historyIteratorPerDate]));
                }
                if (currentDate.getMonth() == thisMonth && currentDate.getFullYear() == thisYear) {
                    this.registeredPlayers[historyName].points.thisMonth += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (currentDate.getMonth() == lastMonth && currentDate.getFullYear() == lastMonthYear) {
                    if (sumPointsLastMonth[historyName] == undefined) {
                        sumPointsLastMonth[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        sumPointsLastMonth[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }


                }
                if (sumPointsLastMonth[historyName] == undefined) {
                    sumPointsLastMonth[historyName] = 0;
                }
                this.registeredPlayers[historyName].points.diffLastMonth = sumPointsLastMonth[historyName] - this.registeredPlayers[historyName].points.thisMonth;
                this.registeredPlayers[historyName].points.averageThisMonth = this.registeredPlayers[historyName].points.thisMonth / daysThisMonth;
            }

            //daily max
            this.history[historyDate].dailySum = dailySum;

            var max = 100;
            var dailyWinner = "Keiner";
            for (var playerName in this.registeredPlayers) {
                if (this.history[historyDate].dailySum[playerName] != undefined) {
                    if (this.history[historyDate].dailySum[playerName] > max) {
                        max = this.history[historyDate].dailySum[playerName];
                        dailyWinner = playerName;
                    }
                    //graph 
                    if (xAxis[playerName] == undefined) {
                        xAxis[playerName] = [this.registeredPlayers[playerName].points.total];
                    }
                    else {
                        xAxis[playerName].push(this.registeredPlayers[playerName].points.total);
                    }
                }
                else {
                    if (xAxis[playerName] == undefined) {
                        xAxis[playerName] = [this.registeredPlayers[playerName].points.total];
                    }
                    else {
                        xAxis[playerName].push(this.registeredPlayers[playerName].points.total);
                    }
                }

                this.fullGraph[playerName] = {
                    xAxis: xAxis[playerName],
                    yAxis: yAxis
                };


            }

            this.history[historyDate].dailyWinner = dailyWinner;
            if (this.dailyWins[dailyWinner] != undefined) {
                this.dailyWins[dailyWinner]++;

            }
            else {
                this.dailyWins[dailyWinner] = 1;
            }
            dailySum = {};

            currentMonthName = MONTHS[Number(historyDate.substring(5, 5 + 2)) - 1] + " " + historyDate.substring(0, 0 + 4);
            this.monthlyData[currentMonthName] = monthlySumWithNegative;
        } //END FOR

        this.needsUpload.history = true;
        this.needsUpload.exerciseList = true;
        this.needsUpload.registeredPlayers = true;

        let end = Date.now(); // done
        result(`full refresh took ${end - start} ms`);
    }

}

module.exports = FitnessManager;