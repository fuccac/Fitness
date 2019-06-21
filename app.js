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
var dropbox = new DropBoxHandler();
var logFile = new Log();

//GLOBALS
var USERS = {};
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var FITNESS_MANAGER = new FitnessManager();
var DB_TOKEN = config.DB_TOKEN;

loadSaveFiles();
application.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

application.use('/', express.static(__dirname + '/client'));
application.use('/client', express.static(__dirname + '/client'));

server.listen(process.env.PORT || config.LOCAL_PORT);
logFile.log("Started Server", true, 0);

var io = require('socket.io')(server, {
	pingTimeout: 3600000,
});
io.sockets.on('connection', function (socket) {
	OnSocketConnection(socket);
});



/**
 * @param {SocketIO.Socket} socket 
 */
var OnPlayerConnection = function (socket) {
	var newPlayer = new Player(socket.id);
	PLAYER_LIST[newPlayer.id] = newPlayer;


	socket.on("modifyExercise", function (data) {
		var creator = PLAYER_LIST[newPlayer.id].name;
		logFile.log(newPlayer.name + " " + "edits Exercise " + data.name, false, 0);
		FITNESS_MANAGER.editExercise(data, creator, function (result) {
			saveAndRefreshEverything();
			PLAYER_LIST[newPlayer.id].modifiedExercises++;
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
			saveAndRefreshEverything();
		});


	});

	socket.on("deleteExercise", function (data) {
		if (data.id != 0) {
			logFile.log(newPlayer.name + " " + "deletes Exercise " + data.name, false, 0);
			FITNESS_MANAGER.deleteExercise(data.id, function (result) {
				saveAndRefreshEverything();
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
			saveAndRefreshPlayer(newPlayer.id);
		});
	});

	socket.on("deleteHistory", function (data) {
		logFile.log(newPlayer.name + " " + "deletes Workout", false, 0);
		FITNESS_MANAGER.deleteHistory(data.id, data.date, function (result) {
			logFile.log(result, false, 0);
			saveAndRefreshPlayer(newPlayer.id);
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
		logFile.log(newPlayer.name + " " + "requests Graph update", false, 0);
		var graph;
		if (data.type) {
			graph = FITNESS_MANAGER.createMonthChartData();
		}
		else {
			graph = FITNESS_MANAGER.createGraph(data.fromDate, data.toDate);
		}

		SOCKET_LIST[newPlayer.id].emit('refreshGraph', {
			graph: graph,
		});
	});

	socket.on("requestExerciseStatistic", function (data) {
		SOCKET_LIST[newPlayer.id].emit('refreshExerciseStatistics', {
			points: FITNESS_MANAGER.exerciseList[data.id].pointsPerPlayer[PLAYER_LIST[socket.id].name],
			reps: FITNESS_MANAGER.exerciseList[data.id].repsPerPlayer[PLAYER_LIST[socket.id].name]
		});


	});

};

/** 
 * @param {SocketIO.Socket} socket 
 */
var OnSocketConnection = function (socket) {

	//someone connects
	socket.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
	SOCKET_LIST[socket.id] = socket;
	logFile.log('new socket connection (' + socket.id + ")", false, 0);

	//someone signs in
	socket.on('SignIn', function (data) {

		if (data.loginCookie == undefined) {
			isValidPassword(data, function (res) {
				if (res) {
					OnPlayerConnection(socket);
					loadPlayer(data.username, socket.id, function (res) {
						logFile.log(res, false, 0);
						FITNESS_MANAGER.addToEventLog(data.username + " hat sich angemeldet!");
						saveAndRefreshPlayer(socket.id);
					});
					socket.emit('signInResponse', { success: true });
				}
				else {
					socket.emit('signInResponse', { success: false });
				}
			});
		}
		else {
			OnPlayerConnection(socket);
			loadPlayer(data.loginCookie, socket.id, function (res) {
				logFile.log(res, false, 0);
				saveAndRefreshPlayer(socket.id);
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

var isValidPassword = function (data, cb) {
	setTimeout(function () {
		cb(pwHash.verify(data.password, USERS[data.username.toUpperCase()]));
	}, 10);
};

/**
 * 
 * @param {{}} data username and password
 * @param {function()} cb 
 */
var isUsernameTaken = function (data, cb) {
	setTimeout(function () {
		cb(USERS[data.username.toUpperCase()]);
	}, 10);
};

/**
 * 
 * @param {{}} data username and password
 * @param {function(bool)} cb 
 */
var addUser = function (data, cb) {
	setTimeout(function () {
		USERS[data.username.toUpperCase()] = pwHash.generate(data.password);
		saveUsers(USERS);
		cb();
	}, 10);
};


//************************************************************/
//************************************************************/
//************************************************************/
//***********************Functions****************************/
//************************************************************/
//************************************************************/
//************************************************************/

function recalculateAllPoints(result) {
	for (var iPlayer in PLAYER_LIST) {
		player = PLAYER_LIST[iPlayer];
		player.points = FITNESS_MANAGER.calculatePointsFromHistory(player.name);
	}
	result("recalculateAllPoints done");
}

function saveAndRefreshPlayer(playerId) {

	var iPlayer;
	var player;
	PLAYER_LIST[playerId].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[playerId].name);
	FITNESS_MANAGER.checkPlayerStuff(PLAYER_LIST[playerId], function (result) {
		logFile.log(result, false, 0);
		FITNESS_MANAGER.getPlayerList(PLAYER_LIST, function (playerList) {
			for (iPlayer in PLAYER_LIST) {
				player = PLAYER_LIST[iPlayer];
				if (SOCKET_LIST[player.id] != undefined) {
					SOCKET_LIST[player.id].emit('refresh', {
						exercises: FITNESS_MANAGER.exerciseList,
						player: player,
						registeredPlayers: FITNESS_MANAGER.registeredPlayers,
						playerList: playerList,
						compInfo: FITNESS_MANAGER.dailyWins,
						eventLog: FITNESS_MANAGER.eventLog,
					});
				}

			}
		});
	});

}

function saveAndRefreshEverything() {
	var iPlayer;
	var player;

	recalculateAllPoints(function (result) {
		logFile.log(result, false, 0);
		for (iPlayer in PLAYER_LIST) {
			player = PLAYER_LIST[iPlayer];
			FITNESS_MANAGER.checkPlayerStuff(player, function (result) {
				logFile.log(result, false, 0);
				FITNESS_MANAGER.getPlayerList(PLAYER_LIST, function (playerList) {
					if (SOCKET_LIST[player.id] != undefined) {
						SOCKET_LIST[player.id].emit('refresh', {
							exercises: FITNESS_MANAGER.exerciseList,
							player: player,
							registeredPlayers: FITNESS_MANAGER.registeredPlayers,
							playerList: playerList,
							compInfo: FITNESS_MANAGER.dailyWins,
							eventLog: FITNESS_MANAGER.eventLog,
						});
					}
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


		PLAYER_LIST[id].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[id].name);
		saveAndRefreshPlayer(id);

		cb("player " + PLAYER_LIST[id].name + " loaded");
	})
		.catch((err) => {

			PLAYER_LIST[id].name = name;
			PLAYER_LIST[id].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[id].name);
			saveAndRefreshPlayer(id);
			cb("Player <" + name + ">: No Savestate.");
		});


}

function loadSaveFiles() {
	dropbox.downloadFile(DB_TOKEN, config.LOG_FILE_NAME, function (callback) {
		logFile.log(callback.msg, false, callback.sev);
		dropbox.downloadFile(DB_TOKEN, config.EXERCISE_FILE_NAME, function (callback) {
			logFile.log(callback.msg, false, callback.sev);
			dropbox.downloadFile(DB_TOKEN, config.HISTORY_FILE_NAME, function (callback) {
				logFile.log(callback.msg, false, callback.sev);
				dropbox.downloadFile(DB_TOKEN, config.REG_PLAYERS_FILE_NAME, function (callback) {
					logFile.log(callback.msg, false, callback.sev);
					loadFitnessManager();
					FITNESS_MANAGER.addToEventLog("Server gestartet");
				});
			});
		});
		dropbox.downloadFile(DB_TOKEN, config.USERS_FILE_NAME, function (callback) {
			logFile.log(callback.msg, false, callback.sev);
			loadUsers();
		});
	});
}

function loadFitnessManager() {
	storageManager.get(config.EXERCISE_FILE_NAME.replace(".json", "")).then(result => {
		FITNESS_MANAGER.exerciseList = result.exerciseList;
		logFile.log("exerciseList Loaded", false, 0);
		storageManager.get(config.HISTORY_FILE_NAME.replace(".json", "")).then(result => {
			FITNESS_MANAGER.history = result.history;
			logFile.log("history Loaded", false, 0);
			storageManager.get(config.REG_PLAYERS_FILE_NAME.replace(".json", "")).then(result => {
				FITNESS_MANAGER.registeredPlayers = result.registeredPlayers;
				logFile.log("registeredPlayers Loaded", false, 0);
				FITNESS_MANAGER.recalculateAllExercisesWithHistory(function (result) {
					logFile.log(result, false, 0);
				});
			})
				.catch((err) => {
					console.log(err);
					logFile.log("registeredPlayers file missing or corrupted", false, 1);
				});
		})
			.catch((err) => {
				logFile.log("history file missing or corrupted", false, 1);
			});
	})
		.catch((err) => {
			logFile.log("exerciseList file missing or corrupted", false, 1);
		});

}

/**
 * @param {{}} users list of users and passwords -> users[username] = password
 */
function saveUsers(users) {
	storageManager.put({ userlist: users, id: config.USERS_FILE_NAME.replace(".json", "") }).then(result => {
		logFile.log("userlist saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, config.USERS_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
		});
	});
}

function saveExerciseList() {
	storageManager.put({ exerciseList: FITNESS_MANAGER.exerciseList, id: config.EXERCISE_FILE_NAME.replace(".json", "") }).then(result => {
		logFile.log("exerciseList saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, config.EXERCISE_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
			if (result.sev < 2) {
				FITNESS_MANAGER.needsUpload.exerciseList = false;
			}
		});
	});
}

function saveHistory() {
	storageManager.put({ history: FITNESS_MANAGER.history, id: config.HISTORY_FILE_NAME.replace(".json", "") }).then(result => {
		logFile.log("history saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, config.HISTORY_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
			if (result.sev < 2) {
				FITNESS_MANAGER.needsUpload.history = false;
			}
		});
	});
}
function saveRegisteredPlayers() {
	storageManager.put({ registeredPlayers: FITNESS_MANAGER.registeredPlayers, id: config.REG_PLAYERS_FILE_NAME.replace(".json", "") }).then(result => {
		logFile.log("registeredPlayers saved", false, 0);
		dropbox.uploadFile(DB_TOKEN, config.REG_PLAYERS_FILE_NAME, function (result) {
			logFile.log(result.msg, false, result.sev);
			if (result.sev < 2) {
				FITNESS_MANAGER.needsUpload.registeredPlayers = false;
			}
		});
	});
}

function loadUsers() {
	storageManager.get(config.USERS_FILE_NAME.replace(".json", "")).then(result => {
		USERS = result.userlist;
		logFile.log("Users Loaded", false, 0);
	})
		.catch((err) => {
			logFile.log("users file missing or corrupted", false, 1);
			logFile.log(err, false, 0);
		});
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

		saveRegisteredPlayers();
	}
	if (FITNESS_MANAGER.uploadTimer === config.SAVE_UPLOAD_INTERVAL) {
		FITNESS_MANAGER.uploadTimer = 0;
		if (FITNESS_MANAGER.needsUpload.history) {
			saveHistory();
		}
		if (FITNESS_MANAGER.needsUpload.registeredPlayers) {
			saveRegisteredPlayers();
		}
		if (FITNESS_MANAGER.needsUpload.exerciseList) {
			saveExerciseList();
		}
	}


	FITNESS_MANAGER.today = date;
}, config.INTERVAL);