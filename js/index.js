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
var common = new Common();

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
var button_tabCompetition = document.getElementById('button_tabCompetition');
var button_tabEventLog = document.getElementById('button_tabEventLog');
var button_chatText = document.getElementById('button_chatText');
var button_link = document.getElementById('button_link');
var button_img = document.getElementById('button_img');
var button_hideExercise = document.getElementById('button_hideExercise');
var button_showHiddenExercises = document.getElementById('button_showHiddenExercises');
var button_tabProfile = document.getElementById('button_tabProfile');
var button_saveProfileData =document.getElementById('button_saveProfileData');

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
var div_graphExercise = document.getElementById('div_graphExercise');
var div_profile = document.getElementById('div_profile');


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
var input_Username = document.getElementById('input_Username');
var input_exerciseID = document.getElementById('input_exerciseID');
var input_onlineIndicator = document.getElementById('input_onlineIndicator');
var input_RememberMe = document.getElementById('input_RememberMe');
var input_chatText = document.getElementById('input_chatText');
var input_doneExerciseAdditional = document.getElementById('input_doneExerciseAdditional');
var input_paceConstant = document.getElementById('input_paceConstant');
var input_personalEmailAddress = document.getElementById('input_personalEmailAddress');
var input_personalColor = document.getElementById('input_personalColor');
var input_allowEmails =  document.getElementById('input_allowEmails');
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
    showHiddenExercises: false,
};



/******************************************************************************************************************
*******************************************************************************************************************
*                                               ONCLICK, ONCHANGE 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/


button_SignIn.onclick = function () {
    SOCKET.emit('SignIn', { username: input_Username.value.toLowerCase(), password: input_Password.value, remember: input_RememberMe.checked });
};

button_SignUp.onclick = function () {
    SOCKET.emit('SignUp', { username: input_Username.value.toLowerCase(), password: input_Password.value });
};

input_historyFromDate.onchange = function () {
    if (!common.isValidDate(common.createZeroDate(input_historyFromDate.value))) {
        input_historyFromDate.value = common.getDateFormat(common.createZeroDate(), "YYYY-MM-DD");
    }
};

input_historyToDate.onchange = function () {
    if (!common.isValidDate(common.createZeroDate(input_historyToDate.value))) {
        input_historyToDate.value = common.getDateFormat(common.createZeroDate(), "YYYY-MM-DD");
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
    div_profile.style.display = "none";
    requestGraphUpdate();
};

button_tabPersonalOverview.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "inline-block";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    div_profile.style.display = "none";
    button_updateHistory.click();
};

button_tabCompetition.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "inline-block";
    div_events.style.display = "none";
    div_profile.style.display = "none";
};

button_tabStatistics.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "inline-block";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    div_profile.style.display = "none";
    requestAchievementList();
};


button_tabExerciseOverview.onclick = function () {
    div_ExerciseOverview.style.display = "inline-block";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    div_profile.style.display = "none";
};

button_tabEventLog.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "inline-block";
    div_profile.style.display = "none";
    div_eventLog.scrollTop = div_eventLog.scrollHeight;
};

button_tabProfile.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "none";
    div_statistics.style.display = "none";
    div_MainPage.style.display = "none";
    div_competition.style.display = "none";
    div_events.style.display = "none";
    div_profile.style.display = "inline-block";
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

    let paceUnitOptions = common.getPaceUnitOptions(select_exerciseUnit.value);


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

button_hideExercise.onclick = function () {
    hideExercise(input_exerciseID.value);
};

button_showHiddenExercises.onclick = function () {
    RUNTIME_CONFIG.showHiddenExercises = !RUNTIME_CONFIG.showHiddenExercises;
    if (RUNTIME_CONFIG.showHiddenExercises) {
        button_showHiddenExercises.style.backgroundColor = "green";
    }
    else {
        button_showHiddenExercises.style.backgroundColor = "";
    }
    requestExerciseListUpdate();
};

select_statisticsExercise.onchange = function () {
    requestExerciseStatistic(select_statisticsExercise.value);
    requestExerciseGraphUpdate();
};

button_saveProfileData.onclick = function (){
    sendPersonalProfileData();
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
        common.addOption(document, select_exerciseUnit, paceUnitsArray[iterator], paceUnitsArray[iterator]);
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
        input_personalEmailAddress.value = data.profileData.email;
        input_personalColor.value = data.profileData.color;
        input_allowEmails.checked = data.profileData.allowEmail;

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
    fromDate = common.createZeroDate(input_historyFromDate.value);
    toDate = common.createZeroDate(input_historyToDate.value);
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
    generateMainGraph(data, canvas_graphHistory, ctx_graphHistory);
});

SOCKET.on("refreshExerciseGraph", function (data) {
    var border = 2;
    if (document.getElementById("canvas_graphExercise")) {
        canvas_graphExercise = document.getElementById("canvas_graphExercise");
        canvas_graphExercise.remove();
    }
    canvas_graphExercise = document.createElement("canvas");
    canvas_graphExercise.id = "canvas_graphExercise";
    div_graphExercise.appendChild(canvas_graphExercise);
    var ctx_graphHistory = canvas_graphExercise.getContext("2d");
    canvas_graphExercise.height = div_graphExercise.clientHeight - border;
    canvas_graphExercise.width = div_graphExercise.clientWidth - border;
    generateExerciseGraph(data, canvas_graphExercise, ctx_graphHistory);
});

SOCKET.on("refresh", function (data) {
    var selIndex = select_historyShowName.selectedIndex;
    select_historyShowName.innerHTML = "";
    for (var names in data.playerList) {
        common.addOption(document, select_historyShowName, names, names);
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
    paragraph_statisticsExercise.innerHTML = "";
    for (var key in data) {
        paragraph_statisticsExercise.innerHTML += " | " + common.HTMLBold(common.translate(key)) + ": " + common.translate(data[key]);
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

function requestExerciseGraphUpdate() {
    SOCKET.emit("requestExerciseGraphUpdate", { id: select_statisticsExercise.value });
}

function requestExerciseListUpdate() {
    SOCKET.emit("requestExerciseListUpdate", { data: true });
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
    let paceUnitOptions = common.getPaceUnitOptions(select_exerciseUnit.value);

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

function hideExercise(id) {
    SOCKET.emit("hideExercise", data = {
        id: id,
    });
}

function sendPersonalProfileData(){
    SOCKET.emit("requestProfileUpdate", data = {
        email: input_personalEmailAddress.value,
        allowEmail: input_allowEmails.checked,
        color: input_personalColor.value,
    });
}




/******************************************************************************************************************
*******************************************************************************************************************
*                                               TABLE/CONTENT GENERATION 
*******************************************************************************************************************
*******************************************************************************************************************
******************************************************************************************************************/
var OverallChart;
var ExerciseChart;

