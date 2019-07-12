// @ts-nocheck
/*jshint esversion: 6 */

function Config() {

    //BASE PREFS
    this.LOCAL_PORT = 2000;
    this.ID_LENGTH = 16;
    this.INTERVAL = 1000; //1sec
    this.LOG_UPLOAD_INTERVAL = 3600; //sec
    this.SAVE_UPLOAD_INTERVAL = 15; //sec
    //this.DB_TOKEN = "Ad3tLqqtKckAAAAAAACK_0aogsVnZrSmjMWjss79yxecm6jxPi3J3xBPy6YsOQNt";
    this.DB_TOKEN = "Ad3tLqqtKckAAAAAAACL0Mfuj93cnWjuWQSgTrxIsA4if-uhyjV3Ok_-AhzSYmx2"; //TESTSERVER
    this.PROXY_MODE = 0;
    this.LOG_FILE_NAME = "log.txt";
    this.DATA_STORAGE_FILE_NAME = "dataStorage.json";
    this.LOG_PATH = "./saves/log.txt";
    this.RECALCULATE_HISTORY_ON_CHANGES = 0;
}

module.exports = Config;
