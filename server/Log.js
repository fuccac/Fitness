
// @ts-nocheck
/*jshint esversion: 6 */
Config = require("./Config");
config = new Config();
var fs = require('fs');
Calc = require("./calc");
calc = new Calc();

class Log {
    constructor() {
        this.LOG_PATH = config.LOG_PATH;
        this.logUploadTimer = 0;

    }

    log(str, showInConsole, severity) {
        var errorCode;
        if (showInConsole == undefined) {
            showInConsole = false;
        }
        switch (severity) {
            case 0:
                errorCode = "I";
                break;
            case 1:
                errorCode = "W";
                break;
            case 2:
                errorCode = "E";
                showInConsole = true;
                break;
            case 3:
                errorCode = "X";
                showInConsole = true;
                break;
            default:
                errorCode = "I";
        }


        var date = calc.createViennaDate();
        fs.appendFile(config.LOG_PATH, calc.getDateFormat(date,"DD.MM.YYYY") + " | " + errorCode + " | " + date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() + " - " + str + "\r\n", function (err) {

        });
        if (showInConsole) {
            console.log(calc.getDateFormat(date,"DD.MM.YYYY") + " | " + errorCode + " | " + date.getHours()+":"+date.getMinutes()+":"+date.getSeconds() + " - " + str);
        }
    }

}

module.exports = Log;