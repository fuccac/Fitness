// @ts-check
/*jshint esversion: 6 */

const Challenge = require("./Challenge");

/*jshint esversion: 6 */
var Exercise = require("./Exercise");
var Calc = require("./calc");
var Common = require("../client/js/common");
var Log = require("./Log");
var Config = require("./Config");


var achievementList = require("../saves/config/achievementList.json");

var logFile = new Log();
var calc = new Calc();
var common = new Common();
var config = new Config();

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
        this.colorList = {};
        this.totalHistoryEntries = 0;
        this.featuredExerciseDate = common.createViennaDate();

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
        this.fullGroupGraph = {};
        this.fullGroupCardioGraph = {};
        this.fullGroupStrengthGraph = {};

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
        this.featuredExerciseId = ""
        this.favoriteExercises = {};


        //WORK OBJECTS WITH SAVE FILE SUPPORT
        this.challengeList = {};
        this.registeredPlayers = {};
        this.history = {};
        this.exerciseList = {};
        this.eventLog = {
            time: [],
            msg: [],
            html: ""
        };
        this.paceUnits = "min/km;min/m;Wdh/min;Wdh/sec;Hoehenmeter/min";
        this.paceInvert = "0;0;1;1;1";

    }


    //************************************************************/
    //*********************Exercise Handling**********************/
    //************************************************************/

    cleanExerciseList() {
        for (let exId in this.exerciseList) {
            this.exerciseList[exId].points = 0;
            this.exerciseList[exId].pointsPerPlayer = {};
            this.exerciseList[exId].repsPerPlayer = {};
        }
    }
    featureNewExercise() {
        let randomNumber = Math.floor(Math.random() * Object.keys(this.exerciseList).length);
        let counter = 0;
        for (let exId in this.exerciseList) {
            if (counter == randomNumber) {
                if (this.exerciseList[exId].factor > 0 && this.exerciseList[exId].deleted == false) {
                    this.featuredExerciseId = exId;
                    this.featuredExerciseDate = common.createViennaDate();
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

    getDailyWinner(date) {
        let historyDate = common.getDateFormat(common.createZeroDate(date), "YYYY-MM-DD");
        try {
            return this.history[historyDate].dailyWinner;
        }
        catch (e) {
            return "Keiner";
        }

    }

    hideExercise(id, playerName, result) {
        if (this.exerciseList[id] != undefined) {
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

        var achievementInfo = {
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

        this.needsUpload.dataStorage = true;
    }

    addExercise(exercise) {
        this.exerciseList[exercise.id] = exercise;
        this.exerciseCount++;
        this.needsUpload.dataStorage = true;
        return "add Exercise finished";
    }

    createExercise(exPack, usesWeight, creator, result) {
        this.addToEventLog(creator + " erstellt eine neue Übung: '" + common.HTMLBold(exPack.name) + "'");
        if (exPack.calcMethod == "" || exPack.calcMethod == undefined) {
            exPack.calcMethod = "Standard";
        }
        for (let exerciseKey in exPack) {
            if (exerciseKey.toLowerCase() == "name" || exerciseKey.toLowerCase() == "id" || exerciseKey.toLowerCase() == "paceunitoptions") {
                continue;
            }
            let currentKey = exPack[exerciseKey];
            this.addToEventLog(common.HTMLBold(common.translate(exerciseKey)) + ": '" + common.HTMLBold(common.translate(currentKey)) + "'");
        }

        result(this.addExercise(new Exercise(exPack.name, exPack.difficulty, exPack.difficulty10, exPack.difficulty100, exPack.paceConstant, exPack.isPaceExercise, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit, exPack.bothSides, exPack.calcMethod)));
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
            calcMethod: false,
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
        this.exerciseList[data.id].calcMethod = data.calcMethod;

        calc.calculateNewFactor(this.exerciseList[data.id]);
        this.addToEventLog("Resultierender neuer Faktor: '" + common.HTMLBold(this.exerciseList[data.id].factor) + "'");

        result("editExercise done");
    }

    removeExercise(id) {
        delete this.exerciseList[id];
        this.exerciseCount--;

    }

    deleteExercise(id, result) {
        let name = this.exerciseList[id].name;
        if (this.exerciseList[id].points == undefined) {
            delete this.exerciseList[id];
            this.exerciseCount--;
        }
        else {
            if (this.exerciseList[id].points == 0) {
                delete this.exerciseList[id];
                this.exerciseCount--;
            }
            else {
                this.exerciseList[id].deleted = true;

            }
        }

        result(name);


    }

    //************************************************************/
    //*******************History Handling*************************/
    //************************************************************/

    addEmptyHistoryEntry(date) {

        date = common.createZeroDate(date);
        date = common.getDateFormat(date, "YYYY-MM-DD");
        if (this.history[date] != undefined) {
            return;
        }
        var newHistoryEntry = {
            id: [],
            date: [],
            playerName: [],
            exName: [],
            count: [],
            points: [],
            weight: [],
            exerciseId: [],
            dailySum: [],
            pace: [],
            countAdditional: [],
            exUnit: [],
            atOnce: [],
            dailyWinner: "Keiner"
        };

        this.history[date] = newHistoryEntry;
        this.needsUpload.dataStorage = true;
    }

    deleteHistory(id, date, result) {
        var deleter = "";
        var exercise = "";
        var exerciseIdToRecalculate;
        var debug = 0;

        if (!debug) {
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


                    this.addToEventLog(deleter + " entfernt einen Eintrag aus seiner/ihrer History: " + exercise + " am " + date);

                    result("deleted History Entry: " + exerciseIdToRecalculate);
                    return;

                }
            }
        }


        //History Entry not found..  search through all dates
        logFile.log("History Entry not found..  search through all dates", false, 0);
        for (let historyDate in this.history) {
            for (let historyEntryIterator in this.history[historyDate].id) {
                if (this.history[historyDate].id[historyEntryIterator] == id) {
                    deleter = this.history[historyDate].playerName[historyEntryIterator];
                    exercise = this.history[historyDate].exName[historyEntryIterator];
                    exerciseIdToRecalculate = this.history[historyDate].exerciseId[historyEntryIterator];
                    this.exerciseList[exerciseIdToRecalculate].repsPerPlayer[this.history[historyDate].playerName[historyEntryIterator]] -= this.history[historyDate].count[historyEntryIterator];
                    this.exerciseList[exerciseIdToRecalculate].pointsPerPlayer[this.history[historyDate].playerName[historyEntryIterator]] -= this.history[historyDate].points[historyEntryIterator];
                    this.exerciseList[exerciseIdToRecalculate].points -= this.history[historyDate].points[historyEntryIterator];
                    this.history[historyDate].dailySum[this.history[historyDate].playerName[historyEntryIterator]] -= this.history[historyDate].points[historyEntryIterator];

                    for (let historyEntry in this.history[historyDate]) {
                        if (historyEntry != "dailySum" && historyEntry != "dailyWinner") {
                            this.history[historyDate][historyEntry].splice(historyEntryIterator, 1);
                        }
                    }

                    this.addToEventLog(deleter + " entfernt einen Eintrag aus seiner/ihrer History: " + exercise + " am " + historyDate);

                    result("deleted History Entry: " + exerciseIdToRecalculate);
                    return;

                }
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
            return common.createZeroDate(a[0]).getTime() - common.createZeroDate(b[0]).getTime();
        });
        for (let iterator = 0; iterator < sortable.length; iterator++) {
            historyChunk[iterator] = sortable[iterator][1];
        }
        return historyChunk;
    }

    addToHistory(id, playerName, exerciseId, weight, count, countAdditional, date, atOnce, result) {
        let calcMethod = "Standard";
        if (this.exerciseList[exerciseId].calcMethod != undefined) {
            calcMethod = this.exerciseList[exerciseId].calcMethod;
        }

        if (calcMethod.toLowerCase().search("#") == -1) {
            atOnce = false;
        }

        if (countAdditional == "" || countAdditional == undefined) {
            countAdditional = undefined;
        }
        var pace = {};

        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
            weight = 0;
        }
        date = common.createZeroDate(date);
        date = common.getDateFormat(date, "YYYY-MM-DD");
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count, countAdditional, pace, atOnce, this.registeredPlayers[playerName].points.powerFactor);

        let doubleTimeMessage = "";
        if (this.featuredExerciseId == exerciseId) {
            //doubleTime
            points *= 2;
            doubleTimeMessage = "+ Double Time Bonus";

        }
        if (this.history[date] != undefined) {
            for (let iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId &&
                    this.history[date].weight[iterator] == weight &&
                    this.history[date].playerName[iterator].toUpperCase() == playerName.toUpperCase() &&
                    countAdditional == undefined &&
                    this.history[date].atOnce[iterator] == false &&
                    atOnce == false) {

                    //HISTORY ENTRY IS AVAILABLE - AND NEW ENTRY IS STACKABLE! 
                    this.history[date].count[iterator] += Number(count);
                    this.history[date].points[iterator] += Number(points);
                    this.history[date].dailySum[playerName] += Number(points);
                    this.history[date].countAdditional[iterator] = 0;
                    this.history[date].pace[iterator] = "-";
                    this.history[date].exUnit[iterator] = this.exerciseList[exerciseId].unit;
                    this.history[date].atOnce[iterator] = false;
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

            this.history[date].atOnce.push(atOnce);

        }
        else {
            //HISTORY ENTRY IS NOT AVAILABLE - CREATING
            var newId = [], newDate = [], newPlayerName = [], newExName = [], newCount = [], newPoints = [], newWeight = [], newExerciseId = [], newDailySum = {}, newPace = [], newCountAdditional = [], newUnit = [], newAtOnce = [];
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
            newAtOnce.push(atOnce);

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
                atOnce: newAtOnce,
            };
            this.history[date] = newHistoryEntry;
        }
        if (atOnce) {
            this.addToEventLog(playerName + " hat etwas am " + date + common.HTMLBold(" -auf einmal- gemacht: ") + count + " " + this.exerciseList[exerciseId].name + " (" + Number(points).toFixed(2) + " Punkte " + doubleTimeMessage + ")");
        }
        else {
            this.addToEventLog(playerName + " hat etwas am " + date + " gemacht: " + count + " " + this.exerciseList[exerciseId].name + " (" + Number(points).toFixed(2) + " Punkte " + doubleTimeMessage + ")");
        }

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
        var usedGraph = {};
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
        else if (type == "line-day-group") {
            if (pointType == "cardio") {
                usedGraph = this.fullGroupCardioGraph;
            }
            else if (pointType == "strength") {
                usedGraph = this.fullGroupStrengthGraph;
            }
            else {
                usedGraph = this.fullGroupGraph;
            }
        }


        if (type == "line-day-group") {
            let currentGraph = {};
            currentGraph.xAxis = usedGraph.xAxis;
            currentGraph.yAxis = usedGraph.yAxis;

            if (currentGraph.xAxis != undefined && currentGraph.yAxis != undefined) {
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
                resultGraph = {
                    yAxis: currentGraph.yAxis.slice(firstIndex, lastIndex + 1),
                    xAxis: currentGraph.xAxis.slice(firstIndex, lastIndex + 1)
                };
            }
        }
        else {
            for (let playerName in usedGraph) {
                let currentGraph = usedGraph[playerName];
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

    //************************************************************/
    //*******************Other Handling***************************/
    //************************************************************/

    createChallenge(id, dateStart, dateEnd, challengeName, toDo, creator) {
        dateStart = common.createZeroDate(dateStart);
        dateEnd = common.createZeroDate(dateEnd);
        this.addChallenge(new Challenge(challengeName, id, dateStart, dateEnd, toDo, creator))
    }

    finishChallenge(id, result) {
        this.challengeList[id].finished = true
        let winners = []

        for (let playerName in this.challengeList[id].progress) {
            if (this.challengeList[id].progress[playerName].percent >= 100) {
                winners.push(playerName)
            }
        }
        this.addToEventLog("#######################");
        this.addToEventLog("Die Challenge '" + this.challengeList[id].name + "' wurde beendet.");
        this.addToEventLog("Erfolgreich abgeschlossen haben:");

        for (let playerCount = 0; playerCount < winners.length; playerCount++) {
            this.addToEventLog(winners[playerCount]);
            this.registeredPlayers[winners[playerCount]].points.challengeWins += 1;
        }

        this.addToEventLog("#######################");

        this.needsUpload.dataStorage = true;
        result("challenge" + id + " finished")


    }

    addChallenge(challenge) {
        this.challengeList[challenge.id] = challenge;

        this.updateChallengeHTML(function (result) {
            this.addToEventLog(challenge.creator + " hat eine neue Challenge eingetragen:");
            this.addToEventLog("Name : " + challenge.name);
            this.addToEventLog("Start: " + challenge.startDate);
            this.addToEventLog("Ende : " + challenge.endDate);
            this.addToEventLog("Anzahl : " + challenge.toDo);
            this.addToEventLog("Viel Erfolg!");
            logFile.log(result, false, 0);
            return "add Challenge finished";
        }.bind(this));
    }

    updateChallengeHTML(result) {
        let start = Date.now();
        let part1 = "<div id=\"div_challengeId\"><h3>ChallengeName (Count - Exercises)</h3>"
        let partPlayer = "<label>PlayerName: <progress id=\"PlayerNameProgress\" percentValue max=\"100\" class=\"challengeProgress\" style=\"background-color=playerColor\"></label><br>"
        let partEnd = "</div><button id=\"adminButton_endChallenge\" class=\"adminControls\" onclick=\"endChallenge(challengeId)\">Beenden</button>"
        let html = ""

        if (Object.keys(this.challengeList).length > 0) {
            for (let challengeId in this.challengeList) {
                if (!this.challengeList[challengeId].finished) {

                    html = part1.replace("challengeId", challengeId.toString())
                    html = html.replace("ChallengeName", this.challengeList[challengeId].name.toString())
                    html = html.replace("Count", this.challengeList[challengeId].toDo.toString())
                    let exerciseText = ""
                    for (let i = 0; i < this.challengeList[challengeId].exerciseList.length; i++) {
                        exerciseText = exerciseText + this.exerciseList[this.challengeList[challengeId].exerciseList[i]].name
                        if (i + 1 < this.challengeList[challengeId].exerciseList.length) {
                            exerciseText = exerciseText + ", "
                        }
                    }
                    html = html.replace("Exercises", exerciseText)
                    for (let playerName in this.challengeList[challengeId].progress) {
                        html = html + partPlayer
                        html = html.replace("PlayerNameProgress", playerName + "Progress")
                        html = html.replace("percentValue", "value=\"" + this.challengeList[challengeId].progress[playerName].percent + "\"")
                        html = html.replace("PlayerName", common.HTMLColor(playerName, this.colorList[playerName]) + " (" + this.challengeList[challengeId].progress[playerName].done.toString() + ")")
                        html = html.replace("playerColor", this.colorList[playerName])
                    }
                    partEnd = partEnd.replace("challengeId", "'" + challengeId.toString() + "'")
                    html = html + partEnd
                    this.challengeList[challengeId].html = html
                }
            }

        }

        let end = Date.now();
        this.needsUpload.dataStorage = true;
        result(`updateChallengeHTML done in ${end - start}`);
    }



    checkPlayerStuff(player, playerStuffResult) {
        let start = Date.now()
        logFile.log("checkPlayerStuff started for player " + player.name, false, 0);
        //USAGE: After a clean calculation via FullRefresh
        this.updateChallengeHTML(function (result) {
            logFile.log(result, false, 0);
            this.setBestExerciserNumber(player, function (result) {
                logFile.log(result, false, 0);
            }.bind(this));
        }.bind(this));

    }


    addToEventLog(msg) {

        for (let playerName in this.colorList) {
            if (msg.includes(playerName)) {
                msg = msg.replace(playerName, common.HTMLColor(playerName, this.colorList[playerName]));
            }
        }

        var date = common.createViennaDate();
        var seconds = date.getSeconds().toString();
        var minutes = date.getMinutes().toString();
        var hours = date.getHours().toString();

        if (Number(seconds) < 10) {
            seconds = "0" + seconds.toString();
        }
        if (Number(minutes) < 10) {
            minutes = "0" + minutes.toString();
        }
        if (Number(hours) < 10) {
            hours = "0" + hours.toString();
        }

        if ((this.eventLog.time.length > config.EVENTLOG_MAX || this.eventLog.msg.length > config.EVENTLOG_MAX)) {
            this.eventLog.time = this.eventLog.time.slice(this.eventLog.time.length - config.EVENTLOG_MAX + 1);
            this.eventLog.msg = this.eventLog.msg.slice(this.eventLog.msg.length - config.EVENTLOG_MAX + 1);
            this.eventLog.html = ""
            this.createHTMLEventLog()
        }
        this.eventLog.time.push(common.getDateFormat(date, "DD.MM.YYYY") + " | " + hours + ":" + minutes + ":" + seconds);
        this.eventLog.msg.push(msg);
        this.eventLog.html = this.eventLog.html + "<li>" + this.eventLog.time[this.eventLog.time.length - 1] + " - " + this.eventLog.msg[this.eventLog.msg.length - 1] + "</li>";

        this.needsUpload.dataStorage = true;
    }

    updateEventLogColor(name, newColor) {
        let regString = '<span style="color:#[a-zA-Z,0-9]{6}">' + name;
        let matcher = new RegExp(regString, "g");
        let newTerm = common.HTMLColor(name, newColor);
        for (let eventIterator = 0; eventIterator < this.eventLog.msg.length; eventIterator++) {
            if (this.eventLog.msg[eventIterator].match(matcher)) {
                this.eventLog.msg[eventIterator] = this.eventLog.msg[eventIterator].replace(matcher, newTerm);
            }
            else if (this.eventLog.msg[eventIterator].includes(name)) {
                this.eventLog.msg[eventIterator] = this.eventLog.msg[eventIterator].replace(name, newTerm);
            }
            else {
                continue;
            }
        }
        this.eventLog.html = this.eventLog.html.replace(matcher, newTerm);
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
                seasonWins: 0,
                powerFactor: 1,
                toDoForFactor: 0,
                achievementPoints: 0,
                challengeWins: 0
            }
        };
        this.registeredPlayers[name] = data;
        this.dailyWins[name] = 0;
        this.needsUpload.dataStorage = true;
    }


    archiveHistory() {
        this.fullRefresh

    }


    fullRefresh(fullRefreshResult) {
        let start = Date.now();
        var chunk = this.getDefinedHistory(new Date("01/08/2000"), new Date("01/08/9999"));


        // ##########################################
        //          Resetting
        // ##########################################


        //graph
        var xAxis = {}; //points
        var xAxisCardio = {}; //points
        var xAxisStrength = {}; //points
        var xAxisDailyReset = {}; //points
        var xAxisDailyResetCardio = {}; //points
        var xAxisDailyResetStrength = {}; //points
        var xAxisGroup = []; //points
        var xAxisGroupCardio = []; //points
        var xAxisGroupStrength = []; //points
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
        this.favoriteExercises = {};

        //points
        this.dailyWins = {};
        this.monthlyWins = {};
        this.maxExerciseCountsCategory = {};
        this.monthlyDataExercise = {};
        this.monthlyDataExerciseCategory = {};
        this.dailyDataExercise = {};
        this.dailyDataExerciseCategory = {};

        var todayDate = common.createZeroDate();
        var currentMonth = 0;
        var currentYear = 0;

        var sumPointsLastMonth = {};
        var monthlySum = {};
        var monthlyNegative = {};
        var monthlySumWithNegative = {};
        var monthlyCardioSum = {};
        var monthlyStrengthSum = {};
        var dailySum = {};
        var dailyCardio = {};
        var dailyStrength = {};
        var dailySumGroup = 0;
        var dailyCardioGroup = 0;
        var dailyStrengthGroup = 0;
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
        var last4Days = {};

        //challenge reset
        for (let challengeId in this.challengeList) {
            let challenge = this.challengeList[challengeId];
            for (let name in challenge.progress) {
                challenge.progress[name].done = 0;
                challenge.progress[name].percent = 0;
            }
        }

        //registered players
        for (let playerName in this.registeredPlayers) {

            let seasonWins = this.registeredPlayers[playerName].points.seasonWins;
            if (seasonWins == undefined) {
                seasonWins = 0;
            }

            let achievementPoints = this.registeredPlayers[playerName].points.achievementPoints;
            if (achievementPoints == undefined) {
                achievementPoints = 0;
            }

            let challengeWins = this.registeredPlayers[playerName].points.challengeWins;
            if (challengeWins == undefined) {
                challengeWins = 0;
            }



            let powerFactor = this.registeredPlayers[playerName].points.powerFactor;
            if (powerFactor == undefined) {
                powerFactor = 1;
            }



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
                    seasonWins: seasonWins,
                    powerFactor: powerFactor,
                    toDoForFactor: 0,
                    achievementPoints: 0,
                    challengeWins: 0
                }
            };
            this.registeredPlayers[playerName] = data;

            this.dailyWins[playerName] = 0;
            this.monthlyWins[playerName] = 0;
        }


        if (chunk.length == 0) {
            fullRefreshResult("chunk.length == 0 in 'full refresh - abort");
            return;
        }
        var lastDate = common.createZeroDate(chunk[0].date[0]);

        // ##########################################
        //          RUN THROUGH HISTORY
        // ##########################################
        for (let overallIterator = 0; overallIterator < chunk.length; overallIterator++) {
            var historyDate = chunk[overallIterator].date[0];
            var historyEntry = this.history[historyDate];
            if (historyDate == undefined) {
                continue;
            }

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
                            xAxisGroup.push(0);
                            xAxisGroupCardio.push(0);
                            xAxisGroupStrength.push(0);
                        }
                        iteratorDate.setDate(iteratorDate.getDate() + 1);
                    }
                    playerCount++;
                }
            }

            yAxis.push(historyDate);
            lastDate = currentDate; //remember last Date

            // ##########################################
            //        RUN THROUGH HISTORY ENTRY
            // ##########################################
            for (let historyIteratorPerDate = 0; historyIteratorPerDate < historyEntry.playerName.length; historyIteratorPerDate++) {
                // ENTRIES INSIDE DATE
                // common
                var historyName = historyEntry.playerName[historyIteratorPerDate];
                var exerciseId = historyEntry.exerciseId[historyIteratorPerDate];
                var exCategory = this.exerciseList[exerciseId].achievementInfo.achievementCategory;

                //challenge check
                for (let challengeId in this.challengeList) {
                    let challenge = this.challengeList[challengeId];
                    if (!challenge.finished) {
                        if (common.createZeroDate(challenge.startDate) <= currentDate && common.createZeroDate(challenge.endDate) >= currentDate) {
                            for (let i = 0; i < challenge.exerciseList.length; i++) {
                                if (exerciseId == challenge.exerciseList[i]) {
                                    //date and exercise valid for this challenge
                                    if (challenge.progress[historyName] != undefined) {
                                        challenge.progress[historyName].done += Number(historyEntry.count[historyIteratorPerDate]);
                                        challenge.progress[historyName].percent = Math.min((Number(challenge.progress[historyName].done) / Number(challenge.toDo)) * 100, 100)
                                    }
                                    else {
                                        var newProgress = {
                                            percent: Math.min((Number(historyEntry.count[historyIteratorPerDate]) / Number(challenge.toDo)) * 100, 100),
                                            done: historyEntry.count[historyIteratorPerDate],
                                        }
                                        challenge.progress[historyName] = newProgress;
                                    }

                                    if (challenge.progress[historyName].percent >= 100) {
                                        //this.finishChallenge(challenge.id)
                                        //100% reached - 
                                        challenge.progress[historyName].percent = 100
                                    }
                                }
                            }
                        }
                    }
                }

                this.totalHistoryEntries++;

                this.exerciseEntryCount[exerciseId] != undefined ? this.exerciseEntryCount[exerciseId]++ : this.exerciseEntryCount[exerciseId] = 1
                this.exerciseTotalReps[exerciseId] != undefined ? this.exerciseTotalReps[exerciseId] += historyEntry.count[historyIteratorPerDate] : this.exerciseTotalReps[exerciseId] = historyEntry.count[historyIteratorPerDate]

                this.exerciseRepsPerEntryAverage[exerciseId] = this.exerciseTotalReps[exerciseId] / this.exerciseEntryCount[exerciseId];

                //set correct exercise names in history
                if (this.exerciseList[exerciseId].deleted) {
                    this.history[historyDate].exName[historyIteratorPerDate] = this.exerciseList[exerciseId].name + common.HTMLColor(" [gelöscht]", "red");
                }
                else if (this.exerciseList[exerciseId].deleted == false) {
                    this.history[historyDate].exName[historyIteratorPerDate] = this.exerciseList[exerciseId].name;
                }

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

                dailySumGroup += (Number(historyEntry.points[historyIteratorPerDate]));

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

                dailySumWithNegative[historyName] == undefined ? dailySumWithNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : dailySumWithNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate])

                if (this.exerciseList[exerciseId].type === "Cardio") {
                    dailyCardioGroup += (Number(historyEntry.points[historyIteratorPerDate]));

                    dailyCardio[historyName] == undefined ? dailyCardio[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : dailyCardio[historyName] += Number(historyEntry.points[historyIteratorPerDate])

                    this.registeredPlayers[historyName].points.cardio += Number(historyEntry.points[historyIteratorPerDate]);
                    monthlyCardioSum[historyName] == undefined ? monthlyCardioSum[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : monthlyCardioSum[historyName] += Number(historyEntry.points[historyIteratorPerDate])

                }
                else if (this.exerciseList[exerciseId].type === "Kraft") {
                    dailyStrengthGroup += (Number(historyEntry.points[historyIteratorPerDate]));


                    dailyStrength[historyName] == undefined ? dailyStrength[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : dailyStrength[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                    this.registeredPlayers[historyName].points.strength += Number(historyEntry.points[historyIteratorPerDate]);

                    monthlyStrengthSum[historyName] == undefined ? monthlyStrengthSum[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : monthlyStrengthSum[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                }
                this.registeredPlayers[historyName].points.total += Number(historyEntry.points[historyIteratorPerDate]);

                if (Number(historyEntry.points[historyIteratorPerDate] <= 0)) {
                    monthlyNegative[historyName] == undefined ? monthlyNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : monthlyNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                }
                else {
                    monthlySum[historyName] == undefined ? monthlySum[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : monthlySum[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
                }

                monthlySumWithNegative[historyName] == undefined ? monthlySumWithNegative[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : monthlySumWithNegative[historyName] += Number(historyEntry.points[historyIteratorPerDate]);


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

                if (last4Days[historyName] == undefined) {
                    last4Days[historyName] = 0;
                }
                if (currentDateInfo.isLast4Days) {
                    last4Days[historyName] != undefined ? last4Days[historyName] += Number(historyEntry.points[historyIteratorPerDate]) : last4Days[historyName] = Number(historyEntry.points[historyIteratorPerDate]);
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
                    sumPointsLastMonth[historyName] == undefined ? sumPointsLastMonth[historyName] = Number(historyEntry.points[historyIteratorPerDate]) : sumPointsLastMonth[historyName] += Number(historyEntry.points[historyIteratorPerDate]);
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


                xAxis[playerName] == undefined ? xAxis[playerName] = [this.registeredPlayers[playerName].points.total] : xAxis[playerName].push(this.registeredPlayers[playerName].points.total);
                xAxisCardio[playerName] == undefined ? xAxisCardio[playerName] = [this.registeredPlayers[playerName].points.cardio] : xAxisCardio[playerName].push(this.registeredPlayers[playerName].points.cardio);
                xAxisStrength[playerName] == undefined ? xAxisStrength[playerName] = [this.registeredPlayers[playerName].points.strength] : xAxisStrength[playerName].push(this.registeredPlayers[playerName].points.strength);

                //With Reset
                xAxisDailyReset[playerName] == undefined ? xAxisDailyReset[playerName] = [this.history[historyDate].dailySum[playerName]] : xAxisDailyReset[playerName].push(this.history[historyDate].dailySum[playerName]);
                xAxisDailyResetCardio[playerName] == undefined ? xAxisDailyResetCardio[playerName] = [dailyCardio[playerName]] : xAxisDailyResetCardio[playerName].push(dailyCardio[playerName]);
                xAxisDailyResetStrength[playerName] == undefined ? xAxisDailyResetStrength[playerName] = [dailyStrength[playerName]] : xAxisDailyResetStrength[playerName].push(dailyStrength[playerName]);


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
            //group graph
            xAxisGroup.push(dailySumGroup);
            xAxisGroupCardio.push(dailyCardioGroup);
            xAxisGroupStrength.push(dailyStrengthGroup);

            this.fullGroupGraph = {
                xAxis: xAxisGroup,
                yAxis: yAxis
            };

            this.fullGroupCardioGraph = {
                xAxis: xAxisGroupCardio,
                yAxis: yAxis
            };

            this.fullGroupStrengthGraph = {
                xAxis: xAxisGroupStrength,
                yAxis: yAxis
            };


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
                    this.addToEventLog(msg);
                }
            }
            this.history[historyDate].dailyWinner = dailyWinner;
            this.dailyWins[dailyWinner] != undefined ? this.dailyWins[dailyWinner]++ : this.dailyWins[dailyWinner] = 1

            dailySum = {};
            dailyStrength = {};
            dailyCardio = {};
            dailySumNegative = {};
            dailySumWithNegative = {};
            dailySumGroup = 0;
            dailyCardioGroup = 0;
            dailyStrengthGroup = 0;

            this.monthlyData[currentDateInfo.currentMonthName] = monthlySumWithNegative;
            this.monthlyCardioData[currentDateInfo.currentMonthName] = monthlyCardioSum;
            this.monthlyStrengthData[currentDateInfo.currentMonthName] = monthlyStrengthSum;


        } //END FOR

        //Player specific stuff
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
            if (last4Days[playerName] == undefined) {
                last4Days[playerName] = 0;
            }

            this.registeredPlayers[playerName].points.cardioStrengthRatio = calc.calculateCardioStrengthPercents(this.registeredPlayers[playerName].points.cardio, this.registeredPlayers[playerName].points.strength);
            
            this.registeredPlayers[playerName].points.toDoForFactor = (config.POINTS_FOR_POWERFACTOR * this.registeredPlayers[playerName].points.powerFactor) - last4Days[playerName];
            
            if (this.registeredPlayers[playerName].points.toDoForFactor < 0) {
                this.registeredPlayers[playerName].points.toDoForFactor = 0;
            }

            let player = {
                name: playerName,
            }
            this.checkPlayerStuff(player, function (result) {
                logFile.log(result, false, 0);
            }.bind(this));

        }

        this.needsUpload.dataStorage = true;
        let end = Date.now();
        fullRefreshResult(`full refresh took ${end - start} ms`);


    }



}

module.exports = FitnessManager;