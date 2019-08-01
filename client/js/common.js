// @ts-nocheck
/*jshint esversion: 6 */
function Common() {

    this.sortSelect = function (doc, selElem) {
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
            var op = doc.createElement("OPTION");
            op.text = tmpAry[i][0];
            op.value = tmpAry[i][1];
            //var op = new Option(tmpAry[i][0], tmpAry[i][1]);
            selElem.options[i] = op;
        }
        return;
    };

    this.addOptionGroup = function (doc, select, Name) {
        var option = doc.createElement('OPTGROUP');
        option.label = Name;
        option.id = Name;
        select.add(option);
    };

    this.addToolTip = function (toolTipText, toolTipClass, element) {
        element.classList.add(toolTipClass);
        element.innerHTML += "<span class=\"tooltiptext\">" + toolTipText + "</span>";
    };

    this.addOption = function (doc, select, key, Name, group) {
        var option = doc.createElement('option');

        if (group == undefined) {
            option.text = Name;
            option.value = key;
            select.add(option);
            return;
        }

        var optionGroup = doc.getElementById(group);
        if (optionGroup == undefined) {
            this.addOptionGroup(doc, select, group);
            optionGroup = doc.getElementById(group);
        }
        option.text = Name;
        option.value = key;
        optionGroup.appendChild(option);
    };

    this.sortTable = function (n, table) {
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
                        valX = createZeroDate(this.getDateFormat(x.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                        valY = createZeroDate(this.getDateFormat(y.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
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
                        valX = createZeroDate(this.getDateFormat(x.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
                        valY = createZeroDate(this.getDateFormat(y.innerHTML, "YYYY-MM-DD", "DD.MM.YYYY"));
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
    };

    this.isValidDate = function (d) {
        return d instanceof Date && !isNaN(d);
    };

    this.getPaceUnitOptions = function (unit) {
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

    };

    this.getDateInfo = function (date) {
        let dateInfo = {
            isToday: false,
            isLast5Days: false,
            isThisMonth: false,
            isLastMonth: false,
            day: 0,
            month: 0,
            year: 0,
            historyDateString: "",
            currentMonthName: "",
        };
        let MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        let todayDate = this.createZeroDate(new Date());
        let thisMonth = todayDate.getMonth();
        let thisYear = todayDate.getFullYear();
        let currentDate = new Date(date);
        let dateMinus5Days = this.createZeroDate(new Date());
        dateMinus5Days.setDate(dateMinus5Days.getDate() - 5);

        lastMonth = this.createZeroDate(new Date());
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        let lastMonthYear = lastMonth.getFullYear();
        lastMonth = lastMonth.getMonth();



        if (currentDate.getDate() == todayDate.getDate() && currentDate.getMonth() == todayDate.getMonth() && currentDate.getFullYear() == todayDate.getFullYear()) {
            dateInfo.isToday = true;
        }

        if (currentDate.getMonth() == thisMonth && currentDate.getFullYear() == thisYear) {
            dateInfo.isThisMonth = true;
        }

        if (currentDate > dateMinus5Days) {
            dateInfo.isLast5Days = true;
        }

        if (currentDate.getMonth() == lastMonth && currentDate.getFullYear() == lastMonthYear) {
            dateInfo.isLastMonth = true;
        }

        dateInfo.day = currentDate.getDate();
        dateInfo.month = currentDate.getMonth();
        dateInfo.year = currentDate.getFullYear();
        dateInfo.historyDateString = this.getDateFormat(currentDate, "YYYY-MM-DD");
        dateInfo.currentMonthName = MONTHS[Number(dateInfo.historyDateString.substring(5, 5 + 2)) - 1] + " " + dateInfo.historyDateString.substring(0, 0 + 4);

        return dateInfo;

    };

    this.getDateFormat = function (date, format, fromFormat) {
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

    };

    this.createViennaDate = function () {
        viennaDate = new Date().toLocaleString("en-US", { timeZone: "Europe/Vienna" });
        viennaDate = new Date(viennaDate);
        return viennaDate;
    };



    this.createZeroDate = function (date) {
        if (typeof date === 'undefined') {
            zeroDate = new Date();//.toLocaleString("en-US", {timeZone: "Europe/Vienna"});
            zeroDate = new Date(zeroDate);
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
    };



    this.daysBetween = function (date1, date2) {
        var one_day = 1000 * 60 * 60 * 24;
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();
        var difference_ms = date2_ms - date1_ms;
        return Math.abs(difference_ms / one_day);
    };

    this.HTMLBold = function (string) {
        return "<b>" + string + "</b>";
    };

    this.HTMLColor = function (string, color) {
        if (color == undefined) {
            color = "black";
        }
        return "<span style=\"color:" + color + "\">" + string + "</span>";
    };



    this.checkIfString = function (value) {
        return Object.prototype.toString.call(value) === "[object String]";
    };

    this.checkIfDate = function (value) {
        return Object.prototype.toString.call(value) === "[object Date]";
    };

    this.checkIfNumber = function (value) {
        return (typeof value == 'number');
    };

    this.translate = function (word) {
        if (this.checkIfNumber(word)) {
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
    };
}

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Common;
    }
    exports.Common = Common;
} else {
    window.Common = Common;
}