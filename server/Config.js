// @ts-nocheck
/*jshint esversion: 6 */

function Config() {

    //BASE PREFS
    this.LOCAL_PORT = 2000;
    this.ID_LENGTH = 16;
    this.INTERVAL = 1000;
    this.DB_TOKEN = "Ad3tLqqtKckAAAAAAACK_0aogsVnZrSmjMWjss79yxecm6jxPi3J3xBPy6YsOQNt";
    this.PROXY_MODE = 1;
    this.EXERCISE_FILE_NAME = "exerciseList.json";
    this.REG_PLAYERS_FILE_NAME ="registeredPlayers.json";
    this.HISTORY_FILE_NAME ="history.json";
    this.USERS_FILE_NAME ="users.json";
    this.LOG_FILE_NAME ="log.txt";
    this.LOG_PATH = "./saves/log.txt";
}

module.exports = Config;