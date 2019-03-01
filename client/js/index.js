// @ts-nocheck
/*jshint esversion: 6 */
var Name = "";

//BUTTONS
var button_SignIn = document.getElementById('button_SignIn');
var button_SignUp = document.getElementById('button_SignUp');
var button_createExercise = document.getElementById('button_createExercise');
var button_deleteExercise = document.getElementById('button_deleteExercise');
var button_tabExerciseOverview = document.getElementById('button_tabExerciseOverview');
var button_tabPersonalOverview = document.getElementById('button_tabPersonalOverview');
var button_doneExerciseSend = document.getElementById('button_doneExerciseSend');
var button_updateHistory = document.getElementById('button_updateHistory');
//CANVAS
//CTX
//DIVS
var div_Sign = document.getElementById('div_Sign');
var div_ExerciseOverview = document.getElementById('div_ExerciseOverview');
var div_addNewExercise = document.getElementById('div_addNewExercise');
var div_navigation = document.getElementById('div_navigation');
var div_PersonalOverview = document.getElementById('div_PersonalOverview');
var div_addWorkout = document.getElementById('div_addWorkout');
var div_PersonalInfo = document.getElementById('div_PersonalInfo');
var div_exerciseHistory = document.getElementById('div_exerciseHistory');
var div_exerciseHistoryControl = document.getElementById('div_exerciseHistoryControl');
//FONTS
var font_Courier = "Courier New";
//INPUTS
var input_Password = document.getElementById('input_Password');
var input_UserName = document.getElementById('input_Username');
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
//SELECTS
var select_exerciseType = document.getElementById('select_exerciseType');
var select_exerciseUnit = document.getElementById('select_exerciseUnit');
var select_exerciseEquipment = document.getElementById('select_exerciseEquipment');
var select_doneExercise = document.getElementById('select_doneExercise');
var select_historyShowName = document.getElementById('select_historyShowName');
//TABLES
var table_exerciseTable = document.getElementById('table_exerciseTable');
var table_personalTable = document.getElementById('table_personalTable');
var table_exerciseHistory = document.getElementById('table_exerciseHistory');
var socket = io();


var screenLog = document.querySelector('#screen-log');
document.addEventListener('mousemove', logKey);



var thisMonth = function () {
    var today = new Date();
    var thisMonthBegin = new Date(today.getFullYear(), today.getMonth(), 1);
    var thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    thisMonthEnd.setDate(thisMonthEnd.getDate() - 1);



    return {
        thisMonthBegin: thisMonthBegin,
        thisMonthEnd: thisMonthEnd,
    };
};

function getDateFormat(date, format, fromFormat) {
    var addZeroMonth = "";
    var addZeroDay = "";
    if (typeof fromFormat === 'undefined') { fromFormat = 'default'; }

    if (format === "YYYY-MM-DD") {
        if (date.getMonth() < 10) {
            addZeroMonth = "0";
        }
        if (date.getDate() < 10) {
            addZeroDay = "0";
        }
        date = date.getFullYear() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + addZeroDay + date.getDate();
    }
    if (format === "DD-MM-YYYY") {
        if (date.getMonth() < 10) {
            addZeroMonth = "0";
        }
        if (date.getDate() < 10) {
            addZeroDay = "0";
        }
        date =  addZeroDay + date.getDate() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + date.getFullYear();
    }
    if (format === "DD.MM.YYYY") {
        if (date.getMonth() < 10) {
            addZeroMonth = "0";
        }
        if (date.getDate() < 10) {
            addZeroDay = "0";
        }
        date =  addZeroDay + date.getDate() + "." + addZeroMonth + (date.getMonth() + 1) + "." + date.getFullYear();
    }

    return date;


}


//this month
thisMonthBegin = thisMonth().thisMonthBegin;
thisMonthEnd = thisMonth().thisMonthEnd;
thisMonthBegin = getDateFormat(thisMonthBegin, "YYYY-MM-DD");
thisMonthEnd = getDateFormat(thisMonthEnd, "YYYY-MM-DD");

input_historyFromDate.value = thisMonthBegin;
input_historyToDate.value = thisMonthEnd;



//Today
today = new Date();
input_doneExerciseDate.value = getDateFormat(today, "YYYY-MM-DD");

