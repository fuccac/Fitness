// @ts-nocheck
/*jshint esversion: 6 */

/******************************************************************************************************************
*******************************************************************************************************************
*                                               HTML OBJECTS, INITS 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
var Name = "";
var exerciseTableSortMode = {cellIndex: 1};

//BUTTONS
var button_SignIn = document.getElementById('button_SignIn');
var button_SignUp = document.getElementById('button_SignUp');
var button_createExercise = document.getElementById('button_createExercise');
var button_deleteExercise = document.getElementById('button_deleteExercise');
var button_tabExerciseOverview = document.getElementById('button_tabExerciseOverview');
var button_tabPersonalOverview = document.getElementById('button_tabPersonalOverview');
var button_doneExerciseSend = document.getElementById('button_doneExerciseSend');
var button_updateHistory = document.getElementById('button_updateHistory');
var button_tabStatistics = document.getElementById('button_tabStatistics');
var button_updateGraph = document.getElementById('button_updateGraph');
var button_tabMainPage = document.getElementById('button_tabMainPage');
var button_modifyExercise = document.getElementById('button_modifyExercise');
//CANVAS
var canvas_graphHistory = document.getElementById('canvas_graphHistory');

//CTX
var ctx_graphHistory = canvas_graphHistory.getContext("2d");
//DIVS
var div_ExerciseOverview = document.getElementById('div_ExerciseOverview');
var div_addNewExercise = document.getElementById('div_addNewExercise');
var div_navigation = document.getElementById('div_navigation');
var div_PersonalOverview = document.getElementById('div_PersonalOverview');
var div_addWorkout = document.getElementById('div_addWorkout');
var div_PersonalInfo = document.getElementById('div_PersonalInfo');
var div_exerciseHistory = document.getElementById('div_exerciseHistory');
var div_exerciseHistoryControl = document.getElementById('div_exerciseHistoryControl');
var div_statistics = document.getElementById('div_statistics');
var div_graph = document.getElementById('div_graph');
var div_MainPage = document.getElementById('div_MainPage');
var div_achievementsDone = document.getElementById('div_achievementsDone');
var div_login = document.getElementById('div_login');
//FONTS
var font_Courier = "Courier New";
//INPUTS
var input_exerciseName = document.getElementById('input_exerciseName');
var input_exerciseDifficulty = document.getElementById('input_exerciseDifficulty');
var input_exerciseDifficulty10 = document.getElementById('input_exerciseDifficulty10');
var input_exerciseDifficulty100 = document.getElementById('input_exerciseDifficulty100');
var input_exerciseBaseWeight = document.getElementById('input_exerciseBaseWeight');
var input_exerciseComment = document.getElementById('input_exerciseComment');
var input_doneExerciseDate = document.getElementById('input_doneExerciseDate');
var input_doneExercise = document.getElementById('input_doneExercise');
var input_doneExerciseWeight = document.getElementById('input_doneExerciseWeight');
var input_historyFromDate = document.getElementById('input_historyFromDate');
var input_historyToDate = document.getElementById('input_historyToDate');
var input_sumSelection = document.getElementById('input_sumSelection');
var input_avgSelection = document.getElementById('input_avgSelection');
var input_graphFromDate = document.getElementById('input_graphFromDate');
var input_graphToDate = document.getElementById('input_graphToDate');
var input_deletionMode = document.getElementById('input_deletionMode');
var input_Password = document.getElementById('input_Password');
var input_UserName = document.getElementById('input_Username');
var input_exerciseID = document.getElementById('input_exerciseID');
var onlineIndicator= document.getElementById('onlineIndicator');
var input_RememberMe=document.getElementById('input_RememberMe');
//SELECTS
var select_exerciseType = document.getElementById('select_exerciseType');
var select_exerciseUnit = document.getElementById('select_exerciseUnit');
var select_exerciseEquipment = document.getElementById('select_exerciseEquipment');
var select_doneExercise = document.getElementById('select_doneExercise');
var select_historyShowName = document.getElementById('select_historyShowName');
var select_bothSides = document.getElementById('select_bothSides');
//TABLES
var table_exerciseTable = document.getElementById('table_exerciseTable');
var table_personalTable = document.getElementById('table_personalTable');
var table_exerciseHistory = document.getElementById('table_exerciseHistory');
var table_allPlayersTable = document.getElementById('table_allPlayersTable');
var table_achievementsDone = document.getElementById('table_achievementsDone');
var socket = io();

initialize();

var loginCookie ="";
div_ExerciseOverview.style.display = "none";
div_PersonalOverview.style.display = "none";
div_statistics.style.display = "none";
div_MainPage.style.display = "none";
div_navigation.style.display = "none";

/******************************************************************************************************************
*******************************************************************************************************************
*                                               ONCLICK, ONCHANGE 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
//sign in code
button_SignIn.onclick = function () {
    socket.emit('SignIn', { username: input_UserName.value.toLowerCase(), password: input_Password.value});
};
button_SignUp.onclick = function () {
    socket.emit('SignUp', { username: input_UserName.value.toLowerCase(), password: input_Password.value });
};

input_historyFromDate.onchange = function () {
    if (!isValidDate(createZeroDate(input_historyFromDate.value))) {
        input_historyFromDate.value = getDateFormat(createZeroDate(), "YYYY-MM-DD");
    }
};

input_historyToDate.onchange = function () {
    if (!isValidDate(createZeroDate(input_historyToDate.value))) {
        input_historyToDate.value = getDateFormat(createZeroDate(), "YYYY-MM-DD");
    }
};

select_historyShowName.onchange = function () {
    button_updateHistory.onclick();
};


button_updateHistory.onclick = function () {
    socket.emit("requestHistoryUpdate", { fromDate: input_historyFromDate.value, toDate: input_historyToDate.value });
};

button_updateGraph.onclick = function () {
    socket.emit("requestGraphUpdate", { fromDate: input_graphFromDate.value, toDate: input_graphToDate.value });
};

button_doneExerciseSend.onclick = function () {
    if (checkForEmptyBoxesDoneExercise()) {
        exerciseDone('addDoneExercise');
        button_updateHistory.onclick();
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }
};

button_tabMainPage.onclick = function () {
    var border = 2;
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "inline-block";
    canvas_graphHistory.height = div_graph.clientHeight-border;
    canvas_graphHistory.width = div_graph.clientWidth-border;
    button_updateGraph.onclick();
};

button_tabPersonalOverview.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "inline-block";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
};

button_tabStatistics.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "inline-block";
    div_MainPage.style.display = "none";
    requestAchievementList();
};


button_tabExerciseOverview.onclick = function () {
    div_ExerciseOverview.style.display = "inline-block";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
};

button_deleteExercise.onclick = function () {
    if (checkForEmptyBoxesNewExercise()) {
        modifyExercise('deleteExercise');
        button_updateHistory.onclick();
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }
};

button_createExercise.onclick = function () {
    if (checkForEmptyBoxesNewExercise()) {
        modifyExercise('addExercise');
        button_updateHistory.onclick();
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }

};

button_modifyExercise.onclick = function () {
    if (checkForEmptyBoxesNewExercise()) {
        modifyExercise('modifyExercise');
        button_updateHistory.onclick();
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }

};




/******************************************************************************************************************
*******************************************************************************************************************
*                                               SOCKET ON 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/

socket.on('signInResponse', function (data) {
    if (data.success) {
        div_login.style.display = "none";
        Name = input_UserName.value;
        button_tabMainPage.onclick();
        div_navigation.style.display = 'inline-block';
        if (input_RememberMe.checked && loginCookie===""){
            setCookie("loginCookie",Name,1);
        }
    }
    else
        alert("Sign in unsuccessful");
});

socket.on('signUpResponse', function (data) {
    if (data.success) {
        alert("Sign Up successful");
    }
    else
        alert("Sign Up unsuccessful");
});

socket.on("refreshHistory", function (data) {
    fromDate = createZeroDate(input_historyFromDate.value);
    toDate = createZeroDate(input_historyToDate.value);
    generateHistoryList(data, table_exerciseHistory, true, select_historyShowName.value, fromDate, toDate);
});

socket.on("refreshAchievements", function (data) {
    generateAchievementListTable(data, Name);
});

socket.on("refreshGraph", function (data) {
    generateGraph(data, canvas_graphHistory, ctx_graphHistory);
});

socket.on("refresh", function (data) {
    var selIndex = select_historyShowName.selectedIndex;
    select_historyShowName.innerHTML = "";
    for (var names in data.registeredPlayers) {
        addOption(select_historyShowName, names, names);
    }
    select_historyShowName.selectedIndex = selIndex;
    if (select_historyShowName.value === "") {
        select_historyShowName.value = data.player.name;
    }

    if (input_doneExerciseWeight.value === "") {
        input_doneExerciseWeight.value = 0;
    }
    generatePlayerListTable(data);
    generateExerciseList(data);
    generatePlayerInfoTable(data);

});




/******************************************************************************************************************
*******************************************************************************************************************
*                                               SOCKET EMIT 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
function requestHistoryDeletion(id, date) {
    socket.emit("deleteHistory", data = {
        id: id,
        date: date,
    });
    button_updateHistory.onclick();
}
function requestAchievementList() {
    socket.emit("requestAchievements", data = {
        name: Name
    });
}
function exerciseDone(emitString) {
    socket.emit(emitString, exPack = {
        exId: select_doneExercise.value,
        date: input_doneExerciseDate.value,
        count: input_doneExercise.value,
        weight: input_doneExerciseWeight.value,
    });
}

function modifyExercise(emitString) {
    socket.emit(emitString, exPack = {
        name: input_exerciseName.value,
        difficulty: input_exerciseDifficulty.value,
        difficulty10: input_exerciseDifficulty10.value,
        difficulty100: input_exerciseDifficulty100.value,
        baseWeight: input_exerciseBaseWeight.value,
        type: select_exerciseType.value,
        unit: select_exerciseUnit.value,
        equipment: select_exerciseEquipment.value,
        bothSides: select_bothSides.value,
        comment: input_exerciseComment.value,
        id: input_exerciseID.value
    });
}




/******************************************************************************************************************
*******************************************************************************************************************
*                                               TABLE/CONTENT GENERATION 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
var OverallChart;
function generateGraph(data, canvas, ctx) {
    if (OverallChart != undefined) {
        OverallChart.data.labels.pop();
        OverallChart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        OverallChart.update();
        canvas.height = div_graph.clientHeight;
        canvas.width = div_graph.clientWidth - 10;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    var datasets = [];
    var colors = ["green", "red", "blue", "yellow", "brown", "grey", "magenta", "orange"];
    var colorIterator = 0;

    for (var playerGraphName in data.graph) {
        var dataset = {
            label: playerGraphName,
            data: data.graph[playerGraphName].xAxis,
            fill: false,
            pointStyle: 'cross',
            radius: 1,
            borderColor: [
                colors[colorIterator],

            ],
            borderWidth: 1
        };

        datasets.push(dataset);
        colorIterator++;

    }
    if (OverallChart == undefined) {
        OverallChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.graph.caf.yAxis,
                datasets: datasets,
            },

            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                },
            }
        });
        Chart.defaults.global.defaultColor = 'rgba(255, 255, 255, 1)';
    }
    else {
        OverallChart.data.datasets = datasets;
        OverallChart.data.labels = data.graph.caf.yAxis;
        OverallChart.update();
    }


}
function generateAchievementListTable(data, name) {

    var theadAchievementTable = table_achievementsDone.tHead;
    var tBodyAchievementTable = table_achievementsDone.tBodies[0];
    var achievementIterator;

    theadAchievementTable.innerHTML = "";
    tBodyAchievementTable.innerHTML = "";
    headerRow = theadAchievementTable.insertRow(0);

    achievementListPlayer = data.achievementList[name];
    var rowNumber = 0;
    var cellNumber = 0;
    var bodyRow;
    var achievementKey;
    var progressNumbers;
    var percent;
    var div;
    var color;

    theadAchievementTable.innerHTML = "";
    tBodyAchievementTable.innerHTML = "";
    headerRow = theadAchievementTable.insertRow(0);

    for (achievementIterator = 0; achievementIterator < achievementListPlayer.notEarnedAchievements.length; achievementIterator++) {
        bodyRow = tBodyAchievementTable.insertRow(rowNumber);

        for (achievementKey in achievementListPlayer.notEarnedAchievements[achievementIterator]) {
            if (achievementKey === "achievementPercent" || achievementKey === "achievementLevel") {
                continue;
            }
            if (rowNumber == 0) {
                cell = headerRow.insertCell(cellNumber);
                cell.innerHTML += translate(achievementKey);
            }


            if (achievementKey === "achievementProgress") {
                progressNumbers = achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey].split("/").map(Number);
                percent = achievementListPlayer.notEarnedAchievements[achievementIterator].achievementPercent;
                if (percent > 100) {
                    percent = 100;
                }
                if (percent <= 25) {
                    color = "red";
                }
                else if (percent > 25 && percent <= 50) {
                    color = "orange";
                }
                else if (percent > 50 && percent <= 75) {
                    color = "yellow";
                }
                else if (percent > 75) {
                    color = "green";
                }
                div = document.createElement("div");

                div.style = "background:" + color + ";position:relative;height:100%;width:" + percent + "%";
                cell = bodyRow.insertCell(cellNumber);
                cell.appendChild(div);
                div.innerHTML += "Level " + achievementListPlayer.notEarnedAchievements[achievementIterator].achievementLevel + " - " + translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);
                cellNumber++;
            }
            else {
                cell = bodyRow.insertCell(cellNumber);
                cell.innerHTML += translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);
                cellNumber++;
            }
        }

        rowNumber++;
        cellNumber = 0;

    }

}

function generatePlayerListTable(data) {
    var playerIterator = 0;
    var theadPlayersTable = table_allPlayersTable.tHead;
    var tBodyPlayersTable = table_allPlayersTable.tBodies[0];

    theadPlayersTable.innerHTML = "";
    tBodyPlayersTable.innerHTML = "";
    headerRow = theadPlayersTable.insertRow(0);


    for (var playerid in data.playerList) {
        bodyRow = tBodyPlayersTable.insertRow(0);
        player = data.playerList[playerid];
        var cellNumber = 0;
        if (playerIterator == 0) {
            cell = headerRow.insertCell(cellNumber);
            cell.innerHTML += translate("Name");
        }
        cell = bodyRow.insertCell(cellNumber);
        cell.innerHTML += translate(playerid);



        cellNumber++;
        for (var playerKeyName in player) {
            playerKeyContent = player[playerKeyName];
            if (playerIterator == 0) {
                cell = headerRow.insertCell(cellNumber);
                cell.innerHTML += translate(playerKeyName);
                cell.onclick = function () {
                    sortTable(this, table_allPlayersTable);
                };
            }

            cell = bodyRow.insertCell(cellNumber);
            cell.innerHTML += translate(playerKeyContent);
            cell.classList.add(playerKeyName);
            cellNumber++;

        }
        playerIterator++;
    }

}

function generatePlayerInfoTable(data) {
    var theadPersonalTable = table_personalTable.tHead;
    var tBodyPersonalTable = table_personalTable.tBodies[0];

    theadPersonalTable.innerHTML = "";
    tBodyPersonalTable.innerHTML = "";

    headerRow = theadPersonalTable.insertRow(0);
    bodyRow = tBodyPersonalTable.insertRow(0);
    var cellNumber = 0;
    for (var playerKeyName in data.player) {
        playerKeyContent = data.player[playerKeyName];
        if (playerKeyName === "regDate") {
            playerKeyContent = createZeroDate(playerKeyContent);
            playerKeyContent = getDateFormat(playerKeyContent, "DD.MM.YYYY");
        }
        if (playerKeyName === "earnedAchievements" || playerKeyName === "notEarnedAchievements") {
            continue;
        }
        if (Object.keys(playerKeyContent).length > 0 && !checkIfString(playerKeyContent)) {
            for (var objectKeyName in playerKeyContent) {
                objectKeyContent = playerKeyContent[objectKeyName];
                cell = headerRow.insertCell(cellNumber);
                cell.innerHTML += translate(objectKeyName);
                cell = bodyRow.insertCell(cellNumber);
                cell.innerHTML += translate(objectKeyContent);
                cellNumber++;
            }
        }
        else {
            cell = headerRow.insertCell(cellNumber);
            cell.innerHTML += translate(playerKeyName);
            cell = bodyRow.insertCell(cellNumber);
            cell.innerHTML += translate(playerKeyContent);
            cellNumber++;
        }
    }
}

function generateExerciseList(data) {
    var theadExerciseTable = table_exerciseTable.tHead;
    var tBodyExerciseTable = table_exerciseTable.tBodies[0];
    tBodyExerciseTable.innerHTML = "";
    theadExerciseTable.innerHTML = "";
    var headerArray = [];
    var cell;
    var rowNumber = 0;
    var selIndex = select_doneExercise.selectedIndex;
    select_doneExercise.innerHTML = "";


    for (var exerciseId in data.exercises) {
        exercise = data.exercises[exerciseId];
        var group = "";
        if (exercise.usesWeight){
            group = "Gewichte";
        }
        else {
            group = "Keine Gewichte";
        }
        if (exercise.bothSides){
            group = group + " - Beidseitig";
        }
        else {
            group = group + " - Einseitig";
        }
        addOption(select_doneExercise, exerciseId, exercise.name + " (" + exercise.unit + ")" + " | " + exercise.equipment + " | " + translate(exercise.factor),group);

        bodyRow = tBodyExerciseTable.insertRow(rowNumber);
        rowNumber++;
        var cellNumber = 0;
        var toolTipText = "";
        for (var exerciseKeys in exercise) {
            key = exercise[exerciseKeys];

            if (exerciseKeys === "comment" || exerciseKeys === "achievementInfo") {
                continue;
            }
            if (exerciseKeys === "votes") {
                for (var voters in key) {
                    content = key[voters];
                    toolTipText += voters + ": <br>";
                    for (var contentItemNum in content) {
                        contentItem = content[contentItemNum];
                        toolTipText += translate(contentItemNum) + ": " + translate(contentItem) + "<br>";
                    }
                }
                continue;
            }
            if (exerciseKeys === "pointsPerPlayer") {
                var max = 0;
                var bestPlayer = "Keiner";
                for (var playerName in key) {
                    var points = key[playerName];
                    if (points > max) {
                        max = points;
                        bestPlayer = playerName;
                    }

                }
                key = bestPlayer + ": " + translate(max);
            }
            if (exerciseKeys === "repsPerPlayer") {
                var maxReps = 0;
                var bestPlayer = "Keiner";
                for (var playerName in key) {
                    var reps = key[playerName];
                    if (reps > maxReps) {
                        maxReps = reps;
                        bestPlayer = playerName;
                    }

                }
                key = bestPlayer + ": " + translate(maxReps);
            }
            if (rowNumber == 1) {
                headerArray.push(exerciseKeys);
            }
            cell = bodyRow.insertCell(cellNumber);
            cell.innerHTML = translate(key);
            if (exerciseKeys === "id") {
                cell.classList.add("hiddenCell");
            }
            cellNumber++;
        }
        addToolTip(toolTipText, "tableTooltip", bodyRow);

        bodyRow.onclick = function () {
            var id = this.getElementsByTagName("td")[0].innerHTML;
            input_exerciseName.value = data.exercises[id].name;
            input_exerciseID.value = id;
            if (data.exercises[id].votes[Name] == undefined) {
                input_exerciseBaseWeight.value = translate(data.exercises[id].baseWeight);
                input_exerciseDifficulty.value = translate(data.exercises[id].difficulty);
                input_exerciseDifficulty10.value = translate(data.exercises[id].difficulty10);
                input_exerciseDifficulty100.value = translate(data.exercises[id].difficulty100);
            }
            else {
                input_exerciseBaseWeight.value = translate(data.exercises[id].votes[Name].baseWeight);
                input_exerciseDifficulty.value = translate(data.exercises[id].votes[Name].difficulty);
                input_exerciseDifficulty10.value = translate(data.exercises[id].votes[Name].difficulty10);
                input_exerciseDifficulty100.value = translate(data.exercises[id].votes[Name].difficulty100);
                input_exerciseComment.value = data.exercises[id].votes[Name].comment;
            }

            select_exerciseEquipment.value = data.exercises[id].equipment;
            select_exerciseType.value = data.exercises[id].type;
            select_exerciseUnit.value = data.exercises[id].unit;
            select_bothSides.value = data.exercises[id].bothSides;
        };
    }
    select_doneExercise.selectedIndex = selIndex;
    headerRow = theadExerciseTable.insertRow(0);

    for (headerContents = 0; headerContents < headerArray.length; headerContents++) {

        cell = headerRow.insertCell(headerContents);
        cell.innerHTML = translate(headerArray[headerContents]);
        if (headerArray[headerContents] === "id") {
            cell.classList.add("hiddenCell");
        }
        cell.onclick = function () {
            sortTable(this, table_exerciseTable);
            exerciseTableSortMode = this;
        };
    }

    sortTable(exerciseTableSortMode, table_exerciseTable);

}

function generateHistoryList(data, table, nameSpecific, name, fromDate, toDate) {
    name = name.toUpperCase();
    input_sumSelection.value = 0;
    input_avgSelection.value = 0;
    var selectionSum = 0;
    var theadTable = table.tHead;
    var tBodyTable = table.tBodies[0];
    tBodyTable.innerHTML = "";
    theadTable.innerHTML = "";
    var headerArray = [];
    var cell;
    var rowNumber = 0;
    var rowNotUsed = false;
    var cellNumber = 0;

    var maxDate = fromDate;
    var minDate = toDate;

    for (var historyIterator = 0; historyIterator < data.history.length; historyIterator++) {
        var historyEntry = data.history[historyIterator];
        var toolTipText = "No Text";
        for (var historyItemsIterator = 0; historyItemsIterator < historyEntry.id.length; historyItemsIterator++) {
            if (!rowNotUsed) {
                bodyRow = tBodyTable.insertRow(rowNumber);
                rowNumber++;
                cellNumber = 0;
            }

            rowNotUsed = false;
            for (var historyKeys in historyEntry) {
                key = historyEntry[historyKeys];
                if (nameSpecific) {
                    if (historyEntry.playerName[historyItemsIterator].toUpperCase() != name) {
                        rowNotUsed = true;
                        break;
                    }
                    else {
                        if (historyKeys === "exerciseId" || historyKeys === "playerName") {
                            continue;
                        }
                    }
                }
                else {
                    if (historyKeys === "exerciseId") {
                        continue;
                    }
                }
                var value = "";
                if (historyKeys === "date") {
                    value = createZeroDate(key[historyItemsIterator]);
                    if (value < minDate) {
                        minDate = value;
                    }
                    if (maxDate < value) {
                        maxDate = value;
                    }
                    value = getDateFormat(value, "DD.MM.YYYY");

                }
                else {
                    value = key[historyItemsIterator];
                }
                if (rowNumber == 1) {
                    headerArray.push(historyKeys);
                }

                cell = bodyRow.insertCell(cellNumber);
                cell.innerHTML = translate(value);
                if (historyKeys === "id") {
                    cell.classList.add("hiddenCell");
                }
                if (historyKeys === "points") {
                    selectionSum += Number(value);

                }

                cellNumber++;
            }
            if (!rowNotUsed) {
                addToolTip(toolTipText, "tableTooltip", bodyRow);
                bodyRow.onclick = function () {
                    var id = this.getElementsByTagName("td")[0].innerHTML;
                    var date = getDateFormat(this.getElementsByTagName("td")[1].innerHTML, "YYYY-MM-DD", "DD.MM.YYYY");
                    if (input_deletionMode.checked) {
                        if (Name.toUpperCase() === select_historyShowName.value.toUpperCase()) {
                            requestHistoryDeletion(id, date);
                        }
                        else {
                            alert("Du kannst ned die Sachen von die anderen löschen, Wirschtl");
                        }
                    }
                };
            }
        }

    }
    if (rowNotUsed) {
        table.deleteRow(rowNumber - 1);
    }

    headerRow = theadTable.insertRow(0);
    for (headerContents = 0; headerContents < headerArray.length; headerContents++) {
        cell = headerRow.insertCell(headerContents);
        cell.innerHTML = translate(headerArray[headerContents]);
        if (headerArray[headerContents] === "id") {
            cell.classList.add("hiddenCell");
        }
        cell.onclick = function () {
            sortTable(this, table);
        };
    }
    input_sumSelection.value = translate(selectionSum);
    var selectionCount = dateDiff(minDate, maxDate);
    input_avgSelection.value = translate(Number(selectionSum) / (selectionCount + 1));


}



/******************************************************************************************************************
*******************************************************************************************************************
*                                               HELPER FUNCTIONS
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/


function getDateFormat(date, format, fromFormat) {
    var addZeroMonth = "";
    var addZeroDay = "";
    if (typeof fromFormat === 'undefined') { fromFormat = 'default'; }

    if (format === "YYYY-MM-DD") {
        if (fromFormat === "DD.MM.YYYY") {
            var day = date.substring(0, 2);
            var month = date.substring(3, 5);
            var year = date.substring(6);
            date = year + "-" + month + "-" + day;
        }
        else {
            if (date.getMonth() < 9) {
                addZeroMonth = "0";
            }
            if (date.getDate() < 10) {
                addZeroDay = "0";
            }
            date = date.getFullYear() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + addZeroDay + date.getDate();
        }
    }
    if (format === "DD-MM-YYYY") {
        if (date.getMonth() < 9) {
            addZeroMonth = "0";
        }
        if (date.getDate() < 10) {
            addZeroDay = "0";
        }
        date = addZeroDay + date.getDate() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + date.getFullYear();
    }
    if (format === "DD.MM.YYYY") {
        if (date.getMonth() < 9) {
            addZeroMonth = "0";
        }
        if (date.getDate() < 10) {
            addZeroDay = "0";
        }
        date = addZeroDay + date.getDate() + "." + addZeroMonth + (date.getMonth() + 1) + "." + date.getFullYear();
    }

    return date;


}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}


function dateDiff(date1, date2) {
    return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}

function addOption(select, key, Name,group) {
    var option = document.createElement('option');
    
    if (group == undefined){
        option.text = Name;
        option.value = key;    
        select.add(option);
        return;
    }
   
    var optionGroup = document.getElementById(group);
    if (optionGroup == undefined){
        addOptionGroup(select,group);
        optionGroup = document.getElementById(group);
    }
    option.text = Name;
    option.value = key;
    optionGroup.appendChild(option);
}

function addOptionGroup(select,Name){
    var option = document.createElement('OPTGROUP');
    option.label = Name;
    option.id = Name;
    select.add(option);
}

function checkForEmptyBoxesDoneExercise() {
    if (input_doneExercise.value != "" &&
        input_doneExerciseDate.value != "" &&
        select_doneExercise.value != ""
    ) {
        return true;
    }
    else {
        return false;
    }
}

function checkForEmptyBoxesNewExercise() {
    if (input_exerciseName.value != "" &&
        input_exerciseDifficulty.value != "" &&
        input_exerciseDifficulty10.value != "" &&
        input_exerciseDifficulty100.value != "" &&
        select_exerciseType.value != "" &&
        select_exerciseUnit.value != "" &&
        select_exerciseEquipment.value != "" &&
        select_bothSides.value != "" &&
        input_exerciseComment.value != ""
    ) {
        return true;
    }
    else {
        return false;
    }
}

function checkIfString(value) {
    return Object.prototype.toString.call(value) === "[object String]";
}

function checkIfDate(value) {
    return Object.prototype.toString.call(value) === "[object Date]";
}

function checkIfNumber(value) {
    return (typeof value == 'number');
}

function addToolTip(toolTipText, toolTipClass, element) {
    element.classList.add(toolTipClass);
    element.innerHTML += "<span class=\"tooltiptext\">" + toolTipText + "</span>";
}

//Creates an Image on a given canvas
function createImage(ctx, pictureUrl, x, y) {
    ctx.beginPath();
    drawing = new Image();
    drawing.src = "/client/img/" + pictureUrl;
    ctx.drawImage(drawing, x, y);
    ctx.stroke();
    ctx.closePath();
}

//Creates a Sprite Image on a given canvas
function createSprite(ctx, sx, sy, sWidth, sHeight, x, y, dWidth, dHeight) {
    ctx.beginPath();
    ctx.drawImage(gameAssets.spriteSheet, sx, sy, sWidth, sHeight, x, y, dWidth, dHeight);
    ctx.stroke();
    ctx.closePath();
}
//Creates simple good old text on a given canvas
function createText(ctx, fillStyle, font, fontsize, text, x, y) {
    fontAndSize = fontsize.toString() + "px " + font;
    ctx.beginPath();
    ctx.font = fontAndSize;
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
    ctx.stroke();
    ctx.closePath();
}

function drawLine(ctx, strokeStyle, x0, y0, x, y) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
}
//Creates rect (filled or unfilled) on a given canvas
function createRect(ctx, fillStyle, fill, x, y, w, h) {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    if (fill) {
        ctx.fillRect(x, y, w, h);
    }
    else {
        ctx.rect(x, y, w, h);
    }
    ctx.stroke();
    ctx.closePath();
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id)) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id).onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV: 
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function sortTable(n, table) {
    table.style.cursor = "wait";
    m = n.cellIndex;
    matcher = /(\d{2}).(\d{2}).(\d{4})/;

    var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    var valX, valY = "";
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[m];
            y = rows[i + 1].getElementsByTagName("td")[m];
            if (dir == "asc") {
                if (x.innerHTML.match(matcher) != null) {
                    valX = createZeroDate(getDateFormat(x.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                    valY = createZeroDate(getDateFormat(y.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                }
                else if (!isNaN(Number(x.innerHTML))) {
                    valX = Number(x.innerHTML);
                    valY = Number(y.innerHTML);
                }
                else {
                    valX = x.innerHTML.toLowerCase();
                    valY = y.innerHTML.toLowerCase();
                }
                if (valX > valY) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.match(matcher) != null) {
                    valX = createZeroDate(getDateFormat(x.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                    valY = createZeroDate(getDateFormat(y.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                }
                else if (!isNaN(Number(x.innerHTML))) {
                    valX = Number(x.innerHTML);
                    valY = Number(y.innerHTML);
                }
                else {
                    valX = x.innerHTML.toLowerCase();
                    valY = y.innerHTML.toLowerCase();
                }
                if (valX < valY) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    table.style.cursor = "default";
}

function addSpaces(count) {
    var spaces = "";
    for (i = 0; i < count; i++) {
        spaces += " ";
    }
    return spaces;
}

function initialize() {
    //this month
    var thisMonth = function () {
        var today = createZeroDate();
        var thisMonthBegin = createZeroDate(new Date(today.getFullYear(), today.getMonth(), 1));
        var thisMonthEnd = createZeroDate(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        thisMonthEnd.setDate(thisMonthEnd.getDate() - 1);

        return {
            thisMonthBegin: thisMonthBegin,
            thisMonthEnd: thisMonthEnd,
        };
    };

    thisMonthBegin = thisMonth().thisMonthBegin;
    thisMonthEnd = thisMonth().thisMonthEnd;
    thisMonthBegin = getDateFormat(thisMonthBegin, "YYYY-MM-DD");
    thisMonthEnd = getDateFormat(thisMonthEnd, "YYYY-MM-DD");

    input_historyFromDate.value = thisMonthBegin;
    input_historyToDate.value = thisMonthEnd;

    //Today
    today = createZeroDate();
    input_doneExerciseDate.value = getDateFormat(today, "YYYY-MM-DD");
    input_graphFromDate.value = "2018-08-01";
    input_graphToDate.value = getDateFormat(today, "YYYY-MM-DD");

}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

function createZeroDate(date) {
    if (date == undefined) {
        zeroDate = new Date();
        zeroDate.setHours(0);
        zeroDate.setMinutes(0);
        zeroDate.setSeconds(0);
    }
    else {
        zeroDate = new Date(date);
        zeroDate.setHours(0);
        zeroDate.setMinutes(0);
        zeroDate.setSeconds(0);
    }
    return zeroDate;
}

setInterval(function () {
if(socket.connected){
    onlineIndicator.color ="green";
    onlineIndicator.checked = true;
}
else{
    onlineIndicator.color ="red";
    onlineIndicator.checked = false;
}
}, 1000);

if(loginCookie!=""){
    input_UserName.value = loginCookie;
    socket.emit('SignIn', { username: input_UserName.value.toLowerCase(), password: input_Password.value,loginCookie:loginCookie});
}

function translate(word) {
    if (checkIfNumber(word)) {
        return word.toFixed(2);
    }
    word = word.toString();

    switch (word) {
        case "achievementCategory":
            return "Achievement Kategorie";
        case "achievementText":
            return "Achievement Text";
        case "exName":
            return "Übung";
        case "name":
            return "Name";
        case "factor":
            return "Faktor";
        case "points":
            return "Punkte";
        case "difficulty":
            return "Schwierigkeit";
        case "type":
            return "Typ";
        case "unit":
            return "Einheit";
        case "usesWeight":
            return "Gewichtsabhängig";
        case "baseWeight":
            return "Basisgewicht";
        case "creator":
            return "Ersteller";
        case "false":
            return "Nein";
        case "true":
            return "Ja";
        case "cardio":
            return "Cardio";
        case "non-cardio":
            return "Kraft";
        case "equipment":
            return "Ausrüstung";
        case "0":
            return "-";
        case "difficulty10":
            return "Schwierigkeit für 10";
        case "difficulty100":
            return "Schwierigkeit für 100";
        case "id":
            return "Id-Nummer";
        case "active":
            return "Aktiv";
        case "regDate":
            return "Registrierungsdatum";
        case "points":
            return "Punkte";
        case "today":
            return "Heute";
        case "last5Days":
            return "Letzte 5 Tage";
        case "total":
            return "Total";
        case "comment":
            return "Kommentar";
        case "addedExercises":
            return "Übungen angelegt";
        case "deletedExercises":
            return "Übungen gelöscht";
        case "modifiedExercises":
            return "Übungen angepasst";
        case "negative":
            return "Negativpunkte";
        case "thisMonth":
            return "Dieser Monat";
        case "diffLastMonth":
            return "Differenz Vormonat";
        case "averageThisMonth":
            return "Durchschnitt (Monat)";
        case "date":
            return "Datum";
        case "playerName":
            return "Name";
        case "count":
            return "Anzahl";
        case "weight":
            return "Benutztes Gewicht";
        case "dailyMax":
            return "Tagesbestleistung";
        case "pointsPerPlayer":
            return "Bester (Punkte)";
        case "repsPerPlayer":
            return "Bester (Reps)";
        case "bestExercises":
            return "Best @ Übungen";
        case "bothSides":
            return "Beidseitig";
        case "online":
            return "Online";
        case "strength":
            return "Stärke";
        case "achievementProgress":
            return "Achievement Fortschritt";
        case "achievementNextLevel":
            return "Nächstes Level";
        default:
            if (word.search("Overall") != -1) {
                return word.replace("Overall", " Gesamt");
            }
            if (word.search("Day") != -1) {
                return word.replace("Day", " an einem Tag");
            }
            if (word.search("Month") != -1) {
                return word.replace("Month", "  in einem Monat");
            }
            return word;
    }
}
