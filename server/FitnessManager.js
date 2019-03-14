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
googleSheetHistoryLisi = require("../saves/googleJSON/lisiGoogle.json");

calc = new Calc();

class FitnessManager {
    constructor() {
        this.name = "Caf-Fitness-Programm";
        this.exerciseCount = 0;
        this.exerciseList = {};
        this.today = calc.createZeroDate();
        this.history = {};
        this.registeredPlayers = {};

        this.importGoogleSheetStuff(function (result) {
            console.log(result);            
        }.bind(this));



    }

    importGoogleSheetStuff(result) {
        this.importExercisesFromGoogle(function (resultEx) {
            console.log(resultEx);
            this.importHistoryFromGoogle(function (resultHistory) {
                console.log(resultHistory);
                result("GoogleSheet Stuff loaded");
            }.bind(this));

        }.bind(this));
    }

    addExerciseAchievement(exId,repsToGetOverall,repsToGetDaily,repsToGetMonthly,achievementCategory){
        repsToGetOverall = repsToGetOverall.map(Number);
        repsToGetDaily = repsToGetDaily.map(Number);
        repsToGetMonthly = repsToGetMonthly.map(Number);
        
        var textOverall = "";
        var textDaily = "";
        var textMonthly = "";
        var achievementActive = false;
        if(calc.getNonZeroValuesOfArray(repsToGetOverall)>0){
            textOverall = achievementCategory + " Achievement (Gesamt)";
            achievementActive = true;
        }
        if(calc.getNonZeroValuesOfArray(repsToGetDaily)>0){
            textDaily = achievementCategory + " Achievement (Täglich)";
            achievementActive = true;
        }
        if(calc.getNonZeroValuesOfArray(repsToGetMonthly)>0){
            textMonthly = achievementCategory + " Achievement (Monatlich)";
            achievementActive = true;
        }

        this.achievementInfo = {
            achievementActive:achievementActive,
            repsToGetOverall: repsToGetOverall,
            repsToGetDaily: repsToGetDaily,
            repsToGetMonthly: repsToGetMonthly,
            textOverall: textOverall,
            textDaily: textDaily,
            textMonthly: textMonthly,
            achievementCategory: achievementCategory,
        };


        this.exerciseList[exId].achievementInfo = achievementInfo;
    }

    createGraph(fromDate, toDate) {
        var chunk = this.getDefinedHistory(fromDate, toDate);
        var graph = {};
        for (var playerName in this.registeredPlayers) {
            var xAxis = [];
            var yAxis = [];
            var date = calc.createZeroDate(fromDate);
            fromDate = calc.createZeroDate(fromDate);
            var sumPoints = this.calculatePointsFromHistory(playerName, fromDate).total;
            for (var historyIterator = 0; historyIterator < chunk.length; historyIterator++) {
                date = calc.createZeroDate(chunk[historyIterator].date[0]);
                for (var historyEntryIterator = 0; historyEntryIterator < chunk[historyIterator].points.length; historyEntryIterator++) {
                    if (chunk[historyIterator].playerName[historyEntryIterator].toUpperCase() != playerName.toUpperCase()) {
                        continue;
                    }
                    sumPoints += chunk[historyIterator].points[historyEntryIterator];
                }
                xAxis[historyIterator] = sumPoints;
                yAxis[historyIterator] = date;
            }
            graph[playerName] = {
                xAxis: xAxis,
                yAxis: yAxis,
            };
        }
        return graph;
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
                entry.exname + " Import from GS", "JsonImporter",
                entry.type,
                entry.unit,
                entry.bothSides
            );

