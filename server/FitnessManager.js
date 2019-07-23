// @ts-nocheck
/*jshint esversion: 6 */
Exercise = require("./Exercise");
Calc = require("./calc");
Common = require("../client/js/common");
Log = require("./Log");
EmailManager = require("./EmailManager");


achievementList = require("../saves/config/achievementList");

var logFile = new Log();
calc = new Calc();
common = new Common();
var mailer = new EmailManager();

class FitnessManager {
    constructor() {
        this.name = "GAGS";
        this.exerciseCount = 0;
        this.today = common.createZeroDate();
        this.uploadTimer = 0;
        this.needsUpload = {
            dataStorage: false,
        };
        this.loadingDone = false;
        this.totalHistoryEntries = 0;
        this.featuredExerciseId = 0;

        //BAR CHARTS
        this.monthlyData = {};
        this.monthlyCardioData = {};
        this.monthlyStrengthData = {};


        //LINE CHARTS
        this.fullGraph = {};
        this.fullCardioGraph = {};
        this.fullStrengthGraph = {};
        this.fullDailyResetGraph = {};
        this.fullDailyResetCardioGraph = {};
        this.fullDailyResetStrengthGraph = {};

        //WORK OBJECTS

        this.exerciseEntryCount = {};
        this.exerciseTotalReps = {};
        this.exerciseRepsPerEntryAverage = {};

        this.monthlyDataExercise = {};
        this.monthlyDataExerciseCategory = {};
        this.dailyDataExercise = {};
        this.dailyDataExerciseCategory = {};
        this.maxExerciseCounts = {};
        this.maxExerciseCountsCategory = {};
        this.dailyWins = {};
        this.monthlyWins = {};
        this.featuredExerciseId = 0;


        //WORK OBJECTS WITH SAVE FILE SUPPORT
        this.registeredPlayers = {};
        this.achievements = {};
        this.history = {};
        this.exerciseList = {};
        this.eventLog = {
            time: [],
            msg: [],
            html:""
        };
        this.paceUnits = "min/km;min/m;Wdh/min;Wdh/sec";
        this.paceInvert = "0;0;1;1";

    }

    


    //************************************************************/
    //*********************Exercise Handling**********************/
    //************************************************************/
    featureNewExercise() {
        let randomNumber = Math.floor(Math.random() * Object.keys(this.exerciseList).length);
        let counter = 0;
        for (let exId in this.exerciseList) {
            if (counter == randomNumber) {
                if (this.exerciseList[exId].factor > 0) {
                    this.featuredExerciseId = exId;
                    this.addToEventLog(common.HTMLBold(common.HTMLColor("EINE NEUE DOUBLE TIME ÜBUNG WURDE FESTGELEGT: " + this.exerciseList[this.featuredExerciseId].name, "red")));
                    return this.exerciseList[this.featuredExerciseId].name;
                }
                else {
                    randomNumber++;
                }

            }
            counter++;
        }
    }

