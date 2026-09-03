// @ts-check
/*jshint esversion: 6 */

var Config = require("./Config");
var config = new Config();

function convertExpirationTimeFromMinutesToSeconds(timeMinutes = '60m') {
    const regex = /^(\d+|\d+\.\d+)(m|mins|minutes|minute|min)/;
    const match = regex.exec(timeMinutes);
    const value = Number(match[1]);
    return Math.round(value * 60);
}

function isAppRequest(request) {
    return request.get('User-Agent')?.includes(config.APP_USER_AGENT_STRING);
}

module.exports = {
    convertExpirationTimeFromMinutesToSeconds,
    isAppRequest
}
