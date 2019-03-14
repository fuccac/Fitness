// @ts-nocheck
/*jshint esversion: 6 */

//MODULES etc..
var express = require('express');
var app = express();
var http = require("http");
var JSONFileStorage = require('jsonfile-storage');
var pwHash = require('password-hash');
var Config = require("./server/Config");
var Player = require("./server/Player");
var FitnessManager = require("./server/FitnessManager");


//MODULE INITS
var storageManager = new JSONFileStorage('./saves');
var config = new Config();
var serv = new http.Server(app);

//GLOBALS
var USERS = {};
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var FITNESS_MANAGER = new FitnessManager();


loadUsers();
loadFitnessManager();

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/', express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || config.LOCAL_PORT);
console.log("Started Server");

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
	OnSocketConnection(socket);
});

/**
 * @param {SocketIO.Socket} socket 
 */
var OnPlayerConnection = function (socket) {
	var newPlayer = new Player(socket.id);
	PLAYER_LIST[newPlayer.id] = newPlayer;


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
		var id = FITNESS_MANAGER.existExercise(data.name, data.equipment);
		if (id == 0) {
			FITNESS_MANAGER.createExercise(data, usesWeight, creator);
			PLAYER_LIST[newPlayer.id].addedExercises++;
		}
		else {
			FITNESS_MANAGER.editExercise(id, creator, data.difficulty, data.difficulty10, data.difficulty100, data.unit, data.baseWeight, data.comment, data.bothSides, function (result) {
				saveAndRefresh();
				PLAYER_LIST[newPlayer.id].modifiedExercises++;
			});

		}


	});

	socket.on("deleteExercise", function (data) {
		var id = FITNESS_MANAGER.existExercise(data.name, data.equipment);
		if (id != 0) {
			FITNESS_MANAGER.deleteExercise(id);
			PLAYER_LIST[newPlayer.id].deletedExercises++;
		}
		else {
			console.log("Exercise not found");
		}
		saveAndRefresh();
	});

	socket.on("addDoneExercise", function (data) {
		var id = Math.random().toFixed(config.ID_LENGTH).slice(2);
		FITNESS_MANAGER.addToHistory(id, PLAYER_LIST[socket.id].name, data.exId, data.weight, data.count, data.date);
		PLAYER_LIST[socket.id].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[socket.id].name);
		saveAndRefresh(newPlayer.id);
	});

	socket.on("deleteHistory", function (data) {
		FITNESS_MANAGER.deleteHistory(data.id, data.date);
		PLAYER_LIST[socket.id].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[socket.id].name);
		saveAndRefresh(newPlayer.id);
	});


	socket.on("requestHistoryUpdate", function (data) {
		var historyChunk = FITNESS_MANAGER.getDefinedHistory(data.fromDate, data.toDate);
		SOCKET_LIST[newPlayer.id].emit('refreshHistory', {
			history: historyChunk,
		});
		saveAndRefresh(newPlayer.id);
	});

	socket.on("requestGraphUpdate", function (data) {
		var graph = FITNESS_MANAGER.createGraph(data.fromDate, data.toDate);
		SOCKET_LIST[newPlayer.id].emit('refreshGraph', {
			graph: graph,

		});
		saveAndRefresh(newPlayer.id);

	});

};

/** 
 * @param {SocketIO.Socket} socket 
 */
var OnSocketConnection = function (socket) {

	//someone connects
	socket.id = Math.random().toFixed(config.ID_LENGTH).slice(2);
	SOCKET_LIST[socket.id] = socket;
	console.log('new socket connection (' + socket.id + ")");

	//someone signs in
	socket.on('SignIn', function (data) {
		isValidPassword(data, function (res) {
			if (res) {
				OnPlayerConnection(socket);
				loadPlayer(data.username, socket.id, function (res) {
					console.log(res);
					saveAndRefresh(socket.id);
				});
				socket.emit('signInResponse', { success: true });
			}
			else {
				socket.emit('signInResponse', { success: false });
			}
		});
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
		console.log('socket connection lost (' + socket.id + ")");
	});
};

/**
 * @param {{}} users list of users and passwords -> users[username] = password
 */
function saveUsers(users) {
	storageManager.put({ userlist: users, id: "users" }).then(result => {
		console.log("userlist saved");
	});
}

