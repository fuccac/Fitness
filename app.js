// @ts-nocheck
/*jshint esversion: 6 */

//MODULES etc..
var express = require('express');
var application = express();
var http = require("http");
var JSONFileStorage = require('jsonfile-storage');
var pwHash = require('password-hash');
var Config = require("./server/Config");
var Player = require("./server/Player");
var FitnessManager = require("./server/FitnessManager");
var DropBoxHandler = require("./server/dropBoxHandler");
Log = require("./server/Log");
Calc = require("./server/calc");
calc = new Calc();


//MODULE INITS
var storageManager = new JSONFileStorage('./saves');
var config = new Config();
var server = new http.Server(application);
var io = require('socket.io')(server, {
	pingTimeout: 3600000,
});
var dropbox = new DropBoxHandler();
var logFile = new Log();

//GLOBALS
var USERS = {};
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var FITNESS_MANAGER = new FitnessManager();
var DB_TOKEN = config.DB_TOKEN;

var OnPlayerConnection;
var OnSocketConnection;
var isValidPassword;
var isUsernameTaken;
var addUser;

loadSaveFiles(function (loadSaveFilesResult) {
	logFile.log(loadSaveFilesResult, false, 0);
	startServer();
});

//************************************************************/
//************************************************************/
//************************************************************/
//***********************Functions****************************/
//************************************************************/
//************************************************************/
//************************************************************/

function refreshEventLog() {
	for (var iPlayer in PLAYER_LIST) {
		player = PLAYER_LIST[iPlayer];
		SOCKET_LIST[player.id].emit('refreshEventLog', {
			eventLog: FITNESS_MANAGER.eventLog,
		});
	}
}


function uiRefresh() {
	let start = Date.now();
	var iPlayer;
	var player;
	FITNESS_MANAGER.fullRefresh(function (result) {
		logFile.log(result, false, 0);
		for (iPlayer in PLAYER_LIST) {
			player = PLAYER_LIST[iPlayer];
			player.points = FITNESS_MANAGER.registeredPlayers[player.name].points;
			FITNESS_MANAGER.checkPlayerStuff(player, function (result) {
				logFile.log(result, false, 0);
				FITNESS_MANAGER.getPlayerList(PLAYER_LIST, function (playerList) {
					if (SOCKET_LIST[player.id] != undefined) {
						SOCKET_LIST[player.id].emit('refresh', {
							exercises: FITNESS_MANAGER.exerciseList,
							player: player,
							registeredPlayers: FITNESS_MANAGER.registeredPlayers,
							playerList: playerList,
							compInfoDaily: FITNESS_MANAGER.dailyWins,
							compInfoMonthly: FITNESS_MANAGER.monthlyWins,
							eventLog: FITNESS_MANAGER.eventLog,
						});
					}
					let end = Date.now();
					logFile.log(`full intervall refresh took ${end - start} ms`, false, 0);
				});
			});
		}
	});

}

/**
 * @param {Player} player 
 */
function savePlayer(player) {
	storageManager.put({ content: player, id: player.name }).then(result => {
		logFile.log("player " + player.name + " saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, player.name + ".json", function (result) {
			logFile.log(result.msg, false, result.sev);
		});
	});
}

/**
 * @param {string} name 
 * @param {string} id 
 */
function loadPlayer(name, id, cb) {
	storageManager.get(name).then(result => {
		var keyArrayPlayer = Object.keys(PLAYER_LIST[id]);
		var loadSeparately = [];
		var doNotLoadDirect = ["id"];
		var loadSeparatelyKeys = [];

		//Do not load keys which should be loaded separately
		for (iLoad = 0; iLoad < loadSeparately.length; iLoad++) {
			doNotLoadDirect.push(loadSeparately[iLoad]);
		}

		//Load all keys which are save to load
		for (var iPlayerProp = 0; iPlayerProp < keyArrayPlayer.length; iPlayerProp++) {
			var moveOn = false;
			for (var iObjectArray = 0; iObjectArray < doNotLoadDirect.length; iObjectArray++) {
				if (keyArrayPlayer[iPlayerProp] === doNotLoadDirect[iObjectArray]) {
					moveOn = true;
				}
			}
			if (!moveOn) {
				PLAYER_LIST[id][keyArrayPlayer[iPlayerProp]] = result.content[keyArrayPlayer[iPlayerProp]];
			}
		}

		//Get array of key arrays which should be loaded
		for (var iloadSepa = 0; iloadSepa < loadSeparately.length; iloadSepa++) {
			loadSeparatelyKeys[iloadSepa] = Object.keys(PLAYER_LIST[id][loadSeparately[iloadSepa]]);
		}

		//load separately player objects
		for (var k = 0; k < loadSeparatelyKeys.length; k++)
			for (var l = 0; l < loadSeparatelyKeys[k].length; l++) {
				PLAYER_LIST[id][loadSeparately[k]][loadSeparatelyKeys[l]] = result.content[loadSeparately[k]][loadSeparatelyKeys[l]];
			}

		uiRefresh();

		cb("player " + PLAYER_LIST[id].name + " loaded");
	})
		.catch((err) => {

			PLAYER_LIST[id].name = name;

			uiRefresh();
			cb("Player <" + name + ">: No Savestate.");
		});


}