            var achievementActive = false;
            var repsToGetOverall;
            var repsToGetDaily;
            var repsToGetMonthly;
            var achievementCategory;
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
            exercise.achievementInfo.achievementActive = achievementActive;
            exercise.achievementInfo.repsToGetOverall = repsToGetOverall;
            exercise.achievementInfo.repsToGetDaily = repsToGetDaily;
            exercise.achievementInfo.repsToGetMonthly = repsToGetMonthly;
            exercise.achievementInfo.achievementCategory = achievementCategory;
            exercise.achievementInfo.textDaily = achievementCategory + " Achievement (Täglich)";
            exercise.achievementInfo.textMonthly = achievementCategory + " Achievement (Monatlich)";
            exercise.achievementInfo.textOverall = achievementCategory + " Achievement (Gesamt)";

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
                            console.log(dayEntry);
                            console.log(dayEntryKeyValue);
                            console.log(dayEntryKeyName);
                        }
                    }
                }
            }
        }
        for(var nameIterator = 0;nameIterator<nameData.length;nameIterator++){
            this.calculatePointsFromHistory(nameData[nameIterator]);
        }
        
        result("Histories from JSON imported.");
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
        this.addExercise(new Exercise(exPack.name, exPack.difficulty, exPack.difficulty10, exPack.difficulty100, exPack.equipment, usesWeight, exPack.baseWeight, exPack.comment, creator, exPack.type, exPack.unit, exPack.bothSides));
    }

    editExercise(id, editor, difficulty, difficulty10, difficulty100, unit, baseWeight, comment, bothSides,result) {
        var newVote = {
            difficulty: difficulty,
            difficulty10: difficulty10,
            difficulty100: difficulty100,
            baseWeight: baseWeight,
            comment: comment
        };
        this.bothSides = (bothSides.toUpperCase() === 'TRUE');
        this.exerciseList[id].votes[editor] = newVote;
        this.exerciseList[id].unit = unit;
        calc.calculateNewFactor(this.exerciseList[id]);
        this.recalculateExercise(id,function(result){
            console.log(result);
        }.bind(this));
        result("editExercise done");
    }

    recalculateExercise(id,result){
        var sumPoints = 0;
        for(var historyDate in this.history){
            var historyEntry = this.history[historyDate];
            for(var historyIterator = 0;historyIterator<historyEntry.exerciseId.length;historyIterator++){
                if(historyEntry.exerciseId[historyIterator] != id){
                    continue;
                }
                var currentWeight = historyEntry.weight[historyIterator];
                var currentCount = historyEntry.count[historyIterator];
                var points = calc.calculatePoints(this.exerciseList[historyEntry.exerciseId[historyIterator]], currentWeight, currentCount);
                historyEntry.points[historyIterator] = points;
                sumPoints += Number(points);
                console.log("recalculated " + historyEntry.exName[historyIterator]);
            }
            
        }
        this.exerciseList[id].points = sumPoints;
        return result("recalculateExercise done");
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

    deleteHistory(id, date) {
        for (var historyEntryIterator in this.history[date].id) {
            if (this.history[date].id[historyEntryIterator] == id) {
                for (var historyEntry in this.history[date]) {
                    this.history[date][historyEntry].splice(historyEntryIterator, 1);
                }
            }
        }
    }


    getDefinedHistory(fromDate, toDate) {
        fromDate = calc.createZeroDate(fromDate);
        toDate = calc.createZeroDate(toDate);
        var sortable = [];
        var historyChunk = [];
        for (var historyEntry in this.history) {
            if (historyEntry === "2018-08-31") {
                var x = 0;
            }
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

    addToHistory(id, playerName, exerciseId, weight, count, date) {
        if (weight === "" || this.exerciseList[exerciseId].usesWeight === false) {
            weight = 0;
        }
        date = calc.createZeroDate(date);
        date = calc.getDateFormat(date, "YYYY-MM-DD");
        var points = calc.calculatePoints(this.exerciseList[exerciseId], weight, count);
        if (this.history[date] != undefined) {
            for (var iterator in this.history[date].exerciseId) {
                var exId = this.history[date].exerciseId[iterator];
                if (exId === exerciseId && this.history[date].weight[iterator] == weight && this.history[date].playerName[iterator] == playerName.toUpperCase()) {
                    this.history[date].count[iterator] += Number(count);
                    this.history[date].points[iterator] += Number(points);
                    return;
                }
            }

            this.history[date].id.push(id);
            this.history[date].date.push(date);
            this.history[date].playerName.push(playerName.toUpperCase());
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
            newPlayerName.push(playerName.toUpperCase());
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
    }

    checkPlayerStuff(player, result) {
        this.setBestExerciserNumber(player, function (result) {
            console.log(result);
            this.checkForAchievements(player, function (result) {
                console.log(result);
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
            for (var levelOverallIterator = 0; levelOverallIterator < exercise.achievementInfo.repsToGetOverall.length; levelOverallIterator++) {
                if (exercise.achievementInfo.repsToGetOverall[levelOverallIterator] > 0) {
                    if (playerReps >= exercise.achievementInfo.repsToGetOverall[levelOverallIterator]) {
                        player.earnedAchievements[exCat + "Overall"] =
                            exercise.achievementInfo.textOverall + " Level " +
                            (levelOverallIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetOverall) +
                            " (" + playerReps + "/" + exercise.achievementInfo.repsToGetOverall[levelOverallIterator] + ")";
                        if (levelOverallIterator == exercise.achievementInfo.repsToGetOverall.length) {
                            delete player.notEarnedAchievements[exCat + "Overall"];
                        }
                    }
                    else {
                        player.notEarnedAchievements[exCat + "Overall"] = exercise.achievementInfo.textOverall + " Level " + (levelOverallIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetOverall) + " (" + playerReps + "/" + exercise.achievementInfo.repsToGetOverall[levelOverallIterator] + ")";
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
                        player.earnedAchievements[exCat + "Month"] = exercise.achievementInfo.textMonthly + " Level " + (levelMonthIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetMonthly) + " (" + playerRepsMonthly + "/" + exercise.achievementInfo.repsToGetMonthly[levelMonthIterator] + ")";
                    }
                    else {
                        player.notEarnedAchievements[exCat + "Month"] = exercise.achievementInfo.textMonthly + " Level " + (levelMonthIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetMonthly) + " (" + playerRepsMonthly + "/" + exercise.achievementInfo.repsToGetMonthly[levelMonthIterator] + ")";
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
                        player.earnedAchievements[exCat + "Day"] = exercise.achievementInfo.textDaily + " Level " + (levelDayIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetDaily) + " (" + repsToGetDaily + "/" + exercise.achievementInfo.repsToGetDaily[levelDayIterator] + ")";
                    }
                    else {
                        player.notEarnedAchievements[exCat + "Day"] = exercise.achievementInfo.textDaily + " Level " + (levelDayIterator + 1) + "/" + calc.getNonZeroValuesOfArray(exercise.achievementInfo.repsToGetDaily) + " (" + repsToGetDaily + "/" + exercise.achievementInfo.repsToGetDaily[levelDayIterator] + ")";
                        break;
                    }
                }
                else {
                    continue;
                }
            }
        }
        result("checkForAchievements done");
    }

    getPlayerList(playerList,result){
        var returnList = {};
        for( var idPlayer in playerList){
            returnList[playerList[idPlayer].name] = playerList[idPlayer].points;
            returnList[playerList[idPlayer].name].online = true;
        }
        for (var name in this.registeredPlayers){
          if(returnList[name] != undefined){
              continue;
          }
          else{
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
        var thisMonthEntries = 0;
        var thisYear = calc.createZeroDate().getFullYear();
        var todayDate = calc.createZeroDate();
        todayDate.setMonth(todayDate.getMonth() - 1);
        var lastMonth = todayDate.getMonth();
        var lastMonthYear = todayDate.getFullYear();
        var thisMonth = calc.createZeroDate().getMonth();
        var dateMinus5Days = calc.createZeroDate();
        var dailyMax = 0;
        var resultingMaxPerDay = 0;
        todayDate = calc.createZeroDate();
        dateMinus5Days.setDate(dateMinus5Days.getDate() - 5);
        for (var dates in this.history) {
            var currentDate = calc.createZeroDate(dates);
            currentDate.setMonth(currentDate.getMonth() - 1);
            currentDate = calc.createZeroDate(dates);
            if (currentDate >= toDateNotIncluding) {
                continue;
            }
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
            if (dailyMax > resultingMaxPerDay) {
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
            dailyMax: resultingMaxPerDay,
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