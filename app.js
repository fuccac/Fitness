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
Common = require("./client/js/common");
EmailManager = require("./server/EmailManager");

//MODULE INITS
var storageManager = new JSONFileStorage('./saves');
var config = new Config();
var server = new http.Server(application);
var io = require('socket.io')(server, {
	pingTimeout: 3600000,
});
var dropbox = new DropBoxHandler();
var logFile = new Log();
var common = new Common();
var mailer = new EmailManager();


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
	setInterval(cyclicAquisition, config.INTERVAL);
	startServer();
});


//************************************************************/
//************************************************************/
//************************************************************/
//***********************Functions****************************/
//************************************************************/
//************************************************************/
//************************************************************/
var dailyWinner = "Keiner";
var lastWinner = "Keiner";
function cyclicAquisition() {
	var date = common.createViennaDate();
	lastWinner = dailyWinner;
	dailyWinner = FITNESS_MANAGER.getDailyWinner(date);
	if (dailyWinner != lastWinner && dailyWinner != "Keiner" && lastWinner != "Keiner") {
		if (USERS[lastWinner.toUpperCase()].email != undefined && USERS[lastWinner.toUpperCase()].allowEmail) {
			mailer.sendEmail(USERS[lastWinner.toUpperCase()].email, "Tagessieg verloren!", "Dein heutiger Tagessieg wurde von " + dailyWinner + " eingestellt!");
		}
	}

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

	if (common.daysBetween(date, FITNESS_MANAGER.featuredExerciseDate) > 0 || FITNESS_MANAGER.featuredExerciseId == 0) {
		let exName = FITNESS_MANAGER.featureNewExercise();
		for (let playerName in USERS) {
			if (USERS[playerName].email != undefined && USERS[playerName].allowEmail) {
				mailer.sendEmail(USERS[playerName].email, "Neue Double Time Übung!", "Die neue Double Time Übung ist: " + exName);
			}
		}
	}

	FITNESS_MANAGER.today = date;
}


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
		sortedExList = FITNESS_MANAGER.getSortedExerciseList();
		for (iPlayer in PLAYER_LIST) {
			player = PLAYER_LIST[iPlayer];
			FITNESS_MANAGER.checkPlayerStuff(player, function (result) {
				logFile.log(result, false, 0);
				if (SOCKET_LIST[player.id] != undefined) {
					SOCKET_LIST[player.id].emit('refresh', {
						exercises: sortedExList, //FITNESS_MANAGER.exerciseList,
						player: {
							points: FITNESS_MANAGER.registeredPlayers[player.name].points,
							entries: FITNESS_MANAGER.registeredPlayers[player.name].entries,
							active: player.active,
							regDate: player.regDate,
							addedExercises: player.addedExercises,
							deletedExercises: player.deletedExercises,
							modifiedExercises: player.modifiedExercises,
							bestExercises: player.bestExercises,
						},
						playerList: FITNESS_MANAGER.registeredPlayers,
						compInfoDaily: FITNESS_MANAGER.dailyWins,
						compInfoMonthly: FITNESS_MANAGER.monthlyWins,
						eventLog: FITNESS_MANAGER.eventLog,
					});
				}
				let end = Date.now();
				logFile.log(`full intervall refresh took ${end - start} ms`, false, 0);
			});
		}
	});

}

/**
 * @param {Player} player 
 */