function loadSaveFiles(loadSaveFilesResult) {
	let start = Date.now();
	dropbox.downloadFile(DB_TOKEN, config.DATA_STORAGE_FILE_NAME, function (callback) {
		logFile.log(callback.msg, false, callback.sev);
		loadFitnessManager(function (fitnessManagerLoadingResult) {
			for (let playerName in FITNESS_MANAGER.registeredPlayers) {
				dropbox.downloadFile(DB_TOKEN, playerName + ".json", function (callback) {
					logFile.log(callback.msg, false, callback.sev);
				});
			}
			let end = Date.now();
			logFile.log(`loadSaveFiles + loadFitnessManager init done in ${end - start} ms`, false, 0);

			loadSaveFilesResult(fitnessManagerLoadingResult);
		});
	});
}

function loadFitnessManager(fitnessManagerLoadingResult) {
	storageManager.get(config.DATA_STORAGE_FILE_NAME.replace(".json", "")).then(result => {
		FITNESS_MANAGER.exerciseList = result.dataStorage.exerciseList;
		FITNESS_MANAGER.history = result.dataStorage.history;
		FITNESS_MANAGER.registeredPlayers = result.dataStorage.registeredPlayers;
		FITNESS_MANAGER.eventLog = result.dataStorage.eventLog;
		FITNESS_MANAGER.achievements = result.dataStorage.achievements;
		USERS = result.dataStorage.users;

		logFile.log("dataStorage Loaded", false, 0);
		fitnessManagerStartUpTasks(function (startUpResult) {
			FITNESS_MANAGER.loadingDone = true;
			fitnessManagerLoadingResult(startUpResult);
		});


	})
		.catch((err) => {
			console.log(err);
			logFile.log("dataStorage file missing or corrupted", false, 2);
			fitnessManagerStartUpTasks(function (startUpResult) {
				FITNESS_MANAGER.loadingDone = true;
				fitnessManagerLoadingResult(startUpResult);
			});
		});
}

function fitnessManagerStartUpTasks(callback) {
	FITNESS_MANAGER.fullRefresh(function (result) {
		logFile.log(result, false, 0);
		callback("FITNESS_MANAGER - loading done");
	});
}


function saveDataStorage() {
	var dataStorage = {
		exerciseList: FITNESS_MANAGER.exerciseList,
		history: FITNESS_MANAGER.history,
		registeredPlayers: FITNESS_MANAGER.registeredPlayers,
		eventLog: FITNESS_MANAGER.eventLog,
		achievements: FITNESS_MANAGER.achievements,
		users: USERS,
	};

	storageManager.put({ dataStorage: dataStorage, id: config.DATA_STORAGE_FILE_NAME.replace(".json", "") }).then(result => {
		logFile.log("dataStorage saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, config.DATA_STORAGE_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
			if (result.sev < 2) {
				FITNESS_MANAGER.needsUpload.dataStorage = false;
			}
		});
	});
}