function generateExerciseGraph(data, canvas, ctx) {
    var dataSetMeta = [];
    var applyFilter = false;
    var filterSettings = {};
    if (ExerciseChart != undefined) {
        for (let dataIterator = 0; dataIterator < ExerciseChart.config.data.datasets.length; dataIterator++) {
            dataSetMeta.push(ExerciseChart.getDatasetMeta(dataIterator));

            if (dataSetMeta[dataIterator].hidden == undefined || dataSetMeta[dataIterator].hidden == undefined == null) {
                dataSetMeta[dataIterator].hidden = ExerciseChart.config.data.datasets[dataIterator].hidden;
            }

            filterSettings[ExerciseChart.config.data.datasets[dataIterator].label] = dataSetMeta[dataIterator].hidden;
        }
        applyFilter = true;

        ExerciseChart.data.labels.pop();
        ExerciseChart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        ExerciseChart.update();
        canvas.height = div_graphExercise.clientHeight;
        canvas.width = div_graphExercise.clientWidth - 10;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ExerciseChart = undefined;

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

    if (ExerciseChart == undefined) {
        ExerciseChart = new Chart(ctx, {
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
        ExerciseChart.config.type = 'bar';
        ExerciseChart.data.datasets = datasets;
        ExerciseChart.data.labels = labels;
        ExerciseChart.update();
    }

}
function generateMainGraph(data, canvas, ctx) {
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
                cell.innerHTML += common.translate(achievementKey);
                cell.onclick = function () {
                    common.sortTable(this, table_achievementsDone);
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
                div.innerHTML += "Level " + achievementListPlayer.notEarnedAchievements[achievementIterator].achievementLevel + " - " + common.translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);

            }
            else {
                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.innerHTML += common.translate(achievementListPlayer.notEarnedAchievements[achievementIterator][achievementKey]);

            }
        }






    }
    common.sortTable({ cellIndex: 0 }, table_achievementsDone);
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
            cell.innerHTML += common.translate("Name");
        }
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML += common.translate(playerid);


        for (var playerKeyName in player) {
            playerKeyContent = player[playerKeyName];
            if (playerIterator == 0) {
                cell = headerRow.insertCell(headerRow.cells.length);
                cell.innerHTML += common.translate(playerKeyName);
                cell.onclick = function () {
                    common.sortTable(this, table_allPlayersTable);
                };
            }

            cell = bodyRow.insertCell(bodyRow.cells.length);
            cell.innerHTML += common.translate(playerKeyContent);
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
            playerKeyContent = common.createZeroDate(playerKeyContent);
            playerKeyContent = common.getDateFormat(playerKeyContent, "DD.MM.YYYY");
        }
        if (playerKeyName === "earnedAchievements" || playerKeyName === "notEarnedAchievements") {
            continue;
        }
        if (Object.keys(playerKeyContent).length > 0 && !common.checkIfString(playerKeyContent)) {
            for (var objectKeyName in playerKeyContent) {
                objectKeyContent = playerKeyContent[objectKeyName];
                cell = headerRow.insertCell(headerRow.cells.length);
                cell.innerHTML += common.translate(objectKeyName);
                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.innerHTML += common.translate(objectKeyContent);
            }
        }
        else {
            cell = headerRow.insertCell(headerRow.cells.length);
            cell.innerHTML += common.translate(playerKeyName);
            cell = bodyRow.insertCell(bodyRow.cells.length);
            cell.innerHTML += common.translate(playerKeyContent);
        }
    }
}

