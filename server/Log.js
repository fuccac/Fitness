
// @ts-nocheck
/*jshint esversion: 6 */
Config = require("./Config");
config = new Config();
var fs = require('fs');

class Log {
    constructor() {
        this.LOG_PATH = config.LOG_PATH;

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
                break;
            case 3:
                errorCode = "X";
                break;
            default:
                errorCode = "I";
        }


        var date = new Date();
        fs.appendFile(config.LOG_PATH, date.toLocaleDateString() + " | " + errorCode + " | " + date.toLocaleTimeString() + " - " + str + "\r\n", function (err) {

        });
        if (showInConsole) {
            console.log(date.toLocaleDateString() + " | " + errorCode + " | " + date.toLocaleTimeString() + " - " + str);
        }
    }

}

module.exports = Log;