    hideExercise(id, playerName, result) {
        if (this.exerciseList[id].isHidden[playerName] == undefined) {
            this.exerciseList[id].isHidden[playerName] = true;
        }
        else {
            this.exerciseList[id].isHidden[playerName] = !this.exerciseList[id].isHidden[playerName];
        }
        if (this.exerciseList[id].isHidden[playerName]) {
            result(this.exerciseList[id].name + " hidden for player " + playerName);
        }
        else {
            result(this.exerciseList[id].name + " not hidden for player " + playerName);
        }


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
            this.needsUpload.dataStorage = true;
        }.bind(this), 10);
    }

    addExercise(exercise) {
        this.exerciseList[exercise.id] = exercise;
        this.exerciseCount++;
        return "add Exercise finished";
    }



    createExercise(exPack, usesWeight, creator, result) {
        this.addToEventLog(creator + " erstellt eine neue Übung: '" + common.HTMLBold(exPack.name) + "'");
        for (let exerciseKey in exPack) {
            if (exerciseKey.toLowerCase() == "name" || exerciseKey.toLowerCase() == "id" || exerciseKey.toLowerCase() == "paceunitoptions") {
                continue;
            }
            let currentKey = exPack[exerciseKey];
            this.addToEventLog(common.HTMLBold(common.translate(exerciseKey)) + ": '" + common.HTMLBold(common.translate(currentKey)) + "'");
        }
        result(this.addExercise(new Exercise(exPack.name, exPack.difficulty, exPack.difficulty10, exPack.difficulty100, exPack.paceConstant, exPack.isPaceExercise, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit, exPack.bothSides)));
    }

    editExercise(data, editor, result) {

        var exerciseChangeFlags = {
            difficulty: false,
            difficulty10: false,
            difficulty100: false,
            baseWeight: false,
            comment: false,
            bothSides: false,
            unit: false,
            name: false,
            type: false,
            equipment: false,
            paceConstant: false,
        };

        var newVote = {
            difficulty: data.difficulty,
            difficulty10: data.difficulty10,
            difficulty100: data.difficulty100,
            paceConstant: data.paceConstant,
            baseWeight: data.baseWeight,
            comment: data.comment
        };

        //EVENTLOG MSG
        this.addToEventLog(common.HTMLBold(editor) + " bearbeitet eine Übung: " + common.HTMLBold(this.exerciseList[data.id].name) + " -> Alter Faktor: '" + common.HTMLBold(common.translate(this.exerciseList[data.id].factor)) + "'");
        for (let exerciseKey in data) {
            let currentKey = this.exerciseList[data.id][exerciseKey];
            if (exerciseKey == "paceUnitOptions") {
                continue;
            }
            if (exerciseKey == "bothSides") {
                currentKey = this.exerciseList[data.id][exerciseKey].toString();
            }
            //IF THERE IS A VOTE FROM THIS EDITOR, USE THE VOTE DATA
            if (
                (exerciseKey == "difficulty" ||
                    exerciseKey == "difficulty10" ||
                    exerciseKey == "difficulty100" ||
                    exerciseKey == "paceConstant" ||
                    exerciseKey == "baseWeight" ||
                    exerciseKey == "comment") &&
                this.exerciseList[data.id].votes[editor] != undefined) {
                if (data[exerciseKey] != this.exerciseList[data.id].votes[editor][exerciseKey]) {
                    exerciseChangeFlags[exerciseKey] = true;
                    this.addToEventLog(common.HTMLBold(common.translate(exerciseKey)) + " -> Alter Wert: '" + common.HTMLBold(this.exerciseList[data.id].votes[editor][exerciseKey]) + "' | Neuer Wert: '" + common.HTMLBold(common.translate(data[exerciseKey])) + "'");
                }
            }
            else if (
                (exerciseKey == "difficulty" ||
                    exerciseKey == "difficulty10" ||
                    exerciseKey == "difficulty100" ||
                    exerciseKey == "paceConstant" ||
                    exerciseKey == "baseWeight" ||
                    exerciseKey == "comment") &&
                this.exerciseList[data.id].votes[editor] == undefined) {
                this.addToEventLog(common.HTMLBold(common.translate(exerciseKey)) + " -> Alter Wert: '" + common.HTMLBold("'Kein Vote'") + "' | Neuer Wert: '" + common.HTMLBold(common.translate(data[exerciseKey])) + "'");
            }
            else {
                if (data[exerciseKey] != currentKey) {
                    exerciseChangeFlags[exerciseKey] = true;
                    this.addToEventLog(common.HTMLBold(common.translate(exerciseKey)) + " -> Alter Wert: '" + common.HTMLBold(currentKey) + "' | Neuer Wert: '" + common.HTMLBold(common.translate(data[exerciseKey])) + "'");
                }
            }

        }

        //CHECK IF VOTES SHOULD BE DESTROYED
        if (this.exerciseList[data.id].unit != data.unit) {

            this.exerciseList[data.id].votes = {};
            this.exerciseList[data.id].votes[editor] = newVote;
            this.addToEventLog(common.HTMLBold(editor) + " hat ebenfalls die Einheit in '" + common.HTMLBold(data.unit) + "' geändert. Somit wurden bisherige Votes gelöscht.");
        }
        else {
            this.exerciseList[data.id].votes[editor] = newVote;
        }

        this.exerciseList[data.id].bothSides = (data.bothSides.toUpperCase() === 'TRUE');
        this.exerciseList[data.id].unit = data.unit;
        this.exerciseList[data.id].name = data.name;
        this.exerciseList[data.id].type = data.type;
        this.exerciseList[data.id].equipment = data.equipment;
        this.exerciseList[data.id].isPaceExercise = data.isPaceExercise;

        calc.calculateNewFactor(this.exerciseList[data.id]);
        this.addToEventLog("Resultierender neuer Faktor: '" + common.HTMLBold(this.exerciseList[data.id].factor) + "'");



        result("editExercise done");
    }

    removeExercise(id) {
        delete this.exerciseList[id];
        this.exerciseCount--;
    }

    deleteExercise(id, result) {
        if (this.exerciseList[id].points == 0) {
            this.removeExercise(id);
        }
        else {
            this.exerciseList[id].deleted = true;
            result(" deleted Exercise" + this.exerciseList[id].name);
        }
    }

    //************************************************************/
    //*******************History Handling*************************/
    //************************************************************/

    deleteHistory(id, date, result) {
        var deleter = "";
        var exercise = "";
        var exerciseIdToRecalculate;
        for (let historyEntryIterator in this.history[date].id) {
            if (this.history[date].id[historyEntryIterator] == id) {
                deleter = this.history[date].playerName[historyEntryIterator];
                exercise = this.history[date].exName[historyEntryIterator];
                exerciseIdToRecalculate = this.history[date].exerciseId[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].repsPerPlayer[this.history[date].playerName[historyEntryIterator]] -= this.history[date].count[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].pointsPerPlayer[this.history[date].playerName[historyEntryIterator]] -= this.history[date].points[historyEntryIterator];
                this.exerciseList[exerciseIdToRecalculate].points -= this.history[date].points[historyEntryIterator];
                this.history[date].dailySum[this.history[date].playerName[historyEntryIterator]] -= this.history[date].points[historyEntryIterator];

                for (let historyEntry in this.history[date]) {
                    if (historyEntry != "dailySum" && historyEntry != "dailyWinner") {
                        this.history[date][historyEntry].splice(historyEntryIterator, 1);
                    }
                }
                if (this.history[date].id.length == 0) {
                    delete this.history[date];

                }

                this.addToEventLog(deleter + " entfernt einen Eintrag aus seiner History: " + exercise + " am " + date);

                result("deleted History Entry: " + exerciseIdToRecalculate);




            }
        }




    }

    getSortedExerciseList() {
        var sortable = [];
        var exerciseChunk = [];
        for (let exerciseId in this.exerciseList) {
            sortable.push([this.exerciseList[exerciseId].name, this.exerciseList[exerciseId]]);
        }

        sortable.sort();
        for (let iterator = 0; iterator < sortable.length; iterator++) {
            exerciseChunk[iterator] = sortable[iterator][1];
        }
        return exerciseChunk;
    }

    getDefinedHistory(fromDate, toDate) {
        fromDate = common.createZeroDate(fromDate);
        toDate = common.createZeroDate(toDate);
        var sortable = [];
        var historyChunk = [];
        for (let historyEntry in this.history) {
            var currentDate = common.createZeroDate(historyEntry);
            if (currentDate >= fromDate && currentDate <= toDate) {
                sortable.push([historyEntry, this.history[historyEntry]]);
            }
        }
        sortable.sort(function (a, b) {
            return common.createZeroDate(a[0]) - common.createZeroDate(b[0]);
        });
        for (let iterator = 0; iterator < sortable.length; iterator++) {
            historyChunk[iterator] = sortable[iterator][1];
        }
        return historyChunk;
    }

    addToHistory(id, playerName, exerciseId, weight, count, countAdditional, date, result) {

        if (countAdditional == "" || countAdditional == undefined) {
            countAdditional = undefined;
        }
        var pace = {};

        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
            weight = 0;
        }
        date = common.createZeroDate(date);
        date = common.getDateFormat(date, "YYYY-MM-DD");
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count, countAdditional, pace);

        let doubleTimeMessage = "";
        if (this.featuredExerciseId == exerciseId) {
            //doubleTime
            points *= 2;
            doubleTimeMessage = "+ Double Time Bonus";

        }
        if (this.history[date] != undefined) {
            for (let iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId && this.history[date].weight[iterator] == weight && this.history[date].playerName[iterator].toUpperCase() == playerName.toUpperCase() && countAdditional == undefined) {
                    //HISTORY ENTRY IS AVAILABLE - AND NEW ENTRY IS STACKABLE! 
                    this.history[date].count[iterator] += Number(count);
                    this.history[date].points[iterator] += Number(points);
                    this.history[date].dailySum[playerName] += Number(points);
                    this.history[date].countAdditional[iterator] = 0;
                    this.history[date].pace[iterator] = "-";
                    this.history[date].exUnit[iterator] = this.exerciseList[exerciseId].unit;
                    this.addToEventLog(playerName + " hat etwas am " + date + " gemacht: " + count + " " + this.exerciseList[exerciseId].name + " (" + Number(points).toFixed(2) + " Punkte " + doubleTimeMessage + ")");

                    result("added workout to existing history");
                    return;
                }
            }

            //HISTORY ENTRY IS AVAILABLE - BUT NEW ENTRY IS NOT STACKABLE!
            this.history[date].id.push(id);
            this.history[date].date.push(date);
            this.history[date].playerName.push(playerName);
            this.history[date].exName.push(this.exerciseList[exerciseId].name);
            this.history[date].count.push(Number(count));
            this.history[date].points.push(Number(points));
            this.history[date].weight.push(Number(weight));
            this.history[date].exerciseId.push(exerciseId);
            this.history[date].pace.push(pace[exerciseId]);
            this.history[date].exUnit.push(this.exerciseList[exerciseId].unit);
            if (countAdditional != undefined) {
                this.history[date].countAdditional.push(Number(countAdditional));
            }
            else {
                this.history[date].countAdditional.push(0);
            }

            if (this.history[date].dailySum[playerName] == undefined) {
                this.history[date].dailySum[playerName] = Number(points);
            }
            else {
                this.history[date].dailySum[playerName] += Number(points);
            }
        }
        else {
            //HISTORY ENTRY IS NOT AVAILABLE - CREATING
            var newId = [], newDate = [], newPlayerName = [], newExName = [], newCount = [], newPoints = [], newWeight = [], newExerciseId = [], newDailySum = {}, newPace = [], newCountAdditional = [], newUnit = [];
            newId.push(id);
            newDate.push(date);
            newPlayerName.push(playerName);
            newExName.push(this.exerciseList[exerciseId].name);
            newCount.push(Number(count));
            newPoints.push(Number(points));
            newWeight.push(Number(weight));
            newExerciseId.push(exerciseId);
            newDailySum[playerName] = Number(points);
            newPace.push(pace[exerciseId]);
            newUnit.push(this.exerciseList[exerciseId].unit);
            if (countAdditional != undefined) {
                newCountAdditional.push(Number(countAdditional));
            }
            else {
                newCountAdditional.push(0);
            }

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
                pace: newPace,
                countAdditional: newCountAdditional,
                exUnit: newUnit,
            };
            this.history[date] = newHistoryEntry;
        }

        this.addToEventLog(playerName + " hat etwas am " + date + " gemacht: " + count + " " + this.exerciseList[exerciseId].name + " (" + Number(points).toFixed(2) + " Punkte " + doubleTimeMessage + ")");
        result("added workout to existing history");


    }

    //************************************************************/
    //*********************Graph Handling*************************/
    //************************************************************/

    createGraph(fromDate, toDate, pointType, type) {
        fromDate = common.createZeroDate(fromDate);
        toDate = common.createZeroDate(toDate);

        var resultGraph = {};
        var firstIndex = -1;
        var lastIndex = -1;
        var usedGraph;
        if (type == "line") {
            if (pointType == "cardio") {
                usedGraph = this.fullCardioGraph;
            }
            else if (pointType == "strength") {
                usedGraph = this.fullStrengthGraph;
            }
            else {
                usedGraph = this.fullGraph;
            }
        }
        else if (type == "line-day") {
            if (pointType == "cardio") {
                usedGraph = this.fullDailyResetCardioGraph;
            }
            else if (pointType == "strength") {
                usedGraph = this.fullDailyResetStrengthGraph;
            }
            else {
                usedGraph = this.fullDailyResetGraph;
            }
        }



        for (let playerName in usedGraph) {
            var currentGraph = usedGraph[playerName];
            for (let graphIterator = 0; graphIterator < currentGraph.yAxis.length; graphIterator++) {
                if (firstIndex == -1 && common.createZeroDate(currentGraph.yAxis[graphIterator]) >= fromDate) {
                    firstIndex = graphIterator;
                }
                if (lastIndex == -1 && common.createZeroDate(currentGraph.yAxis[graphIterator]) >= toDate) {
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
                yAxis: currentGraph.yAxis.slice(firstIndex, lastIndex + 1),
                xAxis: currentGraph.xAxis.slice(firstIndex, lastIndex + 1)
            };

        }
        return resultGraph;
    }

    //************************************************************/
    //*******************Achievement Handling*********************/
    //************************************************************/

    setBestExerciserNumber(player, result) {
        let start = Date.now();
        var sum = 0;
        for (let exId in this.exerciseList) {
            var exercise = this.exerciseList[exId];
            var maxReps = 0;
            var bestPlayer = "Keiner";
            for (let playerName in exercise.repsPerPlayer) {
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
        let start = Date.now();
        //exercise Achievements
        this.achievements[player.name] = {
            earnedAchievements: {},
            notEarnedAchievements: {}
        };

        var endLastLevel;
        var endThisLevel;
        var diff;
        var percent;

        for (let exId in this.exerciseList) {
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


            for (let levelOverallIterator = 0; levelOverallIterator < exercise.achievementInfo.repsToGetOverall.length; levelOverallIterator++) {
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
            for (let levelMonthIterator = 0; levelMonthIterator < exercise.achievementInfo.repsToGetMonthly.length; levelMonthIterator++) {
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
            for (let levelDayIterator = 0; levelDayIterator < exercise.achievementInfo.repsToGetDaily.length; levelDayIterator++) {
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
        var needArray;
        var achievementName;
        var achievementText;
        var pointsThisLevel;
        for (let achievementCategory in achievementList.content) {
            if (achievementCategory === "pointAchievements") {
                for (let pointAchievementCategory in achievementList.content[achievementCategory]) {
                    if (pointAchievementCategory === "daily") {
                        needArray = achievementList.content[achievementCategory][pointAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][pointAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][pointAchievementCategory].text;

                        for (let levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (this.registeredPlayers[player.name].points.dailyMax >= needArray[levelIterator]) {
                                this.achievements[player.name].earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.dailyMax + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = this.registeredPlayers[player.name].points.dailyMax - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = this.registeredPlayers[player.name].points.dailyMax / needArray[levelIterator] * 100;
                                }
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.dailyMax.toFixed(2) + "/" + needArray[levelIterator],
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

                        for (let levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (this.registeredPlayers[player.name].points.monthlyMax >= needArray[levelIterator]) {
                                this.achievements[player.name].earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.monthlyMax + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = this.registeredPlayers[player.name].points.monthlyMax - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = this.registeredPlayers[player.name].points.monthlyMax / needArray[levelIterator] * 100;
                                }
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.monthlyMax.toFixed(2) + "/" + needArray[levelIterator],
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

                        for (let levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (this.registeredPlayers[player.name].points.total >= needArray[levelIterator]) {
                                this.achievements[player.name].earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.total + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = this.registeredPlayers[player.name].points.total - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = this.registeredPlayers[player.name].points.total / needArray[levelIterator] * 100;
                                }
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.registeredPlayers[player.name].points.total.toFixed(2) + "/" + needArray[levelIterator],
                                    percent: percent,
                                };
                                break;
                            }
                        }
                    }
                }
            }
            if (achievementCategory === "winAchievements") {
                for (let winAchievementCategory in achievementList.content[achievementCategory]) {
                    if (winAchievementCategory === "daily") {
                        needArray = achievementList.content[achievementCategory][winAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][winAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][winAchievementCategory].text;

                        for (let levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
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
                    if (winAchievementCategory === "monthly") {
                        needArray = achievementList.content[achievementCategory][winAchievementCategory].need;
                        achievementName = achievementList.content[achievementCategory][winAchievementCategory].name;
                        achievementText = achievementList.content[achievementCategory][winAchievementCategory].text;

                        for (let levelIterator = 0; levelIterator < needArray.length; levelIterator++) {
                            if (this.monthlyWins[player.name] >= needArray[levelIterator]) {
                                this.achievements[player.name].earnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.monthlyWins[player.name] + "/" + needArray[levelIterator],
                                    percent: 100,
                                };
                            }
                            else {
                                if (levelIterator > 0) {
                                    endLastLevel = needArray[levelIterator - 1];
                                    endThisLevel = needArray[levelIterator];
                                    diff = endThisLevel - endLastLevel;
                                    pointsThisLevel = this.monthlyWins[player.name] - endLastLevel;
                                    percent = pointsThisLevel / diff * 100;
                                }
                                else {
                                    percent = this.monthlyWins[player.name] / needArray[levelIterator] * 100;
                                }
                                this.achievements[player.name].notEarnedAchievements[achievementName] = {
                                    level: (levelIterator + 1) + "/" + calc.getNonZeroValuesOfArray(needArray),
                                    text: achievementText,
                                    progress: this.monthlyWins[player.name] + "/" + needArray[levelIterator],
                                    percent: percent,
                                };

                                break;
                            }
                        }
                    }
                }
            }
        }
        let end = Date.now();
        result(`checkForAchievements done in ${end - start} ms`);
    }


    getAchievementList(player, result) {
        var achievementList = {};
        var notEarnedAchievements = [];
        var achievementIterator = 0;
        var currentLevel = 0;

        var earned = this.achievements[player.name].earnedAchievements;
        var notEarned = this.achievements[player.name].notEarnedAchievements;

        achievementIterator = 0;
        for (let achievementCategory in notEarned) {
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

        for (let achievementCategory in earned) {
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


    //************************************************************/
    //*******************Other Handling***************************/
    //************************************************************/

    checkPlayerStuff(player, playerStuffResult) {
        //USAGE: After a clean calculation via FullRefresh
        this.setBestExerciserNumber(player, function (result) {
            logFile.log(result, false, 0);
            this.checkForAchievements(player, function (result) {
                logFile.log(result, false, 0);
                playerStuffResult("checkPlayerStuff done");
            }.bind(this));
        }.bind(this));
    }


    addToEventLog(msg) {
        var date = common.createViennaDate();
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

        let FirstDateEntry = common.createZeroDate(common.getDateFormat(this.eventLog.time[0].split(" | ")[0],"YYYY-MM-DD","DD.MM.YYYY")).getTime();
        let dateMinusThreeMonths =  common.createZeroDate(date);
        dateMinusThreeMonths.setMonth(date.getMonth()-3);
        dateMinusThreeMonths = dateMinusThreeMonths.getTime();

        if (this.eventLog.time.length > 500 && FirstDateEntry < dateMinusThreeMonths) {
            this.eventLog.time = this.eventLog.time.slice(1);
            this.eventLog.msg = this.eventLog.msg.slice(1);
        }
        this.eventLog.time.push(common.getDateFormat(date, "DD.MM.YYYY") + " | " + hours + ":" + minutes + ":" + seconds);
        this.eventLog.msg.push(msg);
        this.eventLog.html = this.eventLog.html + "<li>" + this.eventLog.time[this.eventLog.time.length-1] + " - " + this.eventLog.msg[this.eventLog.msg.length-1] + "</li>";



        this.needsUpload.dataStorage = true;
    }

    createHTMLEventLog() {
        let start = Date.now();
        this.eventLog.html = "";
        for (var eventIterator = 0; eventIterator < this.eventLog.time.length; eventIterator++) {
            this.eventLog.html = this.eventLog.html + "<li>" + this.eventLog.time[eventIterator] + " - " + this.eventLog.msg[eventIterator] + "</li>";
        }


        let end = Date.now();
        logFile.log(`eventlog generation took ${end - start} ms`, false, 0);
    }

    addNewPlayer(name) {
        var data = {
            entries: 0,
            points: {
                total: 0,
                cardio: 0,
                strength: 0,
                cardioStrengthRatio: 0,
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
        this.registeredPlayers[name] = data;
        this.dailyWins[name] = 0;
        this.needsUpload.dataStorage = true;
    }

    /**
     * 
     * @param {function} result 
     */
    fullRefresh(result) {
        let start = Date.now();
        var chunk = this.getDefinedHistory(new Date("01/08/2000"), new Date("01/08/9999"));

        //graph
        var xAxis = {}; //points
        var xAxisCardio = {}; //points
        var xAxisStrength = {}; //points
        var xAxisDailyReset = {}; //points
        var xAxisDailyResetCardio = {}; //points
        var xAxisDailyResetStrength = {}; //points
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
        this.exerciseEntryCount = {};
        this.exerciseRepsPerEntryAverage = {};

        //points
        this.dailyWins = {};
        this.monthlyWins = {};
        this.maxExerciseCountsCategory = {};
        this.monthlyDataExercise = {};
        this.monthlyDataExerciseCategory = {};
        this.dailyDataExercise = {};
        this.dailyDataExerciseCategory = {};

        var todayDate = common.createZeroDate();
        var currentMonth;
        var currentYear;

        var sumPointsLastMonth = {};
        var monthlySum = {};
        var monthlyNegative = {};
        var monthlySumWithNegative = {};
        var monthlyCardioSum = {};
        var monthlyStrengthSum = {};
        var dailySum = {};
        var dailyCardio = {};
        var dailyStrength = {};
        var dailySumNegative = {};
        var dailySumWithNegative = {};
        var daysThisMonth = todayDate.getDate();


        //points
        this.dailyWins = {};
        this.monthlyWins = {};
        this.maxExerciseCountsCategory = {};
        this.monthlyDataExercise = {};
        this.monthlyDataExerciseCategory = {};
        this.dailyDataExercise = {};
        this.dailyDataExerciseCategory = {};



        //registered players
        for (let playerName in this.registeredPlayers) {
            var data = {
                entries: 0,
                points: {
                    total: 0,
                    cardio: 0,
                    strength: 0,
                    cardioStrengthRatio: 0,
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

            this.dailyWins[playerName] = 0;
            this.monthlyWins[playerName] = 0;
        }


        if (chunk.length == 0) {
            result("chunk.length == 0 in 'full refresh - abort");
            return;
        }
        var lastDate = common.createZeroDate(chunk[0].date[0]);

        for (let overallIterator = 0; overallIterator < chunk.length; overallIterator++) {
            var historyDate = chunk[overallIterator].date[0];
            var historyEntry = this.history[historyDate];

            //MAINENANCE CODE - DELETE AFTER START UP
            if (this.history[historyDate].pace == undefined) {
                var newPace = [];
                newPace.length = this.history[historyDate].playerName.length;
                newPace.fill("-");
                this.history[historyDate].pace = newPace;
            }
            if (this.history[historyDate].countAdditional == undefined) {
                var newCountAdditional = [];
                newCountAdditional.length = this.history[historyDate].playerName.length;
                newCountAdditional.fill(0);
                this.history[historyDate].countAdditional = newCountAdditional;
            }
            //MAINENANCE CODE - DELETE AFTER START UP

            //common
            var currentDate = common.createZeroDate(historyDate);
            var currentDateInfo = common.getDateInfo(currentDate);

            //exercise counts + reps
            maxExerciseCountsDaily = {};
            maxExerciseCountsCategoryDaily = {};

            //Month changes - reset monthly related points
            if (currentDateInfo.month > currentMonth && currentDateInfo.year >= currentYear ||
                currentDateInfo.month == currentMonth && currentDateInfo.year > currentYear ||
                currentDateInfo.month < currentMonth && currentDateInfo.year > currentYear) {

                //monthly max
                var monthlyWinner = "Keiner";
                let max = 100;
                for (let playerName in monthlySumWithNegative) {
                    if (monthlySumWithNegative[playerName] > max) {
                        monthlyWinner = playerName;
                        max = monthlySumWithNegative[playerName];
                    }
                }
                if (this.monthlyWins[monthlyWinner] == undefined) {
                    this.monthlyWins[monthlyWinner] = 1;
                }
                else {
                    this.monthlyWins[monthlyWinner] += 1;
                }
                monthlySum = {};
                monthlyCardioSum = {};
                monthlyStrengthSum = {};
                monthlyNegative = {};
                monthlySumWithNegative = {};
                maxExerciseCountsMonthly = {};
                maxExerciseCountsCategoryMonthly = {};

            }

            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();

            //graph
            if (common.daysBetween(currentDate, lastDate) > 1) {
                let playerCount = 0;
                for (let playerName in this.registeredPlayers) {
                    let iteratorDate = common.createZeroDate(lastDate);
                    iteratorDate.setDate(iteratorDate.getDate() + 1);


                    while (iteratorDate < currentDate) {
                        xAxis[playerName].push(this.registeredPlayers[playerName].points.total);
                        xAxisCardio[playerName].push(this.registeredPlayers[playerName].points.cardio);
                        xAxisStrength[playerName].push(this.registeredPlayers[playerName].points.strength);

                        xAxisDailyReset[playerName].push(0);
                        xAxisDailyResetCardio[playerName].push(0);
                        xAxisDailyResetStrength[playerName].push(0);

                        if (playerCount == 0) {
                            yAxis.push(common.getDateFormat(iteratorDate, "YYYY-MM-DD"));
                        }
                        iteratorDate.setDate(iteratorDate.getDate() + 1);
                    }
                    playerCount++;
                }
            }

            yAxis.push(historyDate);
            lastDate = currentDate; //remember last Date
            for (let historyIteratorPerDate = 0; historyIteratorPerDate < historyEntry.playerName.length; historyIteratorPerDate++) {
                // ENTRIES INSIDE DATE
                // common
                var historyName = historyEntry.playerName[historyIteratorPerDate];
                var exerciseId = historyEntry.exerciseId[historyIteratorPerDate];
                var exCategory = this.exerciseList[exerciseId].achievementInfo.achievementCategory;


                this.totalHistoryEntries++;

                if (this.exerciseEntryCount[exerciseId] != undefined) {
                    this.exerciseEntryCount[exerciseId]++;
                }
                else {
                    this.exerciseEntryCount[exerciseId] = 1;
                }

                if (this.exerciseTotalReps[exerciseId] != undefined) {
                    this.exerciseTotalReps[exerciseId] += historyEntry.count[historyIteratorPerDate];
                }
                else {
                    this.exerciseTotalReps[exerciseId] = historyEntry.count[historyIteratorPerDate];
                }


                this.exerciseRepsPerEntryAverage[exerciseId] = this.exerciseTotalReps[exerciseId] / this.exerciseEntryCount[exerciseId];

                //set correct exercise names in history
                if (this.exerciseList[exerciseId].deleted) {
                    this.history[historyDate].exName[historyIteratorPerDate] += " [gelöscht]";
                }
                else {
                    this.history[historyDate].exName[historyIteratorPerDate] = this.exerciseList[exerciseId].name;
                }
                //MAINENANCE CODE - DELETE AFTER START UP
                if (this.history[historyDate].exUnit == undefined) {
                    this.history[historyDate].exUnit = [this.exerciseList[exerciseId].unit];
                }
                else if (this.history[historyDate].exUnit[historyIteratorPerDate] == undefined) {
                    this.history[historyDate].exUnit.push(this.exerciseList[exerciseId].unit);
                }

                //MAINENANCE CODE - DELETE AFTER START UP

                if (this.monthlyDataExercise[currentDateInfo.currentMonthName] == undefined) {
                    let newData = {};
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    newData[exerciseId] = newPlayerData;
                    this.monthlyDataExercise[currentDateInfo.currentMonthName] = newData;
                }
                else if (this.monthlyDataExercise[currentDateInfo.currentMonthName][exerciseId] == undefined) {
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    this.monthlyDataExercise[currentDateInfo.currentMonthName][exerciseId] = newPlayerData;
                }
                else if (this.monthlyDataExercise[currentDateInfo.currentMonthName][exerciseId][historyName] == undefined) {
                    this.monthlyDataExercise[currentDateInfo.currentMonthName][exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                }
                else {
                    this.monthlyDataExercise[currentDateInfo.currentMonthName][exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                }

                //CATEGORY

                if (this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName] == undefined) {
                    let newData = {};
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    newData[exCategory] = newPlayerData;
                    this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName] = newData;
                }
                else if (this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName][exCategory] == undefined) {
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName][exCategory] = newPlayerData;
                }
                else if (this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName][exCategory][historyName] == undefined) {
                    this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName][exCategory][historyName] = historyEntry.count[historyIteratorPerDate];
                }
                else {
                    this.monthlyDataExerciseCategory[currentDateInfo.currentMonthName][exCategory][historyName] += historyEntry.count[historyIteratorPerDate];
                }

                // DAILY DATA EXERCISE
                if (this.dailyDataExercise[currentDateInfo.historyDateString] == undefined) {
                    let newData = {};
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    newData[exerciseId] = newPlayerData;
                    this.dailyDataExercise[currentDateInfo.historyDateString] = newData;
                }
                else if (this.dailyDataExercise[currentDateInfo.historyDateString][exerciseId] == undefined) {
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    this.dailyDataExercise[currentDateInfo.historyDateString][exerciseId] = newPlayerData;
                }
                else if (this.dailyDataExercise[currentDateInfo.historyDateString][exerciseId][historyName] == undefined) {
                    this.dailyDataExercise[currentDateInfo.historyDateString][exerciseId][historyName] = historyEntry.count[historyIteratorPerDate];
                }
                else {
                    this.dailyDataExercise[currentDateInfo.historyDateString][exerciseId][historyName] += historyEntry.count[historyIteratorPerDate];
                }

                //CATEGORY

                if (this.dailyDataExerciseCategory[currentDateInfo.historyDateString] == undefined) {
                    let newData = {};
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    newData[exCategory] = newPlayerData;
                    this.dailyDataExerciseCategory[currentDateInfo.historyDateString] = newData;
                }
                else if (this.dailyDataExerciseCategory[currentDateInfo.historyDateString][exCategory] == undefined) {
                    let newPlayerData = {};
                    newPlayerData[historyName] = historyEntry.count[historyIteratorPerDate];
                    this.dailyDataExerciseCategory[currentDateInfo.historyDateString][exCategory] = newPlayerData;
                }
                else if (this.dailyDataExerciseCategory[currentDateInfo.historyDateString][exCategory][historyName] == undefined) {
                    this.dailyDataExerciseCategory[currentDateInfo.historyDateString][exCategory][historyName] = historyEntry.count[historyIteratorPerDate];
                }
                else {
                    this.dailyDataExerciseCategory[currentDateInfo.historyDateString][exCategory][historyName] += historyEntry.count[historyIteratorPerDate];
                }

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

                //exercise points per player
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
                //exercise counts per month
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

                //exercise counts per Daily
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

                //exercise counts per Overall
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

                //exercise counts to global property
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
                        this.maxExerciseCounts[exerciseId].daily[historyName] = maxExerciseCountsDaily[exerciseId][historyName];
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].daily[historyName] < maxExerciseCountsDaily[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].daily[historyName] = maxExerciseCountsDaily[exerciseId][historyName];
                        }
                    }

                    if (this.maxExerciseCounts[exerciseId].monthly[historyName] == undefined) {
                        this.maxExerciseCounts[exerciseId].monthly[historyName] = maxExerciseCountsMonthly[exerciseId][historyName];
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].monthly[historyName] < maxExerciseCountsMonthly[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].monthly[historyName] = maxExerciseCountsMonthly[exerciseId][historyName];
                        }
                    }


                    if (this.maxExerciseCounts[exerciseId].overall[historyName] == undefined) {
                        this.maxExerciseCounts[exerciseId].overall[historyName] = maxExerciseCountsOverall[exerciseId][historyName];
                    }
                    else {
                        if (this.maxExerciseCounts[exerciseId].overall[historyName] < maxExerciseCountsOverall[exerciseId][historyName]) {
                            this.maxExerciseCounts[exerciseId].overall[historyName] = maxExerciseCountsOverall[exerciseId][historyName];
                        }
                    }
                }




                //exercise counts per exercise-category monthly
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

                //exercise counts per exercise-category Daily
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

                //exercise counts per exercise-category overall
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

                //exercise counts per exercise-category to global property
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
                        this.maxExerciseCountsCategory[exCategory].daily[historyName] = maxExerciseCountsCategoryDaily[exCategory][historyName];
                    }
                    else {
                        if (this.maxExerciseCountsCategory[exCategory].daily[historyName] < maxExerciseCountsCategoryDaily[exCategory][historyName]) {
                            this.maxExerciseCountsCategory[exCategory].daily[historyName] = maxExerciseCountsCategoryDaily[exCategory][historyName];
                        }
                    }

                    if (this.maxExerciseCountsCategory[exCategory].monthly[historyName] == undefined) {
                        this.maxExerciseCountsCategory[exCategory].monthly[historyName] = maxExerciseCountsCategoryMonthly[exCategory][historyName];
                    }
                    else {
                        if (this.maxExerciseCountsCategory[exCategory].monthly[historyName] < maxExerciseCountsCategoryMonthly[exCategory][historyName]) {
                            this.maxExerciseCountsCategory[exCategory].monthly[historyName] = maxExerciseCountsCategoryMonthly[exCategory][historyName];
                        }
                    }

                    if (this.maxExerciseCountsCategory[exCategory].overall[historyName] == undefined) {
                        this.maxExerciseCountsCategory[exCategory].overall[historyName] = maxExerciseCountsCategoryOverall[exCategory][historyName];
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

                //points
                if (historyEntry.points[historyIteratorPerDate] < 0) {
                    if (dailySumNegative[historyName] == undefined) {
                        dailySumNegative[historyName] = historyEntry.points[historyIteratorPerDate];
                    }
                    else {
                        dailySumNegative[historyName] += historyEntry.points[historyIteratorPerDate];
                    }
                }
                else {
                    if (dailySum[historyName] == undefined) {
                        dailySum[historyName] = historyEntry.points[historyIteratorPerDate];
                    }
                    else {
                        dailySum[historyName] += historyEntry.points[historyIteratorPerDate];
                    }
                }

                if (dailySum[historyName] > this.registeredPlayers[historyName].points.dailyMax) {
                    var negative = 0;
                    if (dailySumNegative[historyName] != undefined) {
                        negative = dailySumNegative[historyName];
                    }
                    this.registeredPlayers[historyName].points.dailyMax = dailySum[historyName] + negative;
                }

                if (dailySumWithNegative[historyName] == undefined) {
                    dailySumWithNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                }
                else {
                    dailySumWithNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                }

                if (this.exerciseList[exerciseId].type === "Cardio") {
                    if (dailyCardio[historyName] == undefined) {
                        dailyCardio[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        dailyCardio[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }

                    this.registeredPlayers[historyName].points.cardio += Number(historyEntry.points[historyIteratorPerDate]);
                    if (monthlyCardioSum[historyName] == undefined) {
                        monthlyCardioSum[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        monthlyCardioSum[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }
                }
                else if (this.exerciseList[exerciseId].type === "Kraft") {
                    if (dailyStrength[historyName] == undefined) {
                        dailyStrength[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        dailyStrength[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    this.registeredPlayers[historyName].points.strength += Number(historyEntry.points[historyIteratorPerDate]);
                    if (monthlyStrengthSum[historyName] == undefined) {
                        monthlyStrengthSum[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
                    }
                    else {
                        monthlyStrengthSum[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    }
                }
                this.registeredPlayers[historyName].points.total += Number(historyEntry.points[historyIteratorPerDate]);

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
                    let negative = 0;
                    if (monthlyNegative[historyName] != undefined) {
                        negative = monthlyNegative[historyName];
                    }
                    this.registeredPlayers[historyName].points.monthlyMax = monthlySum[historyName] + negative;
                }


                if (currentDateInfo.isLast5Days) {
                    this.registeredPlayers[historyName].points.last5Days += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (currentDateInfo.isToday) {
                    this.registeredPlayers[historyName].points.today += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (Number(historyEntry.points[historyIteratorPerDate]) < 0) {
                    this.registeredPlayers[historyName].points.negative += Math.abs(Number(historyEntry.points[historyIteratorPerDate]));
                }
                if (currentDateInfo.isThisMonth) {
                    this.registeredPlayers[historyName].points.thisMonth += Number(historyEntry.points[historyIteratorPerDate]);
                }
                if (currentDateInfo.isLastMonth) {
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
            this.history[historyDate].dailySum = dailySumWithNegative;

            let max = 100;
            var dailyWinner = "Keiner";
            for (let playerName in this.registeredPlayers) {
                if (this.history[historyDate].dailySum[playerName] != undefined) {
                    if (this.history[historyDate].dailySum[playerName] > max) {
                        max = this.history[historyDate].dailySum[playerName];
                        dailyWinner = playerName;
                    }
                }
                else {
                    this.history[historyDate].dailySum[playerName] = 0;
                }

                if (dailyCardio[playerName] == undefined) {
                    dailyCardio[playerName] = 0;
                }
                if (dailyStrength[playerName] == undefined) {
                    dailyStrength[playerName] = 0;
                }


                if (xAxis[playerName] == undefined) {
                    xAxis[playerName] = [this.registeredPlayers[playerName].points.total];
                }
                else {
                    xAxis[playerName].push(this.registeredPlayers[playerName].points.total);
                }
                if (xAxisCardio[playerName] == undefined) {
                    xAxisCardio[playerName] = [this.registeredPlayers[playerName].points.cardio];
                }
                else {
                    xAxisCardio[playerName].push(this.registeredPlayers[playerName].points.cardio);
                }

                if (xAxisStrength[playerName] == undefined) {
                    xAxisStrength[playerName] = [this.registeredPlayers[playerName].points.strength];
                }
                else {
                    xAxisStrength[playerName].push(this.registeredPlayers[playerName].points.strength);
                }

                //With Reset
                if (xAxisDailyReset[playerName] == undefined) {
                    xAxisDailyReset[playerName] = [this.history[historyDate].dailySum[playerName]];
                }
                else {
                    xAxisDailyReset[playerName].push(this.history[historyDate].dailySum[playerName]);
                }
                if (xAxisDailyResetCardio[playerName] == undefined) {
                    xAxisDailyResetCardio[playerName] = [dailyCardio[playerName]];
                }
                else {
                    xAxisDailyResetCardio[playerName].push(dailyCardio[playerName]);
                }

                if (xAxisDailyResetStrength[playerName] == undefined) {
                    xAxisDailyResetStrength[playerName] = [dailyStrength[playerName]];
                }
                else {
                    xAxisDailyResetStrength[playerName].push(dailyStrength[playerName]);
                }

                this.fullGraph[playerName] = {
                    xAxis: xAxis[playerName],
                    yAxis: yAxis
                };
                this.fullCardioGraph[playerName] = {
                    xAxis: xAxisCardio[playerName],
                    yAxis: yAxis
                };
                this.fullStrengthGraph[playerName] = {
                    xAxis: xAxisStrength[playerName],
                    yAxis: yAxis
                };

                this.fullDailyResetGraph[playerName] = {
                    xAxis: xAxisDailyReset[playerName],
                    yAxis: yAxis
                };
                this.fullDailyResetCardioGraph[playerName] = {
                    xAxis: xAxisDailyResetCardio[playerName],
                    yAxis: yAxis
                };
                this.fullDailyResetStrengthGraph[playerName] = {
                    xAxis: xAxisDailyResetStrength[playerName],
                    yAxis: yAxis
                };
            }
            let lastWinner = this.history[historyDate].dailyWinner;

            if (dailyWinner == undefined) dailyWinner = "Keiner";
            if (lastWinner == undefined) lastWinner = "Keiner";

            if (lastWinner != dailyWinner) {
                let msg;
                if (dailyWinner == "Keiner" && lastWinner != "Keiner") {
                    msg = common.HTMLColor("Der Tagessieg von " + common.HTMLBold(lastWinner) + " am " + common.HTMLBold(historyDate) + " ist wieder frei!", "red");
                    this.addToEventLog(msg);
                }
                if (dailyWinner != "Keiner" && lastWinner == "Keiner") {
                    msg = common.HTMLColor("Der Tagessieg am " + common.HTMLBold(historyDate) + " geht bis jetzt an " + common.HTMLBold(dailyWinner), "red");
                    this.addToEventLog(msg);
                }
                else if (dailyWinner != "Keiner" && lastWinner != "Keiner") {
                    msg = common.HTMLColor("Der Tagessieg von " + common.HTMLBold(lastWinner) + " am " + common.HTMLBold(historyDate) + " geht nun an " + common.HTMLBold(dailyWinner), "red");
                    this.addToEventLog();
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
            dailyStrength = {};
            dailyCardio = {};
            dailySumNegative = {};
            dailySumWithNegative = {};

            this.monthlyData[currentDateInfo.currentMonthName] = monthlySumWithNegative;

            this.monthlyCardioData[currentDateInfo.currentMonthName] = monthlyCardioSum;
            this.monthlyStrengthData[currentDateInfo.currentMonthName] = monthlyStrengthSum;
        } //END FOR

        for (let playerName in this.registeredPlayers) {
            if (this.monthlyWins[playerName] == undefined) {
                this.monthlyWins[playerName] = 0;
            }
            if (this.dailyWins[playerName] == undefined) {
                this.dailyWins[playerName] = 0;
            }
            for (let monthName in this.monthlyData) {
                if (this.monthlyData[monthName][playerName] == undefined) {
                    this.monthlyData[monthName][playerName] = 0;
                }
                if (this.monthlyCardioData[monthName][playerName] == undefined) {
                    this.monthlyCardioData[monthName][playerName] = 0;
                }
                if (this.monthlyStrengthData[monthName][playerName] == undefined) {
                    this.monthlyStrengthData[monthName][playerName] = 0;
                }
            }


            this.registeredPlayers[playerName].points.cardioStrengthRatio = calc.calculateCardioStrengthPercents(this.registeredPlayers[playerName].points.cardio, this.registeredPlayers[playerName].points.strength);

        }

        this.needsUpload.dataStorage = true;

        let end = Date.now();
        result(`full refresh took ${end - start} ms`);
    }

}

module.exports = FitnessManager;