function startServer() {
	application.get('/', function (req, res) {
		res.sendFile(__dirname + '/client/index.html');
	});

	application.use('/', express.static(__dirname + '/client'));
	application.use('/client', express.static(__dirname + '/client'));

	server.listen(process.env.PORT || config.LOCAL_PORT);
	logFile.log("Started Server", true, 0);

	io.sockets.on('connection', function (socket) {
		OnSocketConnection(socket);
	});

	/**
 * @param {SocketIO.Socket} socket 
 */
	OnPlayerConnection = function (socket) {
		var newPlayer = new Player(socket.id);
		PLAYER_LIST[newPlayer.id] = newPlayer;


		socket.on("modifyExercise", function (data) {
			var creator = PLAYER_LIST[newPlayer.id].name;
			logFile.log(newPlayer.name + " " + "edits Exercise " + data.name, false, 0);
			FITNESS_MANAGER.editExercise(data, creator, function (result) {
				PLAYER_LIST[newPlayer.id].modifiedExercises++;
				uiRefresh();
			});
		});

		socket.on("addExercise", function (data) {
			var usesWeight;
			if (data.baseWeight === "") {
				data.baseWeight = 0;
				usesWeight = false;
			}
			else {
				if (data.baseWeight > 0) {
					usesWeight = true;
				}
				else {
					usesWeight = false;
					data.baseWeight = 0;
				}
			}

			var creator = PLAYER_LIST[newPlayer.id].name;
			logFile.log(newPlayer.name + " " + "adds new Exercise " + data.name, false, 0);
			FITNESS_MANAGER.createExercise(data, usesWeight, creator, function (result) {
				PLAYER_LIST[newPlayer.id].addedExercises++;
				uiRefresh();
			});


		});

		socket.on("deleteExercise", function (data) {
			if (data.id != 0) {
				logFile.log(newPlayer.name + " " + "deletes Exercise " + data.name, false, 0);
				FITNESS_MANAGER.deleteExercise(data.id, function (result) {
					uiRefresh();
				});
				PLAYER_LIST[newPlayer.id].deletedExercises++;
			}
			else {
				logFile.log("Exercise not found", false, 1);
			}
		});

		socket.on("addDoneExercise", function (data) {
			logFile.log(newPlayer.name + " " + "adds Workout", false, 0);
			var id = Math.random().toFixed(config.ID_LENGTH).slice(2);
			FITNESS_MANAGER.addToHistory(id, PLAYER_LIST[socket.id].name, data.exId, data.weight, data.count, data.date, function (result) {
				logFile.log(result, false, 0);
				uiRefresh();
			});
		});

		socket.on("deleteHistory", function (data) {
			logFile.log(newPlayer.name + " " + "deletes Workout", false, 0);
			FITNESS_MANAGER.deleteHistory(data.id, data.date, function (result) {
				logFile.log(result, false, 0);
				uiRefresh();
			});
		});


		socket.on("requestHistoryUpdate", function (data) {
			logFile.log(newPlayer.name + " " + "requests History update", false, 0);
			var historyChunk = FITNESS_MANAGER.getDefinedHistory(data.fromDate, data.toDate);
			SOCKET_LIST[newPlayer.id].emit('refreshHistory', {
				history: historyChunk,
			});
		});

		socket.on("requestAchievements", function (data) {
			logFile.log(newPlayer.name + " " + "requests Achievement update", false, 0);
			FITNESS_MANAGER.getAchievementList(newPlayer, function (achievementList) {
				SOCKET_LIST[newPlayer.id].emit('refreshAchievements', {
					achievementList: achievementList,
				});
			});
		});

		socket.on("requestGraphUpdate", function (data) {
			var graph;
			var colors = ["green", "red", "blue", "yellow", "brown", "grey", "magenta", "orange"];
			var colorsForPlayers = {};

			colorIterator = 0;
			for (var playerName in FITNESS_MANAGER.registeredPlayers) {
				colorsForPlayers[playerName] = colors[colorIterator];
				colorIterator++;
			}
			if (data.type == "bar") {
				if (data.pointType == "cardio") {
					graph = FITNESS_MANAGER.monthlyCardioData;
				}
				else if (data.pointType == "strength") {
					graph = FITNESS_MANAGER.monthlyStrengthData;
				}
				else {
					graph = FITNESS_MANAGER.monthlyData;
				}

			}
			else {
				graph = FITNESS_MANAGER.createGraph(data.fromDate, data.toDate, data.pointType,data.type);
			}

			SOCKET_LIST[newPlayer.id].emit('refreshGraph', {
				graph: graph,
				colors: colorsForPlayers,
			});
		});

		socket.on("requestExerciseStatistic", function (data) {
			SOCKET_LIST[newPlayer.id].emit('refreshExerciseStatistics', {
				points: FITNESS_MANAGER.exerciseList[data.id].pointsPerPlayer[PLAYER_LIST[socket.id].name],
				reps: FITNESS_MANAGER.exerciseList[data.id].repsPerPlayer[PLAYER_LIST[socket.id].name],
				repsDaily: FITNESS_MANAGER.maxExerciseCounts[data.id].daily[PLAYER_LIST[socket.id].name],
				repsMonthly: FITNESS_MANAGER.maxExerciseCounts[data.id].monthly[PLAYER_LIST[socket.id].name],
				category: FITNESS_MANAGER.exerciseList[data.id].achievementInfo.achievementCategory,
			});
		});


		socket.on("sendChatMessage", function (data) {
			var matcher = /<[a-z][\s\S]*>/;
			if (data.msg.match(matcher)) {
				data.msg = "HTML Tags erkannt - ungültig";
				FITNESS_MANAGER.addToEventLog(data.name + ": " + data.msg);
				refreshEventLog();
				return;
			}

			while (data.msg.includes("[LINK]") && data.msg.includes("[/LINK]")) {
				data.msg = data.msg.replace("[LINK]", "<a href=\"");
				data.msg = data.msg.replace("[/LINK]", "\" target=\"_blank\">Link!</a>");
			}
			while (data.msg.includes("[IMG]") && data.msg.includes("[/IMG]")) {
				data.msg = data.msg.replace("[IMG]", "<img src=\"");
				data.msg = data.msg.replace("[/IMG]", "\">");
			}

			FITNESS_MANAGER.addToEventLog(data.name + ": " + data.msg);
			refreshEventLog();
		});
	};

	/** 
	 * @param {SocketIO.Socket} socket 
	 */
	OnSocketConnection = function (socket) {

		//someone connects
		socket.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
		SOCKET_LIST[socket.id] = socket;
		logFile.log('new socket connection (' + socket.id + ")", false, 0);

		//someone signs in
		socket.on('SignIn', function (data) {

			if (data.loginCookie == undefined) {
				isValidPassword(data, function (res) {
					if (res) {
						FITNESS_MANAGER.addToEventLog(data.username + " hat sich angemeldet!");
						OnPlayerConnection(socket);
						loadPlayer(data.username, socket.id, function (res) {
							logFile.log(res, false, 0);
						});
						socket.emit('signInResponse', { success: true });
					}
					else {
						socket.emit('signInResponse', { success: false });
					}
				});
			}
			else {
				for (var playerId in PLAYER_LIST) {
					if (PLAYER_LIST[playerId].name == data.loginCookie) {
						delete PLAYER_LIST[playerId];
					}
				}
				FITNESS_MANAGER.addToEventLog(data.loginCookie + " hat sich angemeldet!");
				OnPlayerConnection(socket);
				loadPlayer(data.loginCookie, socket.id, function (res) {
					logFile.log(res, false, 0);
				});
				socket.emit('signInResponse', { success: true });

			}


		});

		//someone signs up
		socket.on('SignUp', function (data) {
			isUsernameTaken(data, function (res) {
				if (res) {
					socket.emit('signUpResponse', { success: false });
					socket.on("Name", function (data) {
						socket.emit("getName", PLAYER_LIST[socket.id].name);
					});
				}
				else {
					addUser(data, function () {
						socket.emit('signUpResponse', { success: true });
					});
				}
			});
		});

		//someone disconnects
		socket.on('disconnect', function () {
			//Save

			if (PLAYER_LIST[socket.id] != undefined) {
				FITNESS_MANAGER.addToEventLog(PLAYER_LIST[socket.id].name + " hat sich abgemeldet.");
				savePlayer(PLAYER_LIST[socket.id]);
				delete PLAYER_LIST[socket.id];
			}

			delete SOCKET_LIST[socket.id];

			logFile.log('socket connection lost (' + socket.id + ")", false, 0);
		});
	};

	/**
	 * 
	 * @param {{}} data username and password
	 * @param {function()} cb 
	 */

	isValidPassword = function (data, cb) {
		setTimeout(function () {
			cb(pwHash.verify(data.password, USERS[data.username.toUpperCase()]));
		}, 10);
	};

	/**
	 * 
	 * @param {{}} data username and password
	 * @param {function()} cb 
	 */
	isUsernameTaken = function (data, cb) {
		setTimeout(function () {
			cb(USERS[data.username.toUpperCase()]);
		}, 10);
	};

	/**
	 * 
	 * @param {{}} data username and password
	 * @param {function(bool)} cb 
	 */
	addUser = function (data, cb) {
		FITNESS_MANAGER.addNewPlayer(data.username);
		setTimeout(function () {
			USERS[data.username.toUpperCase()] = pwHash.generate(data.password);
			FITNESS_MANAGER.needsUpload.dataStorage = true;
			cb();
		}, 10);
	};

}

setInterval(function () {
	var date = calc.createViennaDate();
	logFile.logUploadTimer++;
	FITNESS_MANAGER.uploadTimer++;
	if (logFile.logUploadTimer === config.LOG_UPLOAD_INTERVAL) {
		logFile.logUploadTimer = 0;
		dropbox.uploadFile(DB_TOKEN, config.LOG_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
		});
	}
	if (FITNESS_MANAGER.uploadTimer === config.SAVE_UPLOAD_INTERVAL) {
		FITNESS_MANAGER.uploadTimer = 0;
		if (FITNESS_MANAGER.needsUpload.dataStorage) {
			saveDataStorage();
		}
	}


	FITNESS_MANAGER.today = date;
}, config.INTERVAL);