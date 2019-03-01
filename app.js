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

var tomorrow = new Date("01.01.2010");
tomorrow.setDate(tomorrow.getDate() + 1);

console.log(tomorrow);

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
			FITNESS_MANAGER.editExercise(id, creator, data.difficulty, data.difficulty10, data.difficulty100, data.unit, data.baseWeight, data.comment);
			PLAYER_LIST[newPlayer.id].modifiedExercises++;
		}

		saveAndRefresh();
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
		saveAndRefresh();
	});

	socket.on("requestUpdate", function(data) {
		saveAndRefresh();
	});

	

};



function saveAndRefresh() {
	saveFitnessManager();
	for (var iPlayer in PLAYER_LIST) {
		var player = PLAYER_LIST[iPlayer];
		player.points = FITNESS_MANAGER.calculatePointsFromHistory(PLAYER_LIST[iPlayer].name);
		if (SOCKET_LIST[player.id] != undefined) {
			SOCKET_LIST[player.id].emit('refresh', {
				exercises: FITNESS_MANAGER.exerciseList,
				history: FITNESS_MANAGER.history,
				player: player,
				registeredPlayers:FITNESS_MANAGER.registeredPlayers,
			});

		}
	}

}

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
					if (res) {
						saveAndRefresh();
					}
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

		console.log("player " + PLAYER_LIST[id].name + " loaded");


		cb(true);
	})
		.catch((err) => {
			console.log("Player <" + name + ">: No Savestate.");
			PLAYER_LIST[id].name = name;
			cb(true);
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