function generateExerciseList(data) {
    let start = Date.now();

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


    for (var exerciseIterator = 0; exerciseIterator < data.exercises.length; exerciseIterator++) {

        var exercise = data.exercises[exerciseIterator];
        var exerciseId = exercise.id;
        isHiddenExercise = false;

        if (exercise.deleted) {
            continue;
        }
        if (exercise.isHidden[Name] != undefined) {
            //defined!
            if (exercise.isHidden[Name]) {
                isHiddenExercise = true;
                if (!RUNTIME_CONFIG.showHiddenExercises) {
                    continue;
                }

            }
        }

        exercisesInTable++;
        common.addOption(document, select_doneExercise, exerciseId, exercise.name + " (" + exercise.unit + ")" + " | " + exercise.equipment + " | " + common.translate(exercise.factor));

        bodyRow = tBodyExerciseTable.insertRow(tBodyExerciseTable.rows.length);
        var toolTipText = "";
        var playerName;

        for (var voters in exercise.votes) {
            content = exercise.votes[voters];
            toolTipText += voters + ": <br>";
            for (var contentItemNum in content) {
                contentItem = content[contentItemNum];
                toolTipText += common.translate(contentItemNum) + ": " + common.translate(contentItem) + "<br>";
            }
        }

        //id
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.id;
        cell.classList.add("id");
        cell.classList.add("hiddenCell");

        //name
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.name;
        cell.classList.add("name");

        //factor
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.factor);
        cell.classList.add("factor");

        //points
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.points);
        cell.classList.add("points");

        //difficulty
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.difficulty);
        cell.classList.add("difficulty");

        //difficulty10
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.difficulty10);
        cell.classList.add("difficulty10");

        //difficulty100
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.difficulty100);
        cell.classList.add("difficulty100");

        //type
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.type;
        cell.classList.add("type");

        //bothSides
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.bothSides);
        cell.classList.add("bothSides");

        //unit
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.unit;
        cell.classList.add("unit");

        //equipment
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.equipment;
        cell.classList.add("equipment");

        //usesWeight
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.usesWeight);
        cell.classList.add("usesWeight");

        //baseWeight
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = common.translate(exercise.baseWeight);
        cell.classList.add("baseWeight");

        //creator
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.creator;
        cell.classList.add("creator");

        //pointsPerPlayer
        cell = bodyRow.insertCell(bodyRow.cells.length);
        let max = 0;
        let bestPlayer = "Keiner";
        for (playerName in exercise.pointsPerPlayer) {
            let points = exercise.pointsPerPlayer[playerName];
            if (points > max) {
                max = points;
                bestPlayer = playerName;
            }

        }

        cell.innerHTML = bestPlayer + ": " + common.translate(max);
        cell.classList.add("pointsPerPlayer");

        //repsPerPlayer
        cell = bodyRow.insertCell(bodyRow.cells.length);
        max = 0;
        bestPlayer = "Keiner";
        for (playerName in exercise.repsPerPlayer) {
            let points = exercise.repsPerPlayer[playerName];
            if (points > max) {
                max = points;
                bestPlayer = playerName;
            }
        }
        cell.innerHTML = bestPlayer + ": " + common.translate(max);
        cell.classList.add("repsPerPlayer");

        //paceConstant
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.paceConstant;
        cell.classList.add("paceConstant");

        //isPaceExercise
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exercise.isPaceExercise;
        cell.classList.add("isPaceExercise");

        //iterator
        cell = bodyRow.insertCell(bodyRow.cells.length);
        cell.innerHTML = exerciseIterator;
        cell.classList.add("iterator");
        cell.classList.add("hiddenCell");

        if (tBodyExerciseTable.rows.length == 1) {
            for (let cellIds = 0; cellIds < bodyRow.cells.length; cellIds++) {
                headerArray.push(bodyRow.cells[cellIds].className);
            }
        }

        common.addToolTip(toolTipText, "tableTooltip", bodyRow);
        if (isHiddenExercise) {
            bodyRow.classList.add("hiddenExercise");
        }
        bodyRow.onclick = function () { exerciseTableBodyRowClick(this, data); };

    }

    headerRow = theadExerciseTable.insertRow(0);

    for (headerContents = 0; headerContents < headerArray.length; headerContents++) {
        cell = headerRow.insertCell(headerContents);
        cell.innerHTML = common.translate(headerArray[headerContents]);
        if (headerArray[headerContents].includes("hiddenCell")) {
            cell.classList.add("hiddenCell");
        }
        cell.onclick = function () {
            common.sortTable(this, table_exerciseTable);
            exerciseTableSortMode = this;
        };
    }
    if (exercisesInTable > 0) {
        input_exerciseID.onchange();
    }

    common.sortSelect(document, select_doneExercise);
    select_statisticsExercise.innerHTML = select_doneExercise.innerHTML;
    select_doneExercise.selectedIndex = selIndex;
    select_statisticsExercise.selectedIndex = selIndex;

    let end = Date.now();
    //sendChatMessage(`exercise table generation took ${end - start} ms`);
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
                    value = common.createZeroDate(key[historyItemsIterator]);
                    if (value < minDate) {
                        minDate = value;
                    }
                    if (maxDate < value) {
                        maxDate = value;
                    }
                    value = common.getDateFormat(value, "DD.MM.YYYY");

                }
                else {
                    value = key[historyItemsIterator];
                }
                if (tBodyTable.rows.length == 1) {
                    headerArray.push(historyKeys);
                }

                cell = bodyRow.insertCell(bodyRow.cells.length);
                cell.classList.add(historyKeys);
                cell.innerHTML = common.translate(value);
                if (historyKeys === "id" || historyKeys === "exerciseId") {
                    cell.classList.add("hiddenCell");
                }
                if (historyKeys === "points") {
                    selectionSum += Number(value);

                }
            }


            if (!rowNotUsed) {
                common.addToolTip(toolTipText, "tableTooltip", bodyRow);
                let paceUnitOptions = common.getPaceUnitOptions(unit);
                if (paceUnitOptions.isPaceUnit) {
                    bodyRow.getElementsByClassName("count")[0].innerHTML += " " + paceUnitOptions.first + ", " + common.translate(countAdditional) + " " + paceUnitOptions.sec + " (" + common.translate(pace) + " " + paceUnitOptions.first + "/" + paceUnitOptions.sec + ")";
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
                deleteCell.innerHTML = common.translate("Löschen");
                if (tBodyTable.rows.length == 1) {
                    headerArray.push("Löschtaste");
                }
                deleteCell.onclick = function () {
                    var id = this.getElementsByClassName("id")[0].innerHTML;
                    var date = common.getDateFormat(this.getElementsByClassName("date")[0].innerHTML, "YYYY-MM-DD", "DD.MM.YYYY");

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
        cell.innerHTML = common.translate(headerArray[headerContents]);
        if (headerArray[headerContents] === "id" || headerArray[headerContents] === "exerciseId") {
            cell.classList.add("hiddenCell");
        }
        cell.onclick = function () {
            common.sortTable(this, table);
        };



    }



    input_sumSelection.value = common.translate(selectionSum);
    var selectionCount = dateDiff(minDate, maxDate);
    input_avgSelection.value = common.translate(Number(selectionSum) / (selectionCount + 1));


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
        common.sortTable(this, table_dailyWins);
    };
    cell = headerRow.insertCell(1);
    cell.innerHTML = "Tagessiege";
    cell.onclick = function () {
        common.sortTable(this, table_dailyWins);
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
        common.sortTable(this, table_monthlyWins);
    };
    cell = headerRow.insertCell(1);
    cell.innerHTML = "Monatssiege";
    cell.onclick = function () {
        common.sortTable(this, table_monthlyWins);
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
    common.sortTable(sortIndex, table_monthlyWins);
    common.sortTable(sortIndex, table_dailyWins);
    common.sortTable(sortIndex, table_monthlyWins);
    common.sortTable(sortIndex, table_dailyWins);
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




function dateDiff(date1, date2) {
    return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
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
    let paceUnitOptions = common.getPaceUnitOptions(select_exerciseUnit.value);
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

function initialize() {
    //this month
    var thisMonth = function () {
        var today = common.createZeroDate();
        var thisMonthBegin = common.createZeroDate(new Date(today.getFullYear(), today.getMonth(), 1));
        var thisMonthEnd = common.createZeroDate(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        thisMonthEnd.setDate(thisMonthEnd.getDate() - 1);

        return {
            thisMonthBegin: thisMonthBegin,
            thisMonthEnd: thisMonthEnd,
        };
    };

    thisMonthBegin = thisMonth().thisMonthBegin;
    thisMonthEnd = thisMonth().thisMonthEnd;
    thisMonthBegin = common.getDateFormat(thisMonthBegin, "YYYY-MM-DD");
    thisMonthEnd = common.getDateFormat(thisMonthEnd, "YYYY-MM-DD");

    input_historyFromDate.value = thisMonthBegin;
    input_historyToDate.value = thisMonthEnd;

    //Today
    today = common.createZeroDate();
    input_doneExerciseDate.value = common.getDateFormat(today, "YYYY-MM-DD");
    input_graphFromDate.value = "2018-08-01";
    input_graphToDate.value = common.getDateFormat(today, "YYYY-MM-DD");

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
    SOCKET.emit('SignIn', { username: input_Username.value.toLowerCase(), password: input_Password.value, remember: false, loginToken: LOGIN_COOKIE });
}

function logout() {
    deleteCookie("loginCookie");
    location.reload();
}


function resetExerciseEntryMask() {
    $(".modifyExercise").val("");
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


function exerciseTableBodyRowClick(bodyRow, data) {
    var id = bodyRow.getElementsByTagName("td")[0].innerHTML;
    var iterator = bodyRow.getElementsByClassName("iterator")[0].innerHTML;
    if (input_exerciseID.value == id) {
        resetExerciseEntryMask();
    }
    else {

        input_exerciseName.value = data.exercises[iterator].name;
        input_exerciseID.value = id;

        select_exerciseEquipment.value = data.exercises[iterator].equipment;
        select_exerciseType.value = data.exercises[iterator].type;
        select_exerciseUnit.value = data.exercises[iterator].unit;
        select_bothSides.value = data.exercises[iterator].bothSides;

        if (data.exercises[iterator].votes[Name] == undefined) {
            input_exerciseBaseWeight.value = data.exercises[iterator].baseWeight;
            input_exerciseDifficulty.value = data.exercises[iterator].difficulty;
            input_exerciseDifficulty10.value = data.exercises[iterator].difficulty10;
            input_exerciseDifficulty100.value = data.exercises[iterator].difficulty100;
            input_paceConstant.value = data.exercises[iterator].paceConstant;
        }
        else {
            input_exerciseBaseWeight.value = data.exercises[iterator].votes[Name].baseWeight;
            input_exerciseDifficulty.value = data.exercises[iterator].votes[Name].difficulty;
            input_exerciseDifficulty10.value = data.exercises[iterator].votes[Name].difficulty10;
            input_exerciseDifficulty100.value = data.exercises[iterator].votes[Name].difficulty100;
            input_paceConstant.value = data.exercises[iterator].votes[Name].paceConstant;
            input_exerciseComment.value = data.exercises[iterator].votes[Name].comment;
        }

        if (bodyRow.classList.contains("hiddenExercise")) {
            button_hideExercise.innerHTML = "Einblenden";
        }
        else {
            button_hideExercise.innerHTML = "Ausblenden";
        }

    }

    input_exerciseID.onchange();
    select_exerciseUnit.onchange();
}






