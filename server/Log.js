
// @ts-check
/*jshint esversion: 6 */
var Config = require("./Config");
var config = new Config();
var fs = require('fs');
var Calc = require("./calc");
var calc = new Calc();
var Common = require("../client/js/common");
var common = new Common();

class Log {
    constructor() {
        this.LOG_PATH = config.LOG_PATH;
        this.logUploadTimer = 0;
        this.size = 0;
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


        var date = common.createViennaDate();
        fs.appendFile(config.LOG_PATH, common.getDateFormat(date, "DD.MM.YYYY") + " | " + errorCode + " | " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " - " + str + "\r\n", function (err) {
            fs.stat(config.LOG_PATH, (err, stats) => {
                if (err) {
                    console.log(`LogFile doesn't exist.`);
                } else {
                    this.size = stats.size/1000000;
                }
            });
        }.bind(this));
        if (showInConsole) {
            console.log(common.getDateFormat(date, "DD.MM.YYYY") + " | " + errorCode + " | " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " - " + str);
        }
    }

    newFile(){
        fs.writeFile(config.LOG_PATH, '', function(){
            this.size = 0;
        }.bind(this));
    }

}

module.exports = Log;