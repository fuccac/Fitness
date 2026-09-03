// @ts-check
/*jshint esversion: 6 */


//MODULES etc..
require('dotenv').config();
var express = require('express');
var session = require('express-session');
var application = express();
var http = require("http");
var JSONFileStorage = require('jsonfile-storage');
var Config = require("./server/Config");
var AuthProvider = require('./server/AuthProvider');
var AuthService = require('./server/authService');
var Player = require("./server/Player");
var FitnessManager = require("./server/FitnessManager");
var DropBoxHandler = require("./server/dropBoxHandler");
let Log = require("./server/Log");
let Common = require("./client/js/common");
let EmailManager = require("./server/EmailManager");
var AuthConfig = require('./server/authConfig');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');
var { isAppRequest } = require('./server/helpers');
var escape = require('lodash/escape');


//MODULE INITS
var storageManager = new JSONFileStorage('./saves');
var config = new Config();
var server = new http.Server(application);
var io = require('socket.io')(server, {
	pingTimeout: 3600000,
	allowRequest: function (request, callback) {
		var origin = request.headers.origin;
		var configuredOrigins = (process.env.SOCKET_ALLOWED_ORIGINS || '').split(',').map(function (value) {
			return value.trim();
		}).filter(Boolean);
		var defaultOrigins = [
			'http://localhost:' + config.LOCAL_PORT,
			'http://localhost:8080',
			'https://' + config.DOMAIN,
			'http://' + config.DOMAIN
		];
		var allowedOrigins = new Set(configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins);
		// Native clients may not send an Origin header. Browser origins must be explicit.
		callback(null, !origin || allowedOrigins.has(origin));
	}
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
var ONLINE_STATE = {};
var CSRF_TOKEN_COOKIE_NAME = 'f_csrf';
var USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/;
var MAX_WORKOUT_VALUE = 100000;



var OnPlayerConnection;
var OnSocketConnection;


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
	var date = new Date();
	lastWinner = dailyWinner;
	dailyWinner = FITNESS_MANAGER.getDailyWinner(date);
	if (dailyWinner != lastWinner && dailyWinner != "Keiner" && lastWinner != "Keiner") {
		if (USERS[lastWinner.toUpperCase()].email != undefined && USERS[lastWinner.toUpperCase()].allowEmail) {
			mailer.sendEmail(USERS[lastWinner.toUpperCase()].email, "Tagessieg verloren!", "Dein heutiger Tagessieg wurde von " + dailyWinner + " eingestellt!");
		}
	}

	FITNESS_MANAGER.addEmptyHistoryEntry(date);

	logFile.logUploadTimer++;
	FITNESS_MANAGER.uploadTimer++;
	let currentDate = new Date()

	//Check if logfile is uploadable
	if (logFile.logUploadTimer >= config.LOG_UPLOAD_INTERVAL) {
		logFile.logUploadTimer = 0;
		if (Number(logFile.size) >= 3) {
			var date = new Date();
			let strDate = date.getTime().toString();
			dropbox.uploadFile(DB_TOKEN, config.LOG_FILE_NAME + strDate, function (result) {
				logFile.log(result.msg, false, result.sev);
				logFile.newFile();
			});
		}
		else {
			dropbox.uploadFile(DB_TOKEN, config.LOG_FILE_NAME, function (result) {
				logFile.log(result.msg, false, result.sev);
			});
		}

	}

	//Check if upload is pending
	if (FITNESS_MANAGER.uploadTimer === config.SAVE_UPLOAD_INTERVAL) {
		FITNESS_MANAGER.uploadTimer = 0;
		if (FITNESS_MANAGER.needsUpload.dataStorage) {
			saveDataStorage();
		}
	}

	//Check for Challenge endings
	for (let challengeId in FITNESS_MANAGER.challengeList) {
		if (!FITNESS_MANAGER.challengeList[challengeId].finished) {
			let challengeDate = common.createZeroDate(FITNESS_MANAGER.challengeList[challengeId].endDate)
			if (date >= challengeDate) {
				//challenge ends
				FITNESS_MANAGER.finishChallenge(challengeId, function (result) {
					logFile.log(result, false, 0);
				});
			}
		}
	}

	//NEW DAY CHECK
	//common.daysBetween(date, FITNESS_MANAGER.featuredExerciseDate) >= 1 


	if ((currentDate.getHours() == 0 && currentDate.getMinutes() == 0 && currentDate.getSeconds() == 0) || FITNESS_MANAGER.featuredExerciseId == "") {
		FITNESS_MANAGER.fullRefresh(function (result) {
			let exName = FITNESS_MANAGER.featureNewExercise();
			for (let playerName in USERS) {
				if (USERS[playerName].email != undefined && USERS[playerName].allowEmail) {
					mailer.sendEmail(USERS[playerName].email, "Neue Double Time Übung!", "Die neue Double Time Übung ist: " + exName);
				}
			}

			//check if players have done something last 5 days

			for (let playerName in FITNESS_MANAGER.registeredPlayers) {
				if (config.POWER_FACTOR_ACTIVE) {
					if (FITNESS_MANAGER.registeredPlayers[playerName].points.last5Days >= (config.POINTS_FOR_POWERFACTOR * FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor)) {
						if (FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor == undefined) {
							FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = 1.01;
						}
						else {
							FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor + 0.01;
						}
					}
					else {
						FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor - 0.05;

					}
					if (FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor < 0.95) {
						FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = 0.95
					}
					if (FITNESS_MANAGER.registeredPlayers[playerName].points.total === 0) {
						FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = 1.00
					}
				}
				else {
					FITNESS_MANAGER.registeredPlayers[playerName].points.powerFactor = 1.00
				}
			}
		});
	}



	for (let iPlayer in PLAYER_LIST) {
		let player = PLAYER_LIST[iPlayer];
		if (SOCKET_LIST[player.id] != undefined) {
			SOCKET_LIST[player.id].emit('OnlineStatus', {
				online: ONLINE_STATE,
			});
		}
	}

	FITNESS_MANAGER.today = date;
}


function refreshEventLog() {
	for (var iPlayer in PLAYER_LIST) {
		let player = PLAYER_LIST[iPlayer];
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
		let sortedExList = FITNESS_MANAGER.getSortedExerciseList();
		for (iPlayer in PLAYER_LIST) {
			player = PLAYER_LIST[iPlayer];
			//FITNESS_MANAGER.checkPlayerStuff(player, function (result) {
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
					challengeList: FITNESS_MANAGER.challengeList,
				});
			}
			let end = Date.now();
			logFile.log(`full intervall refresh took ${end - start} ms`, false, 0);
			//});
		}
	});

}

