// @ts-check
/*jshint esversion: 6 */

function Config() {

    //BASE PREFS
    this.LOCAL_PORT = 3000;
    this.ID_LENGTH = 16;
    this.INTERVAL = 1000; //1sec
    this.LOG_UPLOAD_INTERVAL = 3600; //sec
    this.SAVE_UPLOAD_INTERVAL = 15; //sec
    this.DB_TOKEN = process.env.DB_TOKEN 
    this.GAGS_USERNAME = process.env.GAGS_USERNAME 
    this.GAGS_PASSWORD = process.env.GAGS_PASSWORD 
    this.PROXY_MODE = Number(process.env.PROXY_MODE);
    this.LOG_FILE_NAME = "log.txt";
    this.DATA_STORAGE_FILE_NAME = "dataStorage.json";
    this.LOG_PATH = "./saves/log.txt";
    this.RECALCULATE_HISTORY_ON_CHANGES = 0;
    this.POINTS_FOR_POWERFACTOR = 500;
}

module.exports = Config;