function savePlayer(player) {

	playerData = {
		name: player.name,
		active: player.active,
		regDate: player.regDate,
		addedExercises: player.addedExercises,
		deletedExercises: player.deletedExercises,
		modifiedExercises: player.modifiedExercises,
		bestExercises: player.bestExercises,
		online: player.online,
	};

	storageManager.put({ content: playerData, id: playerData.name }).then(result => {
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

		PLAYER_LIST[id].name = result.content.name;
		PLAYER_LIST[id].active = result.content.active;
		PLAYER_LIST[id].regDate = result.content.regDate;
		PLAYER_LIST[id].addedExercises = result.content.addedExercises;
		PLAYER_LIST[id].deletedExercises = result.content.deletedExercises;
		PLAYER_LIST[id].modifiedExercises = result.content.modifiedExercises;
		PLAYER_LIST[id].bestExercises = result.content.bestExercises;
		PLAYER_LIST[id].online = result.content.online;


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
	dropbox.downloadFile(DB_TOKEN, config.LOG_FILE_NAME, function (callback) {
		logFile.log(callback.msg, false, callback.sev);
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
	});

}

function loadFitnessManager(fitnessManagerLoadingResult) {
	storageManager.get(config.DATA_STORAGE_FILE_NAME.replace(".json", "")).then(result => {
		FITNESS_MANAGER.exerciseList = result.dataStorage.exerciseList;
		FITNESS_MANAGER.history = result.dataStorage.history;
		FITNESS_MANAGER.registeredPlayers = result.dataStorage.registeredPlayers;
		FITNESS_MANAGER.eventLog = result.dataStorage.eventLog;
		FITNESS_MANAGER.achievements = result.dataStorage.achievements;
		try {
			FITNESS_MANAGER.today = new Date(result.dataStorage.fitnessManager.today);
			FITNESS_MANAGER.featuredExerciseId = result.dataStorage.fitnessManager.featuredExerciseId;
			FITNESS_MANAGER.featuredExerciseDate =  new Date(result.dataStorage.fitnessManager.featuredExerciseDate);
		}
		catch (e) {
			logFile.log("fitnessManager property data failed to load", false, 0);
		}

		USERS = result.dataStorage.users;

		logFile.log("dataStorage Loaded", false, 0);
		fitnessManagerStartUpTasks(function (startUpResult) {
			AddPropertiesToExercises(function (AddPropertiesToExerciseListResult) {
				logFile.log(AddPropertiesToExerciseListResult, false, 0);
				FITNESS_MANAGER.loadingDone = true;
				fitnessManagerLoadingResult(startUpResult);


			});

		});


	})
		.catch((err) => {
			console.log(err);
			logFile.log("dataStorage file missing or corrupted", false, 2);
			fitnessManagerStartUpTasks(function (startUpResult) {
				AddPropertiesToExercises(function (AddPropertiesToExerciseListResult) {
					logFile.log(AddPropertiesToExerciseListResult, false, 0);
					FITNESS_MANAGER.loadingDone = true;
					fitnessManagerLoadingResult(startUpResult);

				});
			});
		});
}

function AddPropertiesToExercises(result) {
	let start = Date.now();
	let addedProperties = 0;
	let addedPropertiesToVotes = 0;

	let propertiesToAddDirectly = {
		name: ["paceConstant", "isPaceExercise", "deleted", "isHidden"],
		value: [1, false, false, {}],
	};

	let propertiesToAddVotes = {
		name: ["paceConstant"],
		value: [1],
	};


	for (let exId in FITNESS_MANAGER.exerciseList) {
		let currentExercise = FITNESS_MANAGER.exerciseList[exId];

		//Directly
		for (let iterator = 0; iterator < propertiesToAddDirectly.name.length; iterator++) {
			if (currentExercise[propertiesToAddDirectly.name[iterator]] == undefined) {
				if (propertiesToAddDirectly.value[iterator] == {}) {
					currentExercise[propertiesToAddDirectly.name[iterator]] = {};
				}
				else {
					currentExercise[propertiesToAddDirectly.name[iterator]] = propertiesToAddDirectly.value[iterator];
				}
				addedProperties++;
			}
		}

		//Votes
		for (let voteName in currentExercise.votes) {
			let currentVote = currentExercise.votes[voteName];
			for (let iterator = 0; iterator < propertiesToAddVotes.name.length; iterator++) {
				if (currentVote[propertiesToAddVotes.name[iterator]] == undefined) {
					if (propertiesToAddVotes.value[iterator] == {}) {
						currentVote[propertiesToAddVotes.name[iterator]] = {};
					}
					else {
						currentVote[propertiesToAddVotes.name[iterator]] = propertiesToAddVotes.value[iterator];
					}

					addedPropertiesToVotes++;
				}
			}
		}
	}
	let end = Date.now();
	result(addedProperties + ' new Properties added directly and ' + addedPropertiesToVotes + ` Properties added to votes in ${end - start} ms`);
}

function fitnessManagerStartUpTasks(callback) {
	FITNESS_MANAGER.fullRefresh(function (result) {
		logFile.log(result, false, 0);
		if (FITNESS_MANAGER.eventLog.time.length > 0 && (FITNESS_MANAGER.eventLog.html == "" || FITNESS_MANAGER.eventLog.html == undefined)) {
			FITNESS_MANAGER.createHTMLEventLog();
		}
		callback("FITNESS_MANAGER - loading done");
	});
}


function saveDataStorage() {
	let fitnessManagerStorage = {};
	fitnessManagerStorage.today = FITNESS_MANAGER.today;
	fitnessManagerStorage.featuredExerciseId = FITNESS_MANAGER.featuredExerciseId;
	fitnessManagerStorage.featuredExerciseDate = FITNESS_MANAGER.featuredExerciseDate

	var dataStorage = {
		exerciseList: FITNESS_MANAGER.exerciseList,
		history: FITNESS_MANAGER.history,
		registeredPlayers: FITNESS_MANAGER.registeredPlayers,
		eventLog: FITNESS_MANAGER.eventLog,
		achievements: FITNESS_MANAGER.achievements,
		users: USERS,
		fitnessManager: fitnessManagerStorage
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
		var colors = ["#008000", "#ff0000", "#0000ff", "#ffff00", "#a52a2a", "#808080", "#ff00ff", "#ffa500"];
		var colorsForPlayers = {};

		colorIterator = 0;
		for (var playerName in FITNESS_MANAGER.registeredPlayers) {
			if (USERS[playerName.toUpperCase()].color != undefined) {
				colorsForPlayers[playerName] = USERS[playerName.toUpperCase()].color;
			}
			else {
				USERS[playerName.toUpperCase()].color = colors[colorIterator];
				colorsForPlayers[playerName] = colors[colorIterator];
			}
			colorIterator++;
		}
		var newPlayer = new Player(socket.id);
		PLAYER_LIST[newPlayer.id] = newPlayer;

		socket.on("hideExercise", function (data) {
			FITNESS_MANAGER.hideExercise(data.id, newPlayer.name, function (hideExerciseResult) {
				logFile.log(hideExerciseResult, false, 0);
				uiRefresh();
			});
		});

		socket.on("requestProfileUpdate", function (data) {
			for (let key in data) {
				USERS[newPlayer.name.toUpperCase()][key] = data[key];
			}
			colorsForPlayers[newPlayer.name] = USERS[newPlayer.name.toUpperCase()].color;
			FITNESS_MANAGER.needsUpload.dataStorage = true;
		});



		socket.on("requestExerciseListUpdate", function (data) {
			SOCKET_LIST[newPlayer.id].emit('refreshExerciseList', {
				exercises: FITNESS_MANAGER.getSortedExerciseList(),
			});
		});


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
			FITNESS_MANAGER.deleteExercise(data.id, function (result) {
				PLAYER_LIST[newPlayer.id].deletedExercises++;
				logFile.log(newPlayer.name + result, false, 0);
				FITNESS_MANAGER.addToEventLog(common.HTMLBold(newPlayer.name) + " hat die Übung '" + common.HTMLBold(FITNESS_MANAGER.exerciseList[data.id].name) + "' gelöscht.");
				uiRefresh();
			});

		});


		socket.on("addDoneExercise", function (data) {
			logFile.log(newPlayer.name + " " + "adds Workout", false, 0);
			var id = Math.random().toFixed(config.ID_LENGTH).slice(2);
			FITNESS_MANAGER.addToHistory(id, PLAYER_LIST[socket.id].name, data.exId, data.weight, data.count, data.countAdditional, data.date, function (result) {
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
				graph = FITNESS_MANAGER.createGraph(data.fromDate, data.toDate, data.pointType, data.type);
			}

			SOCKET_LIST[newPlayer.id].emit('refreshGraph', {
				graph: graph,
				colors: colorsForPlayers,
			});
		});

		socket.on("requestExerciseGraphUpdate", function (data) {
			let graphData = {};
			for (let monthName in FITNESS_MANAGER.monthlyDataExercise) {
				graphData[monthName] = FITNESS_MANAGER.monthlyDataExercise[monthName][data.id];

				for (let playerName in FITNESS_MANAGER.registeredPlayers) {
					if (graphData[monthName] == undefined) {
						graphData[monthName] = {};
					}
					if (graphData[monthName][playerName] == undefined) {
						graphData[monthName][playerName] = 0;
					}

				}
			}


			SOCKET_LIST[newPlayer.id].emit('refreshExerciseGraph', {
				graph: graphData,
				colors: colorsForPlayers,
			});
		});

		socket.on("requestExerciseStatistic", function (data) {
			let repsDaily;
			let repsMonthly;
			let points;
			let reps;

			try {
				repsDaily = FITNESS_MANAGER.maxExerciseCounts[data.id].daily[PLAYER_LIST[socket.id].name];
			}
			catch (e) {
				logFile.log("ExerciseStatistic: repsDaily for player " + PLAYER_LIST[socket.id].name + "not available", false, 0);
				repsDaily = 0;
			}
			try {
				repsMonthly = FITNESS_MANAGER.maxExerciseCounts[data.id].monthly[PLAYER_LIST[socket.id].name];
			}
			catch (e) {
				logFile.log("ExerciseStatistic: repsMonthly for player " + PLAYER_LIST[socket.id].name + "not available", false, 0);
				repsMonthly = 0;
			}
			try {
				points = FITNESS_MANAGER.exerciseList[data.id].pointsPerPlayer[PLAYER_LIST[socket.id].name];
			}
			catch (e) {
				logFile.log("ExerciseStatistic: points for player " + PLAYER_LIST[socket.id].name + "not available", false, 0);
				points = 0;
			}
			try {
				reps = FITNESS_MANAGER.exerciseList[data.id].repsPerPlayer[PLAYER_LIST[socket.id].name];
			}
			catch (e) {
				logFile.log("ExerciseStatistic: reps for player " + PLAYER_LIST[socket.id].name + "not available", false, 0);
				reps = 0;
			}


			SOCKET_LIST[newPlayer.id].emit('refreshExerciseStatistics', {
				points: points,
				reps: reps,
				repsDaily: repsDaily,
				repsMonthly: repsMonthly,
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

			FITNESS_MANAGER.addToEventLog(common.HTMLColor(data.name, USERS[newPlayer.name.toUpperCase()].color) + ": " + data.msg);
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
		socket.emit('configValues', {
			paceUnits: FITNESS_MANAGER.paceUnits,
			paceInvert: FITNESS_MANAGER.paceInvert,
		});


		//someone signs in
		socket.on('SignIn', function (data) {
			isValidPassword(data, function (checkPasswortResult) {
				if (checkPasswortResult.success) {
					if (USERS[checkPasswortResult.username.toUpperCase()].allowEmail == undefined) {
						USERS[checkPasswortResult.username.toUpperCase()].allowEmail = false;
					}
					if (USERS[checkPasswortResult.username.toUpperCase()].email == undefined) {
						USERS[checkPasswortResult.username.toUpperCase()].email = "Nichts hinterlegt.";
					}
					FITNESS_MANAGER.addToEventLog(checkPasswortResult.username + " hat sich angemeldet!");
					OnPlayerConnection(socket);
					loadPlayer(checkPasswortResult.username, socket.id, function (loadPlayerResult) {
						logFile.log(loadPlayerResult, false, 0);
						socket.emit('signInResponse', { success: true, name: checkPasswortResult.username, profileData: { color: USERS[PLAYER_LIST[socket.id].name.toUpperCase()].color, allowEmail: USERS[PLAYER_LIST[socket.id].name.toUpperCase()].allowEmail, email: USERS[PLAYER_LIST[socket.id].name.toUpperCase()].email } });
					});


				}
				else {
					socket.emit('signInResponse', { success: false, name: checkPasswortResult.username });
				}
				if (data.remember) {
					socket.emit('loginToken', { data: USERS[checkPasswortResult.username.toUpperCase()].loginToken });
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
			//If password is correct, create login token if not available
			if (data.loginToken != undefined) {
				//autoLogin
				for (let name in USERS) {
					if (data.loginToken == USERS[name].loginToken) {
						for (let playerId in PLAYER_LIST) {
							if (PLAYER_LIST[playerId].name == name) {
								cb({
									success: false,
									username: "",
								});
								return;
							}
						}
						cb({
							success: true,
							username: name.toLowerCase(),
						});
						return;
					}

				}
				cb({
					success: false,
					username: "",
				});

			}
			else {
				for (let playerId in PLAYER_LIST) {
					if (PLAYER_LIST[playerId].name == data.username) {
						cb({
							success: false,
							username: "",
						});
						return;
					}
				}
				try {
					if (USERS[data.username.toUpperCase()].password == undefined && pwHash.verify(data.password, USERS[data.username.toUpperCase()])) {
						USERS[data.username.toUpperCase()] = {
							password: USERS[data.username.toUpperCase()],
							loginToken: pwHash.generate(data.username + data.password),
						};

					}
					cb({
						success: pwHash.verify(data.username + data.password, USERS[data.username.toUpperCase()].loginToken),
						username: data.username,
					});
				}
				catch (e) {
					cb({
						success: false,
						username: "",
					});
				}

			}

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
			USERS[data.username.toUpperCase()] = {
				password: pwHash.generate(data.password),
				loginToken: pwHash.generate(data.username + data.password),
			};
			FITNESS_MANAGER.needsUpload.dataStorage = true;
			cb();
		}, 10);
	};

}