/**
 * @param {Player} player 
 */
function savePlayer(player) {

	let playerData = {
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

function normalizeUsername(username) {
	if (typeof username !== 'string') {
		return null;
	}
	var normalized = username.trim();
	return USERNAME_PATTERN.test(normalized) ? normalized : null;
}

function usernameKey(username) {
	var normalized = normalizeUsername(username);
	return normalized ? normalized.toUpperCase() : null;
}

// Keep the historical spelling of an existing player. This makes the lookup
// case-insensitive without creating a second registeredPlayers/save entry.
function findExistingUsername(username) {
	var key = usernameKey(username);
	if (!key) return null;
	var candidates = Object.keys(FITNESS_MANAGER.registeredPlayers).concat(Object.keys(USERS));
	for (var iterator = 0; iterator < candidates.length; iterator++) {
		if (usernameKey(candidates[iterator]) === key) {
			return candidates[iterator];
		}
	}
	return null;
}

function normalizeDate(value) {
	if (typeof value !== 'string' && !(value instanceof Date)) return null;
	var date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return common.getDateFormat(common.createZeroDate(date), 'YYYY-MM-DD');
}

function isFiniteRange(value, min, max) {
	var number = Number(value);
	return value !== null && value !== '' && Number.isFinite(number) && number >= min && number <= max;
}

function validateWorkoutPayload(data) {
	return data && typeof data === 'object' &&
		typeof data.exId === 'string' && data.exId.length > 0 && data.exId.length <= 128 &&
		!!normalizeDate(data.date) &&
		isFiniteRange(data.count, 0.000001, MAX_WORKOUT_VALUE) &&
		(data.countAdditional === undefined || data.countAdditional === '' || isFiniteRange(data.countAdditional, 0, MAX_WORKOUT_VALUE)) &&
		(data.weight === undefined || data.weight === '' || isFiniteRange(data.weight, 0, MAX_WORKOUT_VALUE)) &&
		(typeof data.atOnce === 'boolean');
}

function validateHistoryDeletion(data) {
	return data && typeof data === 'object' &&
		typeof data.id === 'string' && data.id.length > 0 && data.id.length <= 128 &&
		!!normalizeDate(data.date);
}

function rejectInvalidPayload(socket, eventName) {
	logFile.log('Rejected invalid payload for ' + eventName, false, 1);
	socket.emit('alertMsg', { data: 'Ungültige Anfrage.' });
}

/**
 * @param {string} name 
 * @param {string} id 
 */
function loadPlayer(name, id, cb) {
	var canonicalName = findExistingUsername(name) || name;
	storageManager.get(canonicalName).then(result => {

		PLAYER_LIST[id].name = result.content.name;
		PLAYER_LIST[id].active = result.content.active;
		PLAYER_LIST[id].regDate = result.content.regDate;
		PLAYER_LIST[id].addedExercises = result.content.addedExercises;
		PLAYER_LIST[id].deletedExercises = result.content.deletedExercises;
		PLAYER_LIST[id].modifiedExercises = result.content.modifiedExercises;
		PLAYER_LIST[id].bestExercises = result.content.bestExercises;
		PLAYER_LIST[id].online = result.content.online;

		if (FITNESS_MANAGER.registeredPlayers[canonicalName] == undefined) {
			FITNESS_MANAGER.addNewPlayer(canonicalName);
		}


		uiRefresh();

		cb("player " + PLAYER_LIST[id].name + " loaded");
	})
		.catch((err) => {

			PLAYER_LIST[id].name = canonicalName;
			if (FITNESS_MANAGER.registeredPlayers[canonicalName] == undefined) {
				FITNESS_MANAGER.addNewPlayer(canonicalName);
			}
			uiRefresh();
			cb("Player <" + name + ">: No Savestate.");
		});


}

function loadSaveFiles(loadSaveFilesResult) {
	let start = Date.now();
	function download(id) {
		return new Promise(function (resolve) {
			dropbox.downloadFile(DB_TOKEN, id, function (callback) {
				logFile.log(callback.msg, false, callback.sev);
				resolve();
			});
		});
	}

	Promise.all([download(config.LOG_FILE_NAME), download(config.DATA_STORAGE_FILE_NAME)])
		.then(function () {
			return new Promise(function (resolve) {
				loadFitnessManager(function (result) { resolve(result); });
			});
		})
		.then(function (fitnessManagerLoadingResult) {
			return Promise.all(Object.keys(FITNESS_MANAGER.registeredPlayers).map(function (playerName) {
				return download(playerName + '.json');
			})).then(function () { return fitnessManagerLoadingResult; });
		})
		.then(function (fitnessManagerLoadingResult) {
			let end = Date.now();
			logFile.log(`loadSaveFiles + loadFitnessManager init done in ${end - start} ms`, false, 0);
			loadSaveFilesResult(fitnessManagerLoadingResult);
		});

}

function loadFitnessManager(fitnessManagerLoadingResult) {
	storageManager.get(config.DATA_STORAGE_FILE_NAME.replace(".json", "")).then(result => {
		FITNESS_MANAGER.exerciseList = result.dataStorage.exerciseList;
		FITNESS_MANAGER.history = result.dataStorage.history;
		FITNESS_MANAGER.registeredPlayers = result.dataStorage.registeredPlayers;
		FITNESS_MANAGER.eventLog = result.dataStorage.eventLog;
		if (result.dataStorage.challengeList == undefined || Object.keys(result.dataStorage.challengeList).length === 0) {
			FITNESS_MANAGER.challengeList = {};
		}
		else {
			FITNESS_MANAGER.challengeList = result.dataStorage.challengeList;
		}



		if (Object.keys(FITNESS_MANAGER.history).length === 0) {
			// empty history
			FITNESS_MANAGER.cleanExerciseList();
		}

		try {
			FITNESS_MANAGER.today = new Date(result.dataStorage.fitnessManager.today);
			FITNESS_MANAGER.featuredExerciseId = result.dataStorage.fitnessManager.featuredExerciseId;
			FITNESS_MANAGER.featuredExerciseDate = new Date(result.dataStorage.fitnessManager.featuredExerciseDate);
		}
		catch (e) {
			logFile.log("fitnessManager property data failed to load", false, 0);
		}

		USERS = result.dataStorage.users;


		let colorIterator = 0;
		for (var playerName in FITNESS_MANAGER.registeredPlayers) {
			if (USERS[playerName.toUpperCase()].color != undefined) {
				FITNESS_MANAGER.colorList[playerName] = USERS[playerName.toUpperCase()].color;
			}
			else {
				var letters = '0123456789abcdef';
				var color = '#';
				for (var i = 0; i < 6; i++) {
					color += letters[Math.floor(Math.random() * 16)];
				}
				USERS[playerName.toUpperCase()].color = color;
				FITNESS_MANAGER.colorList[playerName] = color;
			}
			colorIterator++;
		}


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
		name: ["paceConstant", "isPaceExercise", "deleted", "isHidden", "calcMethod"],
		value: [1, false, false, {}, "Standard"],
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
				if (Object.keys(propertiesToAddDirectly.value[iterator]).length === 0) {
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
					if (Object.keys(propertiesToAddVotes.value[iterator]).length === 0) {
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

		//failsave
		if (Object.keys(FITNESS_MANAGER.eventLog).length === 0 || FITNESS_MANAGER.eventLog.time == undefined || FITNESS_MANAGER.eventLog.msg == undefined || FITNESS_MANAGER.eventLog.html == undefined) {
			FITNESS_MANAGER.eventLog = {
				time: [],
				msg: [],
				html: ""
			};
		}
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
	fitnessManagerStorage.featuredExerciseDate = FITNESS_MANAGER.featuredExerciseDate;

	var dataStorage = {
		exerciseList: FITNESS_MANAGER.exerciseList,
		history: FITNESS_MANAGER.history,
		registeredPlayers: FITNESS_MANAGER.registeredPlayers,
		eventLog: FITNESS_MANAGER.eventLog,
		users: USERS,
		fitnessManager: fitnessManagerStorage,
		challengeList: FITNESS_MANAGER.challengeList
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
	if (!process.env.SESSION_COOKIE_SECRET) {
		console.error("no session cookie secret set, exiting...");
		process.exit(1);
	}

	// use
	application.use('/', express.static(__dirname + '/client'));
	application.use('/client', express.static(__dirname + '/client'));
	application.use(session({
		name: process.env.SESSION_COOKIE_NAME ?? 'f_s',
		secret: process.env.SESSION_COOKIE_SECRET,
		resave: false,
		saveUninitialized: true,
		cookie: {
			domain: `.${config.DOMAIN}`,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/'
		}
	}));
	application.use(express.urlencoded({ extended: false }));
	application.use(cookieParser());

	// helper functions
	function getOrCreateCsrfToken(req, res) {
		let csrfTokenValue = req.cookies?.[CSRF_TOKEN_COOKIE_NAME];

		if(!csrfTokenValue) {
			csrfTokenValue = crypto.randomBytes(32).toString('hex');
			res.cookie(CSRF_TOKEN_COOKIE_NAME, csrfTokenValue, {
				domain: `.${config.DOMAIN}`,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: isAppRequest(req) ? 'none' : 'lax',
				path: '/'
			});
		}

		return csrfTokenValue;
	}

	function getAllowedRedirectTo(redirectTo = '/') {
		const allowedRedirects = new Set(['/']);
		return allowedRedirects.has(redirectTo) ? redirectTo : '/';
	}

	function refreshOnce(req, accountId, refreshFunction) {
		const key = `${req.sessionID}:${accountId}`;
		const existingJob = refreshJobs.get(key);

		if (existingJob) {
			return existingJob;
		}

		const job = Promise.resolve()
			.then(refreshFunction)
			.finally(() => {
				if (refreshJobs.get(key) === job) {
					refreshJobs.delete(key);
				}
			});

		refreshJobs.set(key, job);
		return job;
	}
	const authConfig = new AuthConfig();
	const authProvider = new AuthProvider();
	const authService = new AuthService(authProvider);
	const refreshJobs = new Map();

	// middleware functions
	function csrfProtection(req, res, next) {
		const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

		if (safeMethods.includes(req.method)) {
			return next();
		}

		// Entra posts the OIDC callback directly and cannot send our header.
		if (req.path === '/signin' || req.path === '/auth/callback') {
			return next();
		}

		const receivedToken = req.get('X-CSRF-Token');

		if (!receivedToken || receivedToken !== req.cookies?.[CSRF_TOKEN_COOKIE_NAME]) {
			return res.status(403).json({
				code: 'ERR_CSRF_INVALID'
			});
		}

		next();
	}
	function getCookieValue(cookieHeader, name) {
		if (!cookieHeader) return undefined;
		const prefix = `${name}=`;
		const cookie = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
		return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
	}
	async function authenticateSocket(socket, next) {
		try {
			const jwe = getCookieValue(socket.handshake.headers.cookie, authConfig.tokenCookieName);
			if (!jwe) return next(new Error('AUTHENTICATION_REQUIRED'));

			const { token, expiresAt } = await authService.decryptJWE(jwe);
			const user = await authService.validateToken(token, expiresAt);
			if (!user?.username || !user?.id || !user?.email) {
				return next(new Error('AUTHENTICATION_REQUIRED'));
			}

			socket.user = user;
			next();
		} catch (error) {
			console.error('Socket authentication failed:', error);
			next(new Error('AUTHENTICATION_REQUIRED'));
		}
	}
	async function authenticate(req, res, next) {
		try {
			const jwe = req.cookies?.[authConfig.tokenCookieName];
			if (!jwe) {
				return res.status(401).json({
					code: 'ERR_AUTHENTICATION_REQUIRED'
				});
			} 

			const { token, expiresAt } = await authService.decryptJWE(jwe);
			const user = await authService.validateToken(token, expiresAt);

			if (!user?.username || !user?.id || !user?.email) {
				return res.status(401).json({
					code: 'ERR_AUTHENTICATION_REQUIRED'
				});
			}

			req.user = user;
			next();
		} catch (err) {
			return res.status(401).json({ code: err?.code ?? err?.cause?.code ?? 'ERR_UNKOWN' });
		}
	}

	// controller
	function disableCaching(req, res, next) {
		res.set('Cache-Control', 'no-store, private');
		res.set('Pragma', 'no-cache');
		res.set('Expires', '0');
		next();
	}

	application.get('/config', disableCaching, (_, res) => {
		res.json({ contactEmail: process.env.PUBLIC_CONTACT_EMAIL || '' });
	});
	application.get('/csrf-token', disableCaching, (req, res) => {
		res.json({
			csrfToken: getOrCreateCsrfToken(req, res)
		});
	});
	application.get('/profile', disableCaching, authenticate, (req, res) => {
		res.json({ 
			user: req.user
		});
	});
	application.post('/profile/refresh', disableCaching, csrfProtection, async (req, res, next) => {
		try {
			const jwe = req.cookies?.[authConfig.tokenCookieName];

			if (!jwe) {
				return res.status(401).json({
					code: 'ERR_AUTHENTICATION_REQUIRED'
				});
			}

			const { user, expiresAt } = await authService.decryptJWE(jwe);

			if (!authService.isExpired(expiresAt)) {
				return res.status(400).json({
					code: 'ERR_TOKEN_STILL_VALID'
				});
			}

			if (!user?.homeAccountId) {
				res.clearCookie(authProvider.config.tokenCookieName, {
					path: '/'
				});

				return res.status(401).json({
					code: 'ERR_AUTHENTICATION_REQUIRED'
				});
			}

			const cookieValue = await refreshOnce(
				req,
				user.homeAccountId,
				() => authService.refreshToken(req, user.homeAccountId)
			);

			authService.setAuthCookie(res, cookieValue, isAppRequest(req));

			return res.status(200).json({
				success: true
			});
		} catch (e) {
			console.error('Token refresh failed:', e);
			
			res.clearCookie(authProvider.config.tokenCookieName, {
				path: '/'
			});
			return res.status(503).json({
				code: 'ERR_AUTH_REFRESH_FAILED',
				message: 'Die Anmeldung konnte nicht erneuert werden. Bitte melden Sie sich erneut an.'
			});
		}
	});
	application.post('/signin', async function(req, res) {
		req.session.nonce = authProvider.guid();

		const state =
            {
				stage: authProvider.config.flows.signUpSignIn, // flow, in this case sign in and sign up flow created in Entra ID Dashboard
				redirectTo: '/',
				nonce: req.session.nonce,
				isApp: isAppRequest(req)
			};
        
		res.json({
			authUrl: await authProvider.getAuthUrl(req, state, {
				authority: authProvider.config.confidentialClient.auth.authority
			}, {
				authority: authProvider.config.confidentialClient.auth.authority,
				scope: []
			})
		});
	});
	application.post('/signout', csrfProtection, async function (req, res) {
		const logoutEndpoint = await authService.logout(req, res);
		res.json({ logoutEndpoint });
	});
	application.post('/auth/callback', async function(req, res) {
		try {
			if (!req.body.code || !req.body.state) {
				throw new Error('Missing code and/or state');
			}

			const decodedState = JSON.parse(authProvider.base64Decode(req.body.state));
			const { nonce, stage, redirectTo, isApp } = decodedState;

			if (!nonce || !stage) {
				throw new Error(`Required Authentication state was lost in redirect url, these were available: { "nonce": "${!!nonce}", "stage": "${!!stage}" }`, { cause: { stage, isApp } });
			}

			if (req.query.error || req.body.error) {
				throw new Error(req.query.error ?? req.body.error, { cause: {
					stage,
					isApp
				}});
			}
			
			if (req.session.nonce !== nonce) {
				throw new Error('nonce check failed', { cause: {
					stage,
					isApp
				}});
			}

			await authService.callback(req, res, stage, req.body.code, decodedState);
			res.redirect(getAllowedRedirectTo(redirectTo));
		} catch (e) {
			let errorMessageLogs = '';
			let isApp = false;
			let stage = 'unknown';

			if (e instanceof Error) {
				errorMessageLogs = e.message;
				isApp = e.cause?.isApp;
				stage = e.cause?.stage ?? stage;
			}

			errorMessageLogs = !errorMessageLogs ? escape(JSON.stringify(e)) : errorMessageLogs;
			logFile.log(errorMessageLogs, true, 2);

			const errorMessage = 'Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.';
			const errorRedirectWeb = `<meta http-equiv="refresh" content="3;url=/?error=true&message=${encodeURIComponent(errorMessage)}&flow=${encodeURIComponent(stage)}"></meta>`;

            res.send(
			`
				<!DOCTYPE html>
					<html>
						<head>
							<title>Login Error</title>
							${!isApp ? errorRedirectWeb : ''}
						</head>
						<body>
							${
								isApp
									? '<h1>Error during Authentication. Please close the Browser and try again.</h1>'
									: '<h1>Error during Authentication. Redirecting to Home.</h1>'
							}
							<p>
									${errorMessage}
							</p>
						</body>
					</html>
				`
			).status(400);
		}
	});

	server.listen(process.env.PORT || config.LOCAL_PORT);
	logFile.log("Started Server", true, 0);
	io.use(authenticateSocket);

	io.sockets.on('connection', function (socket) {
		OnSocketConnection(socket);
	});

	//PLAYER CONNECTS (LOGIN)
	OnPlayerConnection = function (socket) {

		var newPlayer = new Player(socket.id);
		// Bind all subsequent socket handlers to the authenticated identity immediately.
		newPlayer.name = socket.authenticatedUsername;
		PLAYER_LIST[newPlayer.id] = newPlayer;


		socket.on("endChallenge", function (data) {
			if (!data || typeof data.data !== 'string' || data.data.length > 128) {
				rejectInvalidPayload(socket, 'endChallenge');
				return;
			}
			FITNESS_MANAGER.finishChallenge(data.data, function (endChallengeResult) {
				logFile.log(endChallengeResult, false, 0);
				uiRefresh();
			});

		});
		socket.on("hideExercise", function (data) {
			if (!data || typeof data.id !== 'string' || !FITNESS_MANAGER.exerciseList[data.id]) {
				rejectInvalidPayload(socket, 'hideExercise');
				return;
			}
			FITNESS_MANAGER.hideExercise(data.id, newPlayer.name, function (hideExerciseResult) {
				logFile.log(hideExerciseResult, false, 0);
				uiRefresh();
			});
		});

		socket.on("savePersonalPrefs", function (data) {
			if (!data || data.prefName !== "hideInactivePlayers" || typeof data.value !== 'boolean') {
				rejectInvalidPayload(socket, 'savePersonalPrefs');
				return;
			}
			if (data.prefName === "hideInactivePlayers") {
				USERS[newPlayer.name.toUpperCase()].hideInactivePlayers = data.value;
			}

			FITNESS_MANAGER.needsUpload.dataStorage = true;

		});



		socket.on("requestProfileUpdate", function (data) {
			var allowedProfileKeys = new Set(['email', 'allowEmail', 'color']);
			if (!data || typeof data !== 'object' || Object.keys(data).some(function (key) { return !allowedProfileKeys.has(key); }) ||
				(data.email !== undefined && (typeof data.email !== 'string' || data.email.length > 254)) ||
				(data.allowEmail !== undefined && typeof data.allowEmail !== 'boolean') ||
				(data.color !== undefined && (typeof data.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(data.color)))) {
				rejectInvalidPayload(socket, 'requestProfileUpdate');
				return;
			}
			for (let key in data) {
				USERS[newPlayer.name.toUpperCase()][key] = data[key];
			}
			if (FITNESS_MANAGER.colorList[newPlayer.name] != USERS[newPlayer.name.toUpperCase()].color) {
				FITNESS_MANAGER.updateEventLogColor(newPlayer.name, USERS[newPlayer.name.toUpperCase()].color);

			}
			FITNESS_MANAGER.colorList[newPlayer.name] = USERS[newPlayer.name.toUpperCase()].color;

			FITNESS_MANAGER.needsUpload.dataStorage = true;
			refreshEventLog();
			logFile.log(newPlayer.name + " updates profile", true, 0);
		});



		socket.on("requestExerciseListUpdate", function (data) {
			SOCKET_LIST[newPlayer.id].emit('refreshExerciseList', {
				exercises: FITNESS_MANAGER.getSortedExerciseList(),
			});
		});


		socket.on("modifyExercise", function (data) {
			if (!data || typeof data !== 'object' || typeof data.id !== 'string' || !FITNESS_MANAGER.exerciseList[data.id] ||
				typeof data.name !== 'string' || data.name.length === 0 || data.name.length > 200 ||
				typeof data.unit !== 'string' || typeof data.type !== 'string' || typeof data.equipment !== 'string' ||
				typeof data.bothSides !== 'string' || typeof data.isPaceExercise !== 'boolean') {
				rejectInvalidPayload(socket, 'modifyExercise');
				return;
			}
			var creator = PLAYER_LIST[newPlayer.id].name;
			logFile.log(newPlayer.name + " " + "edits Exercise " + data.name, false, 0);
			FITNESS_MANAGER.editExercise(data, creator, function (result) {
				PLAYER_LIST[newPlayer.id].modifiedExercises++;
				uiRefresh();
			});
		});

		socket.on("addExercise", function (data) {
			if (!data || typeof data !== 'object' || typeof data.name !== 'string' || data.name.length === 0 || data.name.length > 200 ||
				typeof data.unit !== 'string' || typeof data.type !== 'string' || typeof data.equipment !== 'string' ||
				typeof data.bothSides !== 'boolean' && typeof data.bothSides !== 'string') {
				rejectInvalidPayload(socket, 'addExercise');
				return;
			}
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
			if (!data || typeof data.id !== 'string' || !FITNESS_MANAGER.exerciseList[data.id]) {
				rejectInvalidPayload(socket, 'deleteExercise');
				return;
			}
			FITNESS_MANAGER.deleteExercise(data.id, function (result) {
				PLAYER_LIST[newPlayer.id].deletedExercises++;
				logFile.log(newPlayer.name + " deleted " + result, false, 0);
				FITNESS_MANAGER.addToEventLog(common.HTMLBold(newPlayer.name) + " hat die Übung '" + common.HTMLBold(result) + "' gelöscht.");
				uiRefresh();
			});

		});


		socket.on("addDoneExercise", function (data) {
			if (!validateWorkoutPayload(data) || !FITNESS_MANAGER.exerciseList[data.exId]) {
				rejectInvalidPayload(socket, 'addDoneExercise');
				return;
			}
			var currentDateInfo = common.getDateInfo(data.date);
			if (currentDateInfo.isLast30Days) {
				logFile.log(newPlayer.name + " " + "adds Workout", false, 0);
				var id = crypto.randomUUID();
				FITNESS_MANAGER.addToHistory(id, PLAYER_LIST[socket.id].name, data.exId, data.weight, data.count, data.countAdditional, data.date, data.atOnce, function (result) {
					logFile.log(result, false, 0);
					uiRefresh();
				});
			}
			else {
				socket.emit('alertMsg', { data: "Das ist länger als 30 Tage her - Ungültig!" });
			}
		});

		socket.on("deleteHistory", function (data) {
			if (!validateHistoryDeletion(data)) {
				rejectInvalidPayload(socket, 'deleteHistory');
				return;
			}
			var historyDate = normalizeDate(data.date);
			var historyOwner = FITNESS_MANAGER.getHistoryEntryOwner(data.id, historyDate);
			if (!historyOwner || usernameKey(historyOwner) !== usernameKey(PLAYER_LIST[socket.id].name)) {
				rejectInvalidPayload(socket, 'deleteHistory ownership');
				return;
			}

			var currentDateInfo = common.getDateInfo(historyDate);
			if (currentDateInfo.isLast30Days) {
				logFile.log(newPlayer.name + " " + "deletes Workout", false, 0);
				FITNESS_MANAGER.deleteHistory(data.id, historyDate, function (result) {
					logFile.log(result, false, 0);
					uiRefresh();
				});
			}
			else {
				socket.emit('alertMsg', { data: "Das ist länger als 30 Tage her - Ungültig!" });
			}

		});


		socket.on("requestHistoryUpdate", function (data) {
			logFile.log(newPlayer.name + " " + "requests History update", false, 0);
			var historyChunk = FITNESS_MANAGER.getDefinedHistory(data.fromDate, data.toDate);
			SOCKET_LIST[newPlayer.id].emit('refreshHistory', {
				history: historyChunk,
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
				colors: FITNESS_MANAGER.colorList,
			});
			logFile.log(newPlayer.name + " gets Graph", false, 0);
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
				colors: FITNESS_MANAGER.colorList,
			});
			logFile.log(newPlayer.name + " gets Exercise Graph", false, 0);
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

			logFile.log(newPlayer.name + " gets Exercise Statistics", false, 0);

		});


		socket.on("sendChatMessage", function (data) {
			if (!data || typeof data.msg !== 'string' || data.msg.length === 0 || data.msg.length > 2000) {
				rejectInvalidPayload(socket, 'sendChatMessage');
				return;
			}
			data.name = newPlayer.name;
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
			logFile.log(data.name + " sends chat message", false, 0);
		});

		socket.on("addAchievementToExercise", function (data) {

			if (data.name.toLowerCase() === "caf") {
				if (data.achievementCategory != "" && data.achievementCategory != undefined) {
					let repsToGetOverall = data.repsToGetOverall.split(",");
					let repsToGetDaily = data.repsToGetDaily.split(",");
					let repsToGetMonthly = data.repsToGetMonthly.split(",");
					FITNESS_MANAGER.addExerciseAchievement(data.id, repsToGetOverall, repsToGetDaily, repsToGetMonthly, data.achievementCategory);
				}
				else {
					socket.emit('alertMsg', { data: "achievementCategory leer oder ungültig." });
				}

			}
			else {
				socket.emit('alertMsg', { data: "Benötigt Admin Rechte." });
			}

			uiRefresh();
		});

		socket.on("requestAchievementDataForExercise", function (data) {
			if (data.id != undefined && data.id != "") {
				socket.emit('sendAchievementDataForExercise', {
					daily: FITNESS_MANAGER.exerciseList[data.id].achievementInfo.repsToGetDaily,
					monthly: FITNESS_MANAGER.exerciseList[data.id].achievementInfo.repsToGetMonthly,
					overall: FITNESS_MANAGER.exerciseList[data.id].achievementInfo.repsToGetOverall,
					category: FITNESS_MANAGER.exerciseList[data.id].achievementInfo.achievementCategory
				});

			}
		});

		socket.on("addChallenge", function (data) {
			if (!data || typeof data.id !== 'string' || !FITNESS_MANAGER.exerciseList[data.id] ||
				typeof data.dateStart !== 'string' || !normalizeDate(data.dateStart) ||
				typeof data.dateEnd !== 'string' || !normalizeDate(data.dateEnd) ||
				typeof data.challengeName !== 'string' || data.challengeName.length === 0 || data.challengeName.length > 200 ||
				!isFiniteRange(data.toDo, 1, MAX_WORKOUT_VALUE)) {
				rejectInvalidPayload(socket, 'addChallenge');
				return;
			}
			FITNESS_MANAGER.createChallenge(data.id, data.dateStart, data.dateEnd, data.challengeName, Number(data.toDo), newPlayer.name)

			uiRefresh();


		});

		logFile.log("OnPlayerConnection done", false, 0);
	};

	//NEW SOCKET CONNECTS (LOGIN)
	OnSocketConnection = function (socket) {
		//someone connects
		socket.id = crypto.randomUUID();
		SOCKET_LIST[socket.id] = socket;
		logFile.log('new socket connection (' + socket.id + ")", false, 0);
		socket.emit('configValues', {
			paceUnits: FITNESS_MANAGER.paceUnits,
			paceInvert: FITNESS_MANAGER.paceInvert,
		});

		const username = socket.user.username;
		const normalizedUsername = normalizeUsername(username);
		if (!normalizedUsername) {
			logFile.log('Rejected authenticated user with invalid username', false, 2);
			socket.disconnect(true);
			return;
		}
		const existingUsername = findExistingUsername(normalizedUsername);
		const playerUsername = existingUsername || normalizedUsername;
		socket.authenticatedUsername = playerUsername;
		const userKey = usernameKey(playerUsername);
		const existingUserRecord = USERS[userKey];
		if (existingUserRecord && existingUserRecord.identityId && existingUserRecord.identityId !== socket.user.id) {
			socket.emit('usernameUnavailable', {
				code: 'ERR_USERNAME_ALREADY_USED',
				message: 'Dieser Username wird bereits von einem anderen Benutzer verwendet. Bitte wählen Sie einen anderen Username.'
			});
			delete SOCKET_LIST[socket.id];
			socket.disconnect(true);
			return;
		}
		const userRecord = USERS[userKey] || (USERS[userKey] = {
			email: socket.user.email,
			allowEmail: false,
			hideInactivePlayers: false,
			color: '#777777',
			identityId: socket.user.id
		});
		if (!userRecord.identityId) {
			// Legacy Dropbox users have no Entra identity yet; bind them on first login.
			userRecord.identityId = socket.user.id;
			FITNESS_MANAGER.needsUpload.dataStorage = true;
		}
		userRecord.email = userRecord.email || socket.user.email;
		userRecord.allowEmail = userRecord.allowEmail === true;
		userRecord.hideInactivePlayers = userRecord.hideInactivePlayers === true;

		FITNESS_MANAGER.addToEventLog(playerUsername + " hat sich angemeldet!");
		OnPlayerConnection(socket);
		loadPlayer(playerUsername, socket.id, function (loadPlayerResult) {
			logFile.log(loadPlayerResult, false, 0);
			socket.emit('authenticated', {
				success: true,
				name: playerUsername,
				profileData: {
					color: userRecord.color,
					allowEmail: userRecord.allowEmail,
					email: userRecord.email,
					hideInactivePlayers: userRecord.hideInactivePlayers
				}
			});
		});

		FITNESS_MANAGER.colorList[playerUsername] = userRecord.color;
		ONLINE_STATE[playerUsername] = true;

		//someone disconnects
		socket.on('disconnect', function () {
			//Save



			if (PLAYER_LIST[socket.id] != undefined) {
				ONLINE_STATE[PLAYER_LIST[socket.id].name] = false;
				FITNESS_MANAGER.addToEventLog(PLAYER_LIST[socket.id].name + " hat sich abgemeldet.");
				savePlayer(PLAYER_LIST[socket.id]);
				delete PLAYER_LIST[socket.id];
			}

			delete SOCKET_LIST[socket.id];


			logFile.log('socket connection lost (' + socket.id + ")", false, 0);
		});

		socket.on('connect_timeout', function (timeout) {
			logFile.log('socket connection timeout (' + socket.id + ")", false, 0);
		});

		socket.on('reconnect', (attemptNumber) => {
			logFile.log('socket reconnect number ' + attemptNumber + ' (' + socket.id + ")", false, 0);
		});


	};



}