function saveFitnessManager() {
	storageManager.put({ exerciseList: FITNESS_MANAGER.exerciseList, id: "exerciseList" }).then(result => {
		console.log("exerciseList saved");
	});
	storageManager.put({ history: FITNESS_MANAGER.history, id: "history" }).then(result => {
		console.log("history saved");
	});
	storageManager.put({ registeredPlayers: FITNESS_MANAGER.registeredPlayers, id: "registeredPlayers" }).then(result => {
		console.log("registeredPlayers saved");
	});
}

function loadFitnessManager() {
	storageManager.get("exerciseList").then(result => {
		FITNESS_MANAGER.exerciseList = result.exerciseList;
		console.log("exerciseList Loaded");
	})
		.catch((err) => {
			console.log("exerciseList file missing or corrupted");
		});
	storageManager.get("history").then(result => {
		FITNESS_MANAGER.history = result.history;
		console.log("history Loaded");
	})
		.catch((err) => {
			console.log("history file missing or corrupted");
		});
	storageManager.get("registeredPlayers").then(result => {
		FITNESS_MANAGER.registeredPlayers = result.registeredPlayers;
		console.log("registeredPlayers Loaded");
	})
		.catch((err) => {
			console.log("registeredPlayers file missing or corrupted");
		});
}

function loadUsers() {
	storageManager.get("users").then(result => {
		USERS = result.userlist;
		console.log("Users Loaded");
	})
		.catch((err) => {
			console.log("users file missing or corrupted");
		});
}

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

function recalculateAllPoints(result) {
	for (var iPlayer in PLAYER_LIST) {
		player = PLAYER_LIST[iPlayer];
		player.points = FITNESS_MANAGER.calculatePointsFromHistory(player.name);
	}
	result("recalculateAllPoints done");
}


function saveAndRefresh(playerId) {
	saveFitnessManager();
	var iPlayer;
	var player;


	if (playerId == undefined) {
		recalculateAllPoints(function (result) {
			console.log(result);
			for (iPlayer in PLAYER_LIST) {
				player = PLAYER_LIST[iPlayer];
				FITNESS_MANAGER.checkPlayerStuff(player, function (result) {
					console.log(result);
					FITNESS_MANAGER.getPlayerList(PLAYER_LIST, function (playerList) {
						FITNESS_MANAGER.getAchievementList(PLAYER_LIST, function (achievementList) {
							if (SOCKET_LIST[player.id] != undefined) {
								SOCKET_LIST[player.id].emit('refresh', {
									exercises: FITNESS_MANAGER.exerciseList,
									player: player,
									registeredPlayers: FITNESS_MANAGER.registeredPlayers,
									playerList: playerList,
									achievementList:achievementList
								});
							}
						});

					});

				});

			}
		});
	}
	else {
		FITNESS_MANAGER.checkPlayerStuff(PLAYER_LIST[playerId], function (result) {
			console.log(result);
			FITNESS_MANAGER.getPlayerList(PLAYER_LIST, function (playerList) {
				FITNESS_MANAGER.getAchievementList(PLAYER_LIST, function (achievementList) {
					for (iPlayer in PLAYER_LIST) {
						player = PLAYER_LIST[iPlayer];
						if (SOCKET_LIST[player.id] != undefined) {
							SOCKET_LIST[player.id].emit('refresh', {
								exercises: FITNESS_MANAGER.exerciseList,
								player: player,
								registeredPlayers: FITNESS_MANAGER.registeredPlayers,
								playerList: playerList,
								achievementList:achievementList
							});
						}

					}
				});

			});
		});

	}

}



/**
 * @param {Player} player 
 */
function savePlayer(player) {
	storageManager.put({ content: player, id: player.name }).then(result => {
		console.log("player " + player.name + " saved");
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
		saveAndRefresh(id);

		cb("player " + PLAYER_LIST[id].name + " loaded");
	})
		.catch((err) => {

			PLAYER_LIST[id].name = name;
			PLAYER_LIST[id].points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[id].name);
			saveAndRefresh(id);
			cb("Player <" + name + ">: No Savestate.");
		});


}

/**
 * Handles all Players
 */
function handlePlayers() {

}

setInterval(function () {
	handlePlayers();
}, config.INTERVAL);