//sign in code
button_SignIn.onclick = function () {
    socket.emit('SignIn', { username: input_UserName.value, password: input_Password.value });
};
button_SignUp.onclick = function () {
    socket.emit('SignUp', { username: input_UserName.value, password: input_Password.value });
};
socket.on('signInResponse', function (data) {
    if (data.success) {
        Name = input_UserName.value;
        div_Sign.style.display = 'none';
        div_ExerciseOverview.style.display = 'inline-block';
        div_navigation.style.display = 'inline-block';
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

input_historyFromDate.onchange = function () {
    if (!isValidDate(new Date(input_historyFromDate.value))) {
        input_historyFromDate.value = getDateFormat(new Date(), "YYYY-MM-DD");
    }
};

input_historyToDate.onchange = function () {
    if (!isValidDate(new Date(input_historyToDate.value))) {
        input_historyToDate.value = getDateFormat(new Date(), "YYYY-MM-DD");
    }
};

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}


button_updateHistory.onclick = function () {
    socket.emit("requestUpdate", true);
};

button_doneExerciseSend.onclick = function () {
    if (checkForEmptyBoxesDoneExercise()) {
        exerciseDone('addDoneExercise');
    }
    else {
        alert("Nicht alle Inputboxen wurden ausgefüllt!");
    }
};

button_tabPersonalOverview.onclick = function () {
    div_ExerciseOverview.style.display = "none";
    div_PersonalOverview.style.display = "inline-block";
};


button_tabExerciseOverview.onclick = function () {
    div_ExerciseOverview.style.display = "inline-block";
    div_PersonalOverview.style.display = "none";
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

socket.on("refresh", function (data) {
    generateExerciseList(data);
    generatePlayerInfoTable(data);
    fromDate = new Date(input_historyFromDate.value);
    toDate = new Date(input_historyToDate.value);
    generateHistoryList(data, table_exerciseHistory, true, Name, fromDate, toDate);
});

function setTime(d, h, m, s) {
    d.setHours(h);
    d.setMinutes(m);
    d.setSeconds(s);
    return d;
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
            playerKeyContent = new Date(playerKeyContent);
            playerKeyContent = getDateFormat(playerKeyContent, "DD.MM.YYYY");
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
        addOption(select_doneExercise, exerciseId, exercise.name + " (" + exercise.unit + ")" + " | " + exercise.equipment + " | " + translate(exercise.factor));

        bodyRow = tBodyExerciseTable.insertRow(rowNumber);
        rowNumber++;
        var cellNumber = 0;
        var toolTipText = "";
        for (var exerciseKeys in exercise) {
            key = exercise[exerciseKeys];

            if (exerciseKeys === "comment") {
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
        addToolTip(toolTipText, "tooltip", bodyRow);

        bodyRow.onclick = function () {
            var id = this.getElementsByTagName("td")[0].innerHTML;
            input_exerciseName.value = data.exercises[id].name;
            input_exerciseBaseWeight.value = data.exercises[id].votes[Name].baseWeight;
            input_exerciseDifficulty.value = data.exercises[id].votes[Name].difficulty;
            input_exerciseDifficulty10.value = data.exercises[id].votes[Name].difficulty10;
            input_exerciseDifficulty100.value = data.exercises[id].votes[Name].difficulty100;
            input_exerciseComment.value = data.exercises[id].votes[Name].comment;
            select_exerciseEquipment.value = data.exercises[id].equipment;
            select_exerciseType.value = data.exercises[id].type;
            select_exerciseUnit.value = data.exercises[id].unit;
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
        };
    }
}

function generateHistoryList(data, table, nameSpecific, name, fromDate, toDate) {
    setTime(fromDate, 0, 0, 0);
    setTime(toDate, 0, 0, 0);

    var theadTable = table.tHead;
    var tBodyTable = table.tBodies[0];
    tBodyTable.innerHTML = "";
    theadTable.innerHTML = "";
    var headerArray = [];
    var cell;
    var rowNumber = 0;
    var rowNotUsed = false;

    for (var historyId in data.history) {
        entryDate = new Date(historyId);
        setTime(entryDate, 0, 0, 0);
        if (entryDate < fromDate || entryDate > toDate) {
            continue;
        }
        var historyEntry = data.history[historyId];
        var toolTipText = "No Text";
        for (var iterator = 0; iterator < historyEntry.id.length; iterator++) {
            if (!rowNotUsed) {
                bodyRow = tBodyTable.insertRow(rowNumber);
                rowNumber++;
                var cellNumber = 0;
            }

            rowNotUsed = false;

            for (var historyKeys in historyEntry) {
                key = historyEntry[historyKeys];
                entryDate = new Date(historyEntry.date[iterator]);
                if (nameSpecific) {
                    if (historyEntry.playerName[iterator] != name) {
                        rowNotUsed = true;
                        break;
                    }
                    else {
                        if (historyKeys === "exerciseId" || historyKeys === "playerName" || historyKeys === "id") {
                            continue;
                        }
                    }
                }
                else {
                    if (historyKeys === "exerciseId" || historyKeys === "id") {
                        continue;
                    }
                }

                var value = "";
                if (historyKeys === "date") {
                    value = new Date(key[iterator]);
                    value = getDateFormat(value, "DD.MM.YYYY");
                }
                else {
                    value = key[iterator];
                }
                if (rowNumber == 1) {
                    headerArray.push(historyKeys);
                }
                cell = bodyRow.insertCell(cellNumber);
                cell.innerHTML = translate(value);

                cellNumber++;
            }
            if (!rowNotUsed) {
                addToolTip(toolTipText, "tooltip", bodyRow);
                bodyRow.onclick = function () {
                    alert("no click");
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
}

function addOption(select, key, Name) {
    var option = document.createElement('option');
    option.text = Name;
    option.value = key;
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
        input_exerciseComment.value != ""
    ) {
        return true;
    }
    else {
        return false;
    }
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
        comment: input_exerciseComment.value,
    });
}


function checkIfString(value) {
    return Object.prototype.toString.call(playerKeyContent) === "[object String]";
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
//checks if clients mousepos is on the side of the browser and if so, scrolls
function logKey(e) {
    var maxX = e.view.outerWidth;
    var maxY = e.view.outerHeight;

    xPercent = (e.clientX / maxX) * 100;
    yPercent = (e.clientY / maxY) * 100;

}
//scrolls by x,y
function scroll(x, y) {
    div_Game.scrollBy(x, y);
}

document.onkeydown = function (event) {
    if (event.keyCode === 49) //1
        button_tabExerciseOverview.onclick();
    else if (event.keyCode === 50) //2
        button_tabPersonalOverview.onclick();
};

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
                if (isValidDate(new Date(x.innerHTML))) {
                    valX = new Date(x.innerHTML);
                    valY = new Date(y.innerHTML);
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
                if (!isNaN(Number(x.innerHTML))) {
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

function translate(word) {
    if (checkIfNumber(word)) {
        return word.toFixed(2);
    }
    word = word.toString();
    switch (word) {
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
        default:
            return word;
    }
}
