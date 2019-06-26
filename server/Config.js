// @ts-nocheck
/*jshint esversion: 6 */

function Config() {

    //BASE PREFS
    this.LOCAL_PORT = 2000;
    this.ID_LENGTH = 16;
    this.INTERVAL = 1000; //1sec
    this.LOG_UPLOAD_INTERVAL = 3600; //sec
    this.SAVE_UPLOAD_INTERVAL = 15; //sec
    this.DB_TOKEN = "Ad3tLqqtKckAAAAAAACK_0aogsVnZrSmjMWjss79yxecm6jxPi3J3xBPy6YsOQNt";
    this.PROXY_MODE = 0;
    this.EXERCISE_FILE_NAME = "exerciseList.json";
    this.REG_PLAYERS_FILE_NAME = "registeredPlayers.json";
    this.HISTORY_FILE_NAME = "history.json";
    this.USERS_FILE_NAME = "users.json";
    this.LOG_FILE_NAME = "log.txt";
    this.EVENT_LOG_FILE_NAME = "eventlog.json";
    this.ACHIEVEMENTS_FILE_NAME = "achievements.json";
    this.LOG_PATH = "./saves/log.txt";
    this.RECALCULATE_HISTORY_ON_CHANGES = 0;
}

module.exports = Config;
