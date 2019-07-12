
// @ts-nocheck
/*jshint esversion: 6 */

/******************************************************************************************************************
*******************************************************************************************************************
*                                               HTML OBJECTS, INITS 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
var Name = "";
var exerciseTableSortMode = { cellIndex: 1 };

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
var button_tabMainPage = document.getElementById('button_tabMainPage');
var button_modifyExercise = document.getElementById('button_modifyExercise');
var button_statisticsExercise = document.getElementById('button_statisticsExercise');
var button_tabCompetition = document.getElementById('button_tabCompetition');
var button_tabEventLog = document.getElementById('button_tabEventLog');
var button_chatText = document.getElementById('button_chatText');
var button_link = document.getElementById('button_link');
var button_img = document.getElementById('button_img');
var button_hideExercise =document.getElementById('button_hideExercise');
var button_showHiddenExercises= document.getElementById('button_showHiddenExercises');

//DIVS
var div_ExerciseOverview = document.getElementById('div_ExerciseOverview');
var div_navigation = document.getElementById('div_navigation');
var div_PersonalOverview = document.getElementById('div_PersonalOverview');
var div_exerciseHistory = document.getElementById('div_exerciseHistory');
var div_exerciseHistoryControl = document.getElementById('div_exerciseHistoryControl');
var div_statistics = document.getElementById('div_statistics');
var div_graph = document.getElementById('div_graph');
var div_MainPage = document.getElementById('div_MainPage');
var div_login = document.getElementById('div_login');
var div_competition = document.getElementById('div_competition');
var div_events = document.getElementById('div_events');
var div_eventLog = document.getElementById('div_eventLog');


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
var input_Password = document.getElementById('input_Password');
var input_UserName = document.getElementById('input_Username');
var input_exerciseID = document.getElementById('input_exerciseID');
var input_onlineIndicator = document.getElementById('input_onlineIndicator');
var input_RememberMe = document.getElementById('input_RememberMe');
var input_chatText = document.getElementById('input_chatText');
var input_doneExerciseAdditional = document.getElementById('input_doneExerciseAdditional');
var input_paceConstant = document.getElementById('input_paceConstant');
//SELECTS
var select_exerciseType = document.getElementById('select_exerciseType');
var select_exerciseUnit = document.getElementById('select_exerciseUnit');
var select_exerciseEquipment = document.getElementById('select_exerciseEquipment');
var select_doneExercise = document.getElementById('select_doneExercise');
var select_historyShowName = document.getElementById('select_historyShowName');
var select_bothSides = document.getElementById('select_bothSides');
var select_statisticsExercise = document.getElementById('select_statisticsExercise');
var select_chartType = document.getElementById('select_chartType');
var select_graphSwitch = document.getElementById('select_graphSwitch');
//TABLES
var table_exerciseTable = document.getElementById('table_exerciseTable');
var table_personalTable = document.getElementById('table_personalTable');
var table_exerciseHistory = document.getElementById('table_exerciseHistory');
var table_allPlayersTable = document.getElementById('table_allPlayersTable');
var table_achievementsDone = document.getElementById('table_achievementsDone');
var table_dailyWins = document.getElementById('table_dailyWins');
var table_monthlyWins = document.getElementById('table_monthlyWins');

//para
var paragraph_statisticsExercise = document.getElementById('paragraph_statisticsExercise');
var paragraph_paceUnitNotice = document.getElementById('paragraph_paceUnitNotice');
//label
var label_input_exerciseDifficulty = document.getElementById('label_input_exerciseDifficulty');

var SOCKET = io();
var LOGIN_COOKIE = "";//getCookie("loginCookie");
var PACE_UNITS = "";
var PACE_INVERT = "";
var RUNTIME_CONFIG = {
    showHiddenExercises:false,
};




/******************************************************************************************************************
*******************************************************************************************************************
*                                               ONCLICK, ONCHANGE 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/

button_SignIn.onclick = function () {
    SOCKET.emit('SignIn', { username: input_UserName.value.toLowerCase(), password: input_Password.value, remember: input_RememberMe.checked });
};

button_SignUp.onclick = function () {
    SOCKET.emit('SignUp', { username: input_UserName.value.toLowerCase(), password: input_Password.value });
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
    button_updateHistory.click();
};


button_updateHistory.onclick = function () {
    SOCKET.emit("requestHistoryUpdate", { fromDate: input_historyFromDate.value, toDate: input_historyToDate.value });
};

button_doneExerciseSend.onclick = function () {
    if (checkForEmptyBoxesDoneExercise()) {

        exerciseDone('addDoneExercise');
        button_updateHistory.click();//ARSCH
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }
};

button_tabMainPage.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "inline-block";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    requestGraphUpdate();
};

button_tabPersonalOverview.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "inline-block";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    button_updateHistory.click();
};

button_tabCompetition.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "inline-block";
    div_events.style.display = "none";
};

button_tabStatistics.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "inline-block";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    requestAchievementList();
};


button_tabExerciseOverview.onclick = function () {
    div_ExerciseOverview.style.display = "inline-block";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
};

button_tabEventLog.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "inline-block";
    div_eventLog.scrollTop = div_eventLog.scrollHeight;
};

button_deleteExercise.onclick = function () {
    if (checkForEmptyBoxesNewExercise()) {
        modifyExercise('deleteExercise');
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }
};

button_createExercise.onclick = function () {
    if (checkForEmptyBoxesNewExercise()) {
        modifyExercise('addExercise');
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }

};

button_modifyExercise.onclick = function () {
    if (input_exerciseID.value == "") {
        alert("Keine Übung zum Bearbeiten ausgewählt");
    }
    else {
        if (checkForEmptyBoxesNewExercise()) {
            modifyExercise('modifyExercise');
        }
        else {
            alert("Nicht alle Inputboxen wurden ausgefüllt!");
        }
    }
};

button_statisticsExercise.onclick = function () {
    requestExerciseStatistic(select_statisticsExercise.value);
};

select_graphSwitch.onchange = function () {
    if (select_graphSwitch.value == "bar") {
        input_graphFromDate.disabled = true;
        input_graphToDate.disabled = true;
    }
    else {
        input_graphFromDate.disabled = false;
        input_graphToDate.disabled = false;
    }
    requestGraphUpdate();
};

button_chatText.onclick = function () {
    if (input_chatText.value != "") {
        sendChatMessage(input_chatText.value);
    }
};

button_link.onclick = function () {
    input_chatText.value += "[LINK][/LINK]";
};

button_img.onclick = function () {
    input_chatText.value += "[IMG][/IMG]";
};

input_graphFromDate.onchange = function () {
    requestGraphUpdate();
};
input_graphToDate.onchange = function () {
    requestGraphUpdate();
};

select_chartType.onchange = function () {
    requestGraphUpdate();
};

input_exerciseID.onchange = function () {
    for (let tableIterator = 0, row; row = table_exerciseTable.rows[tableIterator]; tableIterator++) {
        if (input_exerciseID.value == row.getElementsByTagName("td")[0].innerHTML) {
            //row.getElementsByTagName("td")[1].classList.add("selected");
            row.classList.add("selected");
        }
        else {
            //row.getElementsByTagName("td")[1].classList.remove("selected");
            row.classList.remove("selected");
        }
    }
};

select_doneExercise.onchange = function () {
    let paceUnitsArray = PACE_UNITS.split(";");
    let selectedUnit = "";
    for (let iterator = 0; iterator < paceUnitsArray.length; iterator++) {
        if (select_doneExercise.selectedOptions[0].innerText.includes("(" + paceUnitsArray[iterator] + ")")) {
            selectedUnit = paceUnitsArray[iterator];

        }
    }
    if (selectedUnit != "") {
        input_doneExerciseAdditional.style.display = "inline-block";
        input_doneExerciseAdditional.disabled = false;
        let units = selectedUnit.split("/");


        input_doneExerciseAdditional.placeholder = units[1];
        input_doneExercise.placeholder = units[0];

    }

    else {
        input_doneExercise.type = "number";
        input_doneExerciseAdditional.type = "number";
        input_doneExerciseAdditional.style.display = "none";
        input_doneExerciseAdditional.disabled = true;
        input_doneExerciseAdditional.placeholder = "";
        input_doneExerciseAdditional.value = "";
        input_doneExercise.placeholder = "Anzahl";
    }


};

select_exerciseUnit.onchange = function () {

    let paceUnitOptions = getPaceUnitOptions(select_exerciseUnit.value);


    if (paceUnitOptions.isPaceUnit && paceUnitOptions.showPaceEntryMask) {
        input_exerciseDifficulty10.disabled = true;
        input_exerciseDifficulty100.disabled = true;
        input_exerciseDifficulty10.style.display = "none";
        input_exerciseDifficulty100.style.display = "none";
        input_paceConstant.style.display = "inline-block";
        label_input_exerciseDifficulty.innerHTML = "Übungsfaktor | Pace Konstante:";
        if (paceUnitOptions.invert) {
            paragraph_paceUnitNotice.innerHTML = "Die Einheit '" + select_exerciseUnit.value +
                "' bewirkt folgende Berechnung: <b>(( Konstante / ((" + paceUnitOptions.sec + " / " + paceUnitOptions.first + ") / " + paceUnitOptions.first + ")) * Übungsfaktor) * Gewichtsfaktor</b> | (Bedenke: Die Einheiten 'sec' und 'm' werden für die Punkteberechnung in 'min' und 'km' umgerechnet)";
        }
        else {
            paragraph_paceUnitNotice.innerHTML = "Die Einheit '" + select_exerciseUnit.value +
                "' bewirkt folgende Berechnung: <b>(( Konstante / ((" + paceUnitOptions.first + " / " + paceUnitOptions.sec + ") / " + paceUnitOptions.sec + ")) * Übungsfaktor) * Gewichtsfaktor</b> | (Bedenke: Die Einheiten 'sec' und 'm' werden für die Punkteberechnung in 'min' und 'km' umgerechnet)";
        }

    }
    else if (select_exerciseUnit.value != "") {

        input_exerciseDifficulty10.disabled = false;
        input_exerciseDifficulty100.disabled = false;
        input_exerciseDifficulty10.style.display = "inline-block";
        input_exerciseDifficulty100.style.display = "inline-block";
        input_paceConstant.style.display = "none";
        paragraph_paceUnitNotice.innerHTML = "Die Einheit '" + select_exerciseUnit.value +
            "' bewirkt folgende Berechnung: <b>([" + select_exerciseUnit.value + "] * ((Diff1 + Diff10 + Diff100) / 3)) * Gewichtsfaktor</b>";
        label_input_exerciseDifficulty.innerHTML = "Schwierigkeit (1,10,100):";
    }
    else {
        input_exerciseDifficulty10.disabled = false;
        input_exerciseDifficulty100.disabled = false;
        input_exerciseDifficulty10.style.display = "inline-block";
        input_exerciseDifficulty100.style.display = "inline-block";
        input_paceConstant.style.display = "none";
        paragraph_paceUnitNotice.innerHTML = "Keine Auswahl getroffen";
        label_input_exerciseDifficulty.innerHTML = "Schwierigkeit (1,10,100):";
    }
};

button_hideExercise.onclick = function(){
    hideExercise(input_exerciseID.value);
};

button_showHiddenExercises.onclick = function(){
    RUNTIME_CONFIG.showHiddenExercises = !RUNTIME_CONFIG.showHiddenExercises;
    if(RUNTIME_CONFIG.showHiddenExercises){
        button_showHiddenExercises.style.backgroundColor = "green";
    }
    else{
        button_showHiddenExercises.style.backgroundColor = "";
    }
    requestExerciseListUpdate();
};

initialize();
/******************************************************************************************************************
*******************************************************************************************************************
*                                               SOCKET ON 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
SOCKET.on('configValues', function (data) {
    PACE_UNITS = data.paceUnits;
    PACE_INVERT = data.paceInvert;
    var paceUnitsArray = PACE_UNITS.split(";");
    for (let iterator = 0; iterator < paceUnitsArray.length; iterator++) {
        addOption(select_exerciseUnit, paceUnitsArray[iterator], paceUnitsArray[iterator]);
    }
    resetExerciseEntryMask();

});


SOCKET.on('refreshExerciseList', function (data) {
    generateExerciseList(data);
});

SOCKET.on('signInResponse', function (data) {
    if (data.success) {
        div_login.style.display = "none";
        Name = data.name;
        if (Name.toLowerCase() === "caf") {
            input_paceConstant.disabled = false;
        }
        select_historyShowName.value = Name;
        button_tabMainPage.click();
        div_navigation.style.display = 'inline-block';

    }
    else
        alert("Sign in unsuccessful");
});

SOCKET.on('signUpResponse', function (data) {
    if (data.success) {
        alert("Sign Up successful");
    }
    else
        alert("Sign Up unsuccessful");
});

SOCKET.on('alertMsg', function (data) {
    alert(data.data);
});

SOCKET.on('loginToken', function (data) {
    setCookie("loginCookie", data.data, 1);
});



SOCKET.on('refreshEventLog', function (data) {
    generateEventLog(data);
});

SOCKET.on("refreshHistory", function (data) {
    fromDate = createZeroDate(input_historyFromDate.value);
    toDate = createZeroDate(input_historyToDate.value);
    generateHistoryList(data, table_exerciseHistory, true, select_historyShowName.value, fromDate, toDate);
});

SOCKET.on("refreshAchievements", function (data) {
    generateAchievementListTable(data, Name);
});

SOCKET.on("refreshGraph", function (data) {
    var border = 2;
    if (document.getElementById("canvas_graphHistory")) {
        canvas_graphHistory = document.getElementById("canvas_graphHistory");
        canvas_graphHistory.remove();
    }
    canvas_graphHistory = document.createElement("canvas");
    canvas_graphHistory.id = "canvas_graphHistory";
    div_graph.appendChild(canvas_graphHistory);
    var ctx_graphHistory = canvas_graphHistory.getContext("2d");
    canvas_graphHistory.height = div_graph.clientHeight - border;
    canvas_graphHistory.width = div_graph.clientWidth - border;
    generateGraph(data, canvas_graphHistory, ctx_graphHistory);
});

SOCKET.on("refresh", function (data) {
    var selIndex = select_historyShowName.selectedIndex;
    select_historyShowName.innerHTML = "";
    for (var names in data.playerList) {
        addOption(select_historyShowName, names, names);
    }
    select_historyShowName.selectedIndex = selIndex;
    if (select_historyShowName.value === "") {
        select_historyShowName.value = Name;
    }

    if (input_doneExerciseWeight.value === "") {
        input_doneExerciseWeight.value = 0;
    }
    generatePlayerListTable(data);
    generateExerciseList(data);
    generatePlayerInfoTable(data);
    generateCompetitionData(data);
    generateEventLog(data);

});

SOCKET.on("refreshExerciseStatistics", function (data) {
    if (data.reps == undefined || data.points == undefined || data.repsDaily == undefined || data.repsMonthly == undefined) {
        data.reps = 0;
        data.points = 0;
        data.repsDaily = 0;
        data.repsMonthly = 0;
    }
    paragraph_statisticsExercise.innerHTML = "";

    for (var key in data) {
        paragraph_statisticsExercise.innerHTML += translate(key) + ": " + translate(data[key]) + "<br>";
    }
});


/******************************************************************************************************************
*******************************************************************************************************************
*                                               SOCKET EMIT 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/

function requestGraphUpdate() {
    SOCKET.emit("requestGraphUpdate", { fromDate: input_graphFromDate.value, toDate: input_graphToDate.value, type: select_graphSwitch.value, pointType: select_chartType.value });
}

function requestExerciseListUpdate() {
    SOCKET.emit("requestExerciseListUpdate",  {data:true});
}


function sendChatMessage(msg) {

    SOCKET.emit("sendChatMessage", data = {
        name: Name,
        msg: msg.toString()
    });
    input_chatText.value = "";

}

function requestExerciseStatistic(id) {
    if (id == undefined || id == "") {
        paragraph_statisticsExercise.innerHTML = "Bitte etwas auswählen..";
        return;
    }
    SOCKET.emit("requestExerciseStatistic", data = {
        id: id
    });
}


function requestHistoryDeletion(id, date) {
    SOCKET.emit("deleteHistory", data = {
        id: id,
        date: date,
    });
    button_updateHistory.click();

}
function requestAchievementList() {
    SOCKET.emit("requestAchievements", data = {
        name: Name
    });
}


function exerciseDone(emitString) {
    SOCKET.emit(emitString, exPack = {
        exId: select_doneExercise.value,
        date: input_doneExerciseDate.value,
        count: input_doneExercise.value,
        countAdditional: input_doneExerciseAdditional.value,
        weight: input_doneExerciseWeight.value,
    });
}

function modifyExercise(emitString) {
    let paceUnitOptions = getPaceUnitOptions(select_exerciseUnit.value);

    let diff10 = input_exerciseDifficulty10.value;
    let diff100 = input_exerciseDifficulty100.value;

    let isPaceExercise = paceUnitOptions.isPaceUnit;
    if (isPaceExercise) {
        if (paceUnitOptions.showPaceEntryMask) {
            diff10 = input_exerciseDifficulty.value;
            diff100 = input_exerciseDifficulty.value;
        }
        else {
            input_paceConstant.value = 1;
        }
    }
    SOCKET.emit(emitString, exPack = {
        name: input_exerciseName.value,
        difficulty: input_exerciseDifficulty.value,
        difficulty10: diff10,
        difficulty100: diff100,
        paceConstant: input_paceConstant.value,
        isPaceExercise: isPaceExercise,
        baseWeight: input_exerciseBaseWeight.value,
        type: select_exerciseType.value,
        unit: select_exerciseUnit.value,
        equipment: select_exerciseEquipment.value,
        bothSides: select_bothSides.value,
        comment: input_exerciseComment.value,
        id: input_exerciseID.value,
        paceUnitOptions: paceUnitOptions,
    });
    resetExerciseEntryMask();
}

function hideExercise(id){
    SOCKET.emit("hideExercise", data = {
        id:id,
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
    var dataSetMeta = [];
    var applyFilter = false;
    var filterSettings = {};
    if (OverallChart != undefined) {
        for (let dataIterator = 0; dataIterator < OverallChart.config.data.datasets.length; dataIterator++) {
            dataSetMeta.push(OverallChart.getDatasetMeta(dataIterator));

            if (dataSetMeta[dataIterator].hidden == undefined || dataSetMeta[dataIterator].hidden == undefined == null) {
                dataSetMeta[dataIterator].hidden = OverallChart.config.data.datasets[dataIterator].hidden;
            }

            filterSettings[OverallChart.config.data.datasets[dataIterator].label] = dataSetMeta[dataIterator].hidden;
        }
        applyFilter = true;




        OverallChart.data.labels.pop();
        OverallChart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        OverallChart.update();
        canvas.height = div_graph.clientHeight;
        canvas.width = div_graph.clientWidth - 10;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    OverallChart = undefined;


    var datasets = [];
    var dataset;
    var month;
    var playerName;

    var allPlayerNames = {};
    for (month in data.graph) {
        for (playerName in data.graph[month]) {
            allPlayerNames[playerName] = 0;
        }
    }

    if (select_graphSwitch.value == "bar") {
        var labels = [];
        var labelIterator = 0;
        var dataPerName = {};


        for (month in data.graph) {
            labels[labelIterator] = month;
            labelIterator++;

            for (playerName in data.graph[month]) {
                if (dataPerName[playerName] == undefined) {
                    dataPerName[playerName] = [data.graph[month][playerName]];
                }
                else {
                    dataPerName[playerName].push(data.graph[month][playerName]);
                }
                allPlayerNames[playerName] = 1;

            }
            for (var lostPlayer in allPlayerNames) {
                if (allPlayerNames[lostPlayer] == 0) {
                    if (dataPerName[lostPlayer] == undefined) {
                        dataPerName[lostPlayer] = [0];
                    }
                    else {
                        dataPerName[lostPlayer].push(0);
                    }
                }
                allPlayerNames[lostPlayer] = 0;
            }



        }
        for (playerName in dataPerName) {
            dataset = {
                label: playerName,
                backgroundColor: data.colors[playerName],
                borderColor: "black",
                data: dataPerName[playerName],
            };

            datasets.push(dataset);
        }

        datasets.sort(function (a, b) {
            var x = a.label.toLowerCase();
            var y = b.label.toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
        });

        if (applyFilter) {
            for (let dataIterator = 0; dataIterator < datasets.length; dataIterator++) {
                datasets[dataIterator].hidden = filterSettings[datasets[dataIterator].label];
            }
        }

        if (OverallChart == undefined) {
            OverallChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
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
            OverallChart.config.type = 'bar';
            OverallChart.data.datasets = datasets;
            OverallChart.data.labels = labels;
            OverallChart.update();
        }
    }
    else {
        for (var playerGraphName in data.graph) {
            dataset = {
                label: playerGraphName,
                data: data.graph[playerGraphName].xAxis,
                fill: false,
                pointStyle: 'cross',
                radius: 1,
                borderColor: [
                    data.colors[playerGraphName],

                ],
                borderWidth: 1,
                hidden: false,
            };

            datasets.push(dataset);


        }

        datasets.sort(function (a, b) {
            var x = a.label.toLowerCase();
            var y = b.label.toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
        });

        if (applyFilter) {
            for (let dataIterator = 0; dataIterator < datasets.length; dataIterator++) {
                datasets[dataIterator].hidden = filterSettings[datasets[dataIterator].label]
            }
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

            OverallChart.config.type = 'line';
            OverallChart.data.datasets = datasets;
            OverallChart.data.labels = data.graph.caf.yAxis;
            OverallChart.update();
        }
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
        bodyRow = tBodyAchievementTable.insertRow(tBodyAchievementTable.rows.length);

        for (achievementKey in achievementListPlayer.notEarnedAchievements[achievementIterator]) {
            if (achievementKey === "achievementPercent" || achievementKey === "achievementLevel") {
                continue;
            }
            if (tBodyAchievementTable.rows.length == 1) {
                cell = headerRow.insertCell(headerRow.cells.length);
                cell.innerHTML += translate(achievementKey);
                cell.onclick = function () {
                    sortTable(this, table_achievementsDone);
                };
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
                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.appendChild(div);
                div.innerHTML += "Level " + achievementListPlayer.notEarnedAchievements[achievementIterator].achievementLevel + " - " + translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);

            }
            else {
                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.innerHTML += translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);

            }
        }






    }
    sortTable({ cellIndex: 0 }, table_achievementsDone);
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
        player = data.playerList[playerid].points;
        if (playerIterator == 0) {
            cell = headerRow.insertCell(headerRow.cells.length);
            cell.innerHTML += translate("Name");
        }
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML += translate(playerid);


        for (var playerKeyName in player) {
            playerKeyContent = player[playerKeyName];
            if (playerIterator == 0) {
                cell = headerRow.insertCell(headerRow.cells.length);
                cell.innerHTML += translate(playerKeyName);
                cell.onclick = function () {
                    sortTable(this, table_allPlayersTable);
                };
            }

            cell = bodyRow.insertCell(bodyRow.cells.length);
            cell.innerHTML += translate(playerKeyContent);
            cell.classList.add(playerKeyName);

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
                cell = headerRow.insertCell(headerRow.cells.length);
                cell.innerHTML += translate(objectKeyName);
                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.innerHTML += translate(objectKeyContent);
            }
        }
        else {
            cell = headerRow.insertCell(headerRow.cells.length);
            cell.innerHTML += translate(playerKeyName);
            cell = bodyRow.insertCell(bodyRow.cells.length);
            cell.innerHTML += translate(playerKeyContent);
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
    var selIndex = select_doneExercise.selectedIndex;
    select_doneExercise.innerHTML = "";
    select_statisticsExercise.innerHTML = "";
    var exercisesInTable = 0;
    var isHiddenExercise = false;
    

    for (var exerciseId in data.exercises) {
        exercise = data.exercises[exerciseId];
        isHiddenExercise = false;

        if (exercise.deleted){
            continue;
        }
        if (exercise.isHidden[Name] != undefined){
            //defined!
            if(exercise.isHidden[Name]){
                isHiddenExercise = true;
                if(!RUNTIME_CONFIG.showHiddenExercises){
                    continue;
                }
                
            }
        }

        exercisesInTable++;
        addOption(select_doneExercise, exerciseId, exercise.name + " (" + exercise.unit + ")" + " | " + exercise.equipment + " | " + translate(exercise.factor));

        bodyRow = tBodyExerciseTable.insertRow(tBodyExerciseTable.rows.length);
        var toolTipText = "";
        var bestPlayer;
        var playerName;
        for (var exerciseKeys in exercise) {
            key = exercise[exerciseKeys];

            if (exerciseKeys === "comment" || exerciseKeys === "achievementInfo" || exerciseKeys === "isHidden" || exerciseKeys === "deleted") {
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
                bestPlayer = "Keiner";
                for (playerName in key) {
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
                bestPlayer = "Keiner";
                for (playerName in key) {
                    var reps = key[playerName];
                    if (reps > maxReps) {
                        maxReps = reps;
                        bestPlayer = playerName;
                    }

                }
                key = bestPlayer + ": " + translate(maxReps);
            }

            if (tBodyExerciseTable.rows.length == 1) {
                headerArray.push(exerciseKeys);
            }
            cell = bodyRow.insertCell(bodyRow.cells.length);
            cell.innerHTML = translate(key);
            if (exerciseKeys === "id") {
                cell.classList.add("hiddenCell");
            }

        }
        addToolTip(toolTipText, "tableTooltip", bodyRow);
        if(isHiddenExercise){
            bodyRow.classList.add("hiddenExercise");
        }
        bodyRow.onclick = function () {
            var id = this.getElementsByTagName("td")[0].innerHTML;
            if (input_exerciseID.value == id) {
                resetExerciseEntryMask();
            }
            else {
                input_exerciseName.value = data.exercises[id].name;
                input_exerciseID.value = id;

                select_exerciseEquipment.value = data.exercises[id].equipment;
                select_exerciseType.value = data.exercises[id].type;
                select_exerciseUnit.value = data.exercises[id].unit;
                select_bothSides.value = data.exercises[id].bothSides;

                if (data.exercises[id].votes[Name] == undefined) {
                    input_exerciseBaseWeight.value = data.exercises[id].baseWeight;
                    input_exerciseDifficulty.value = data.exercises[id].difficulty;
                    input_exerciseDifficulty10.value = data.exercises[id].difficulty10;
                    input_exerciseDifficulty100.value = data.exercises[id].difficulty100;
                    input_paceConstant.value = data.exercises[id].paceConstant;
                }
                else {
                    input_exerciseBaseWeight.value = data.exercises[id].votes[Name].baseWeight;
                    input_exerciseDifficulty.value = data.exercises[id].votes[Name].difficulty;
                    input_exerciseDifficulty10.value = data.exercises[id].votes[Name].difficulty10;
                    input_exerciseDifficulty100.value = data.exercises[id].votes[Name].difficulty100;
                    input_paceConstant.value = data.exercises[id].votes[Name].paceConstant;
                    input_exerciseComment.value = data.exercises[id].votes[Name].comment;
                }

                if (this.classList.contains("hiddenExercise")){
                    button_hideExercise.innerHTML = "Einblenden";
                }
                else{
                    button_hideExercise.innerHTML = "Ausblenden";
                }

            }

            input_exerciseID.onchange();
            select_exerciseUnit.onchange();

        };




    }

    sortSelect(select_doneExercise);
    select_statisticsExercise.innerHTML = select_doneExercise.innerHTML;
    select_doneExercise.selectedIndex = selIndex;
    select_statisticsExercise.selectedIndex = selIndex;

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
    if(exercisesInTable>0){
        sortTable(exerciseTableSortMode, table_exerciseTable);
        input_exerciseID.onchange();
    }
    

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
    var rowNotUsed = false;

    var maxDate = fromDate;
    var minDate = toDate;

    for (var historyIterator = 0; historyIterator < data.history.length; historyIterator++) {
        var historyEntry = data.history[historyIterator];
        var toolTipText = "";
        var pace = "-";
        var unit;
        var countAdditional = 0;
        for (var historyItemsIterator = 0; historyItemsIterator < historyEntry.id.length; historyItemsIterator++) {
            if (!rowNotUsed) {
                bodyRow = tBodyTable.insertRow(tBodyTable.rows.length);
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
                        if (historyKeys === "playerName" || historyKeys === "dailySum" || historyKeys === "dailyWinner") {
                            if (historyKeys === "dailyWinner") {
                                toolTipText = "Tagessieger: " + historyEntry[historyKeys];
                            }
                            continue;

                        }
                    }
                }
                else {
                    if (historyKeys === "dailySum" || historyKeys === "dailyWinner") {
                        continue;
                    }
                }
                if (historyKeys == "pace") {
                    pace = key[historyItemsIterator];
                    continue;
                }
                if (historyKeys == "exUnit") {
                    unit = key[historyItemsIterator];
                    continue;
                }
                if (historyKeys == "countAdditional") {
                    countAdditional = key[historyItemsIterator];
                    continue;
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
                if (tBodyTable.rows.length == 1) {
                    headerArray.push(historyKeys);
                }

                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.classList.add(historyKeys);
                cell.innerHTML = translate(value);
                if (historyKeys === "id" || historyKeys === "exerciseId") {
                    cell.classList.add("hiddenCell");
                }
                if (historyKeys === "points") {
                    selectionSum += Number(value);

                }
            }


            if (!rowNotUsed) {
                addToolTip(toolTipText, "tableTooltip", bodyRow);
                let paceUnitOptions = getPaceUnitOptions(unit);
                if (paceUnitOptions.isPaceUnit) {
                    bodyRow.getElementsByClassName("count")[0].innerHTML += " " + paceUnitOptions.first + ", " + translate(countAdditional) + " " + paceUnitOptions.sec + " (" + translate(pace) + " " + paceUnitOptions.first + "/" + paceUnitOptions.sec + ")";
                }
                for (let cellIds = 0; cellIds < bodyRow.cells.length; cellIds++) {
                    currentCell = bodyRow.cells[cellIds];
                    currentCell.onclick = function () {
                        let count = this.getElementsByClassName("count")[0].innerHTML;
                        let weight = this.getElementsByClassName("weight")[0].innerHTML;
                        let exId = this.getElementsByClassName("exerciseId")[0].innerHTML;

                        if (paceUnitOptions.isPaceUnit) {
                            let result = extractPaceCounts(count);
                            input_doneExercise.value = result.first;
                            input_doneExerciseAdditional.value = result.sec;
                        }
                        else {
                            input_doneExercise.value = count;
                        }

                        select_doneExercise.value = exId;
                        input_doneExerciseWeight.value = weight;
                        select_doneExercise.onchange();

                    }.bind(bodyRow);
                }
                let deleteCell = bodyRow.insertCell(bodyRow.cells.length);
                deleteCell.classList.add("deleteButton");
                deleteCell.innerHTML = translate("Löschen");
                if (tBodyTable.rows.length == 1) {
                    headerArray.push("Löschtaste");
                }
                deleteCell.onclick = function () {
                    var id = this.getElementsByClassName("id")[0].innerHTML;
                    var date = getDateFormat(this.getElementsByClassName("date")[0].innerHTML, "YYYY-MM-DD", "DD.MM.YYYY");

                    if (Name.toUpperCase() === select_historyShowName.value.toUpperCase()) {
                        requestHistoryDeletion(id, date);
                    }
                    else {
                        alert("Du kannst ned die Sachen von die anderen löschen, Wirschtl");
                    }
                }.bind(bodyRow);

            }

        }
    }

    if (rowNotUsed) {
        table.deleteRow(tBodyTable.rows.length - 1);
    }

    headerRow = theadTable.insertRow(0);
    for (headerContents = 0; headerContents < headerArray.length; headerContents++) {
        cell = headerRow.insertCell(headerContents);
        cell.innerHTML = translate(headerArray[headerContents]);
        if (headerArray[headerContents] === "id" || headerArray[headerContents] === "exerciseId") {
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

function generateCompetitionData(data) {

    var theadDailyWinsTable = table_dailyWins.tHead;
    var tBodyDailyWinsTable = table_dailyWins.tBodies[0];

    theadDailyWinsTable.innerHTML = "";
    tBodyDailyWinsTable.innerHTML = "";

    var headerRow = theadDailyWinsTable.insertRow(0);
    var cell = headerRow.insertCell(0);
    cell.innerHTML = "Name";
    cell.onclick = function () {
        sortTable(this, table_dailyWins);
    };
    cell = headerRow.insertCell(1);
    cell.innerHTML = "Tagessiege";
    cell.onclick = function () {
        sortTable(this, table_dailyWins);
    };




    for (var playerName in data.compInfoDaily) {
        if (playerName == "Keiner") {
            continue;
        }

        bodyRow = tBodyDailyWinsTable.insertRow(tBodyDailyWinsTable.rows.length);
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = playerName;
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = data.compInfoDaily[playerName];
        //month
    }

    var theadMonthlyWinsTable = table_monthlyWins.tHead;
    var tBodyMonthlyWinsTable = table_monthlyWins.tBodies[0];

    theadMonthlyWinsTable.innerHTML = "";
    tBodyMonthlyWinsTable.innerHTML = "";

    headerRow = theadMonthlyWinsTable.insertRow(0);
    cell = headerRow.insertCell(0);
    cell.innerHTML = "Name";
    cell.onclick = function () {
        sortTable(this, table_monthlyWins);
    };
    cell = headerRow.insertCell(1);
    cell.innerHTML = "Monatssiege";
    cell.onclick = function () {
        sortTable(this, table_monthlyWins);
    };



    for (playerName in data.compInfoMonthly) {
        if (playerName == "Keiner") {
            continue;
        }
        bodyRow = tBodyMonthlyWinsTable.insertRow(tBodyMonthlyWinsTable.rows.length);
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = playerName;
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = data.compInfoMonthly[playerName];

        //month


    }

    var sortIndex = { cellIndex: 1 };
    sortTable(sortIndex, table_monthlyWins);
    sortTable(sortIndex, table_dailyWins);
    sortTable(sortIndex, table_monthlyWins);
    sortTable(sortIndex, table_dailyWins);
}

function generateEventLog(data) {
    div_eventLog.innerHTML = "";
    for (var eventIterator = 0; eventIterator < data.eventLog.time.length; eventIterator++) {
        div_eventLog.innerHTML = div_eventLog.innerHTML + "<li>" + data.eventLog.time[eventIterator] + " - " + data.eventLog.msg[eventIterator] + "</li>";
    }

    div_eventLog.scrollTop = div_eventLog.scrollHeight;

}



/******************************************************************************************************************
*******************************************************************************************************************
*                                               HELPER FUNCTIONS
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/

input_chatText.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        if (div_events.style.display == "inline-block") {
            button_chatText.click();
        }

    }
});

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

function addOption(select, key, Name, group) {
    var option = document.createElement('option');

    if (group == undefined) {
        option.text = Name;
        option.value = key;
        select.add(option);
        return;
    }

    var optionGroup = document.getElementById(group);
    if (optionGroup == undefined) {
        addOptionGroup(select, group);
        optionGroup = document.getElementById(group);
    }
    option.text = Name;
    option.value = key;
    optionGroup.appendChild(option);
}

function addOptionGroup(select, Name) {
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

function getPaceUnitOptions(unit) {
    let result = {
        isPaceUnit: false,
        invert: false,
        showPaceEntryMask: false,
        first: "",
        sec: "",
    };

    let paceUnitsArray = PACE_UNITS.split(";");
    for (let iterator = 0; iterator < paceUnitsArray.length; iterator++) {
        if (paceUnitsArray[iterator] === unit) {
            result.isPaceUnit = true;
            result.invert = (PACE_INVERT.split(";")[iterator] === "1");
            result.first = paceUnitsArray[iterator].split("/")[0];
            result.sec = paceUnitsArray[iterator].split("/")[1];
            result.showPaceEntryMask = true;
            break;
        }
        result.invert = false;
        result.first = unit;
        result.sec = "";
        result.showPaceEntryMask = false;
        result.isPaceUnit = false;

    }

    return result;

}

function checkForEmptyBoxesNewExercise() {
    let paceUnitOptions = getPaceUnitOptions(select_exerciseUnit.value);
    if (!paceUnitOptions.isPaceUnit) {
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
    else {
        if (input_exerciseName.value != "" &&
            input_exerciseDifficulty.value != "" &&
            input_paceConstant.value != "" &&
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
    bestRepMatcher = /([a-zA-Z]+): (\d+).(\d{2})/;
    var startOfRepX = 0;
    var startOfRepY = 0;
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
                if (x.innerHTML.includes("Level")) {
                    startOfRepX = x.children[0].innerHTML.substring(6, 6 + 2);
                    startOfRepY = y.children[0].innerHTML.substring(6, 6 + 2);
                    if (startOfRepX.includes("/")) {
                        startOfRepX = startOfRepX.substring(0, 1);
                    }
                    if (startOfRepY.includes("/")) {
                        startOfRepY = startOfRepY.substring(0, 1);
                    }
                    valX = Number(startOfRepX);
                    valY = Number(startOfRepY);
                }
                else if (x.innerHTML.match(bestRepMatcher) != null) {
                    startOfRepX = x.innerHTML.indexOf(":");
                    startOfRepY = y.innerHTML.indexOf(":");
                    valX = Number(x.innerHTML.substring(startOfRepX + 2));
                    valY = Number(y.innerHTML.substring(startOfRepY + 2));
                }
                else if (x.innerHTML.match(matcher) != null) {
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

                if (x.innerHTML.includes("Level")) {
                    startOfRepX = x.children[0].innerHTML.substring(6, 6 + 2);
                    startOfRepY = y.children[0].innerHTML.substring(6, 6 + 2);
                    if (startOfRepX.includes("/")) {
                        startOfRepX = startOfRepX.substring(0, 1);
                    }
                    if (startOfRepY.includes("/")) {
                        startOfRepY = startOfRepY.substring(0, 1);
                    }
                    valX = Number(startOfRepX);
                    valY = Number(startOfRepY);
                }
                else if (x.innerHTML.match(bestRepMatcher) != null) {
                    startOfRepX = x.innerHTML.indexOf(":");
                    startOfRepY = y.innerHTML.indexOf(":");
                    valX = Number(x.innerHTML.substring(startOfRepX + 2));
                    valY = Number(y.innerHTML.substring(startOfRepY + 2));
                }
                else if (x.innerHTML.match(matcher) != null) {
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

    input_doneExerciseAdditional.style.display = "none";
    input_doneExerciseAdditional.disabled = true;

}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function deleteCookie(cname) {
    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}



function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
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

function changeCSS(cssFile, cssLinkIndex) {

    var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", cssFile);

    document.getElementsByTagName("body").item(0).replaceChild(newlink, oldlink);
}

setInterval(function () {
    if (SOCKET.connected) {
        input_onlineIndicator.style.color = "green";
        input_onlineIndicator.checked = true;
    }
    else {
        input_onlineIndicator.style.color = "red";
        input_onlineIndicator.checked = false;
    }
}, 1000);

if (LOGIN_COOKIE != "") {
    SOCKET.emit('SignIn', { username: input_UserName.value.toLowerCase(), password: input_Password.value, remember: false, loginToken: LOGIN_COOKIE });
}

function logout() {
    deleteCookie("loginCookie");
    location.reload();
}

function sortSelect(selElem) {
    var tmpAry = new Array();
    for (let i = 0; i < selElem.options.length; i++) {
        tmpAry[i] = new Array();
        tmpAry[i][0] = selElem.options[i].text;
        tmpAry[i][1] = selElem.options[i].value;
    }
    tmpAry.sort();
    while (selElem.options.length > 0) {
        selElem.options[0] = null;
    }
    for (let i = 0; i < tmpAry.length; i++) {
        var op = new Option(tmpAry[i][0], tmpAry[i][1]);
        selElem.options[i] = op;
    }
    return;
}

function checkInvert(unit) {
    var paceUnitsArray = PACE_UNITS.split(";");
    let invert = false;
    for (let iterator = 0; iterator < paceUnitsArray.length; iterator++) {
        if (paceUnitsArray[iterator] === unit) {
            invert = (PACE_INVERT.split(";")[iterator] === "1");
            break;
        }

    }

    return invert;

}


function resetExerciseEntryMask() {
    input_exerciseName.value = "";
    input_exerciseDifficulty.value = "";
    input_exerciseDifficulty10.value = "";
    input_exerciseDifficulty100.value = "";
    input_paceConstant.value = "";
    input_exerciseBaseWeight.value = "";
    select_exerciseType.value = "";
    select_exerciseUnit.value = "";
    select_exerciseEquipment.value = "";
    select_bothSides.value = "";
    input_exerciseComment.value = "";
    input_exerciseID.value = "";
    select_exerciseUnit.onchange();
    button_hideExercise.innerHTML = "Ausblenden";

}

function resetHistoryEntryMask() {
    input_doneExercise.value = "";
    input_doneExerciseWeight.value = "";
    select_doneExercise.value = "";
}

function extractPaceCounts(extractString) {
    let valueArray = extractString.split(" ");
    let firstNumber = false;
    let secNumber = false;
    let result = {
        first: 0,
        sec: 0,
    };
    for (let iterator = 0; iterator < valueArray.length; iterator++) {
        if (!isNaN(Number(valueArray[iterator]))) {
            if (!firstNumber) {
                result.first = Number(valueArray[iterator]);
                firstNumber = true;
            }
            else if (!secNumber) {
                result.sec = Number(valueArray[iterator]);
                secNumber = true;
            }
        }
    }

    return result;
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
        case "monthlyMax":
            return "Monatsbestleistung";
        case "repsDaily":
            return "Bestleistung (Täglich)";
        case "repsMonthly":
            return "Bestleistung (Monatl.)";
        case "reps":
            return "Gesamtwiederholungen";
        case "category":
            return "Übungskategorie";
        case "cardioStrengthRatio":
            return "Cardio | Stärke";
        case "entries":
            return "Historyeinträge";
        case "paceConstant":
            return "Pace Konstante";
        case "isPaceExercise":
            return "Pace Berechnung Aktiv";
        default:
            if (word.search("Overall") != -1) {
                return word.replace("Overall", "[Gesamt] - ");
            }
            if (word.search("Day") != -1) {
                return word.replace("Day", "[Täglich] - ");
            }
            if (word.search("Month") != -1) {
                return word.replace("Month", "[Monatlich] - ");
            }
            return word;
    }
}
