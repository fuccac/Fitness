// @ts-check
/*jshint esversion: 6 */

function Calc() {
	this.rand = /**
	 * @param {number} min
	 * @param {number} max
	 * @param {number} negative
	 */
		function (min, max, negative) {
			var rand = 0;
			if (negative) {
				negative = Math.round(Math.random());
			}
			else {
				negative = 0;
			}

			if (negative) {
				rand = (Math.floor(Math.random() * (max - min + 1)) + min) * (-1);
				return rand;
			}
			else {
				rand = Math.floor(Math.random() * (max - min + 1)) + min;
				return rand;
			}

		};

	this.calculateNewFactor = /**
	 * @param {{ votes: { [x: string]: any; }; difficulty: number; difficulty10: number; difficulty100: number; baseWeight: number; paceConstant:number, usesWeight: boolean; factor: string | number; }} exercise
	 */
		function (exercise) {
			var difficultySum = 0;
			var difficulty10Sum = 0;
			var difficulty100Sum = 0;
			var baseWeightSum = 0;
			var paceConstantSum = 0;
			var voteCount = 0;
			for (var i in exercise.votes) {
				var vote = exercise.votes[i];
				difficultySum += Number(vote.difficulty);
				difficulty10Sum += Number(vote.difficulty10);
				difficulty100Sum += Number(vote.difficulty100);
				paceConstantSum += Number(vote.paceConstant);
				baseWeightSum += Number(vote.baseWeight);
				voteCount++;
			}

			exercise.difficulty = difficultySum / voteCount;
			exercise.difficulty10 = difficulty10Sum / voteCount;
			exercise.difficulty100 = difficulty100Sum / voteCount;
			exercise.paceConstant = paceConstantSum / voteCount;
			exercise.baseWeight = baseWeightSum / voteCount;
			if (exercise.baseWeight > 0) {
				exercise.usesWeight = true;
			}
			else {
				exercise.usesWeight = false;
			}

			exercise.factor = ((Number(exercise.difficulty) + Number(exercise.difficulty10) + Number(exercise.difficulty100)) / 3).toFixed(2);
			exercise.factor = Number(exercise.factor);

			return exercise;
		};


	this.calculatePoints = function (exercise, weight, count, countAdditional, pace, atOnce,powerFactor) {
		var weightFactor = 0;
		var result;

		if (exercise.usesWeight) {
			weightFactor = Number(weight) / Number(exercise.baseWeight);
		}
		else {
			weightFactor = 1;
		}

		//SPECIAL LAUFEN CALCMETHOD
		if (exercise.calcMethod.toLowerCase() == "klettern") {
			
			result = Number(count) * (500/60);
			pace[exercise.id] = "-";
		}

		if (exercise.calcMethod.toLowerCase() == "yoga") {
			
			result = Number(count) * (400/60);
			pace[exercise.id] = "-";
		}

		else if (exercise.calcMethod.toLowerCase() == "mountainbiken") {
			let paces = [-8.82,-8.49,-8.16,-7.83,-7.5,-7.17,-6.84,-6.51,-6.18,-5.85,-5.52,-5.19,-4.86,-4.53,-4.2,-3.87,-3.54,-3.21,-2.88,-2.55,-2.22,-1.89,-1.56,-1.23,-0.9,-0.57,-0.24,0.09,0.42,0.75,1.08,1.41,1.74,2.07,2.4,2.73,3.06,3.39,3.72,4.05,4.38,4.71,5.04,5.37,5.7,6.03,6.36,6.69,7.02,7.35,7.68,8.01,8.34,8.67,9,9.33,9.66,9.99,10.32,10.65,10.98,11.31,11.64,11.97,12.3,12.63,12.96,13.29,13.62,13.95,14.28,14.61,14.94,15.27,15.6,15.93,16.26,16.59,16.92,17.25,17.58,17.91,18.24,18.57,18.9,19.23,19.56,19.89,20.22,20.55,20.88,21.21,21.54,21.87,22.2,22.53,22.86,23.19,23.52,23.85,24.18,24.51,24.84,25.17,25.5,25.83,26.16,26.49,26.82,27.15,27.48,27.81,28.14,28.47,28.8,29.13,29.46,29.79,30.12,30.45,30.78,31.11,31.44,31.77,32.1,32.43,32.76,33.09,33.42,33.75,34.08,34.41,34.74,35.07,35.4,35.73,36.06,36.39,36.72,37.05,37.38,37.71,38.04,38.37,38.7,39.03,39.36,39.69,40.02,40.35,40.68,41.01,41.34,41.67,42]
			let bonusfactors = [-0.9453376206,-0.9099678457,-0.8745980707,-0.8392282958,-0.8038585209,-0.768488746,-0.7331189711,-0.6977491961,-0.6623794212,-0.6270096463,-0.5916398714,-0.5562700965,-0.5209003215,-0.4855305466,-0.4501607717,-0.4147909968,-0.3794212219,-0.3440514469,-0.308681672,-0.2733118971,-0.2379421222,-0.2025723473,-0.1672025723,-0.1318327974,-0.0964630225,-0.0610932476,-0.0257234727,0.0096463023,0.0450160772,0.0803858521,0.115755627,0.1511254019,0.1864951768,0.2218649518,0.2572347267,0.2926045016,0.3279742765,0.3633440514,0.3987138264,0.4340836013,0.4694533762,0.5048231511,0.540192926,0.575562701,0.6109324759,0.6463022508,0.6816720257,0.7170418006,0.7524115756,0.7877813505,0.8231511254,0.8585209003,0.8938906752,0.9292604502,0.9646302251,1,1.0353697749,1.0707395498,1.1061093248,1.1414790997,1.1768488746,1.2122186495,1.2475884244,1.2829581994,1.3183279743,1.3536977492,1.3890675241,1.424437299,1.459807074,1.4951768489,1.5305466238,1.5659163987,1.6012861736,1.6366559486,1.6720257235,1.7073954984,1.7427652733,1.7781350482,1.8135048232,1.8488745981,1.884244373,1.9196141479,1.9549839228,1.9903536977,2.0257234727,2.0610932476,2.0964630225,2.1318327974,2.1672025723,2.2025723473,2.2379421222,2.2733118971,2.308681672,2.3440514469,2.3794212219,2.4147909968,2.4501607717,2.4855305466,2.5209003215,2.5562700965,2.5916398714,2.6270096463,2.6623794212,2.6977491961,2.7331189711,2.768488746,2.8038585209,2.8392282958,2.8745980707,2.9099678457,2.9453376206,2.9807073955,3.0160771704,3.0514469453,3.0868167203,3.1221864952,3.1575562701,3.192926045,3.2282958199,3.2636655949,3.2990353698,3.3344051447,3.3697749196,3.4051446945,3.4405144695,3.4758842444,3.5112540193,3.5466237942,3.5819935691,3.6173633441,3.652733119,3.6881028939,3.7234726688,3.7588424437,3.7942122186,3.8295819936,3.8649517685,3.9003215434,3.9356913183,3.9710610932,4.0064308682,4.0418006431,4.077170418,4.1125401929,4.1479099678,4.1832797428,4.2186495177,4.2540192926,4.2893890675,4.3247588424,4.3601286174,4.3954983923,4.4308681672,4.4662379421,4.501607717]
			let basePoints = 0;

			if (exercise.unit === "Hoehenmeter/min") {
				pace[exercise.id] = Number(count) / Number(countAdditional);
				basePoints = Number(count)  * Number(exercise.factor); //Höhenmeter * faktor
			}

			for (let i = 1; i < paces.length; i++) {
				if ((pace[exercise.id] <= paces[i] && pace[exercise.id] > paces[i - 1]) || i == paces.length - 1 || pace[exercise.id] < paces[0]) {
					result = basePoints * bonusfactors[i];
					break;
				}
			}

			pace[exercise.id] = Number(count) / Number(countAdditional);

		}

		else if (exercise.calcMethod.toLowerCase() == "laufen") {
			let paces = [15, 14.8, 14.6, 14.4, 14.2, 14, 13.8, 13.6, 13.4, 13.2, 13, 12.8, 12.6, 12.4, 12.2, 12, 11.8, 11.6, 11.4, 11.2, 11, 10.8, 10.6, 10.4, 10.2, 10, 9.8, 9.6, 9.4, 9.2, 9, 8.8, 8.6, 8.4, 8.2, 8, 7.8, 7.6, 7.4, 7.2, 7, 6.8, 6.6, 6.4, 6.2, 6, 5.8, 5.6, 5.4, 5.2, 5, 4.8, 4.6, 4.4, 4.2, 4];
			let bonusfactors = [0.035714286, 0.071428571, 0.107142857, 0.142857143, 0.178571429, 0.214285714, 0.25, 0.285714286, 0.321428571, 0.357142857, 0.392857143, 0.428571429, 0.464285714, 0.5, 0.535714286, 0.571428571, 0.607142857, 0.642857143, 0.678571429, 0.714285714, 0.75, 0.785714286, 0.821428571, 0.857142857, 0.892857143, 0.928571429, 0.964285714, 1, 1.035714286, 1.071428571, 1.107142857, 1.142857143, 1.178571429, 1.214285714, 1.25, 1.285714286, 1.321428571, 1.357142857, 1.392857143, 1.428571429, 1.464285714, 1.5, 1.535714286, 1.571428571, 1.607142857, 1.642857143, 1.678571429, 1.714285714, 1.75, 1.785714286, 1.821428571, 1.857142857, 1.892857143, 1.928571429, 1.964285714, 2];
			let basePoints = 0;
			if (exercise.unit === "min/km") {
				pace[exercise.id] = Number(count) / Number(countAdditional);
				basePoints = Number(countAdditional) * 10 * Number(exercise.factor);
			}
			if (exercise.unit === "min/m") {
				pace[exercise.id] = Number(count) / (Number(countAdditional) / 1000);
				basePoints = (Number(countAdditional) / 1000) * 10 * Number(exercise.factor);
			}

			for (let i = 1; i < paces.length; i++) {
				if ((pace[exercise.id] > paces[i] && pace[exercise.id] <= paces[i - 1]) || i == paces.length - 1 || pace[exercise.id] > paces[0]) {
					result = basePoints * bonusfactors[i];
					break;
				}
			}
			pace[exercise.id] = Number(count) / Number(countAdditional);

		}

		else if (exercise.calcMethod.toLowerCase() == "inlineskaten") {
			let paces = [7.5,7.4,7.3,7.2,7.1,7,6.9,6.8,6.7,6.6,6.5,6.4,6.3,6.2,6.1,6,5.9,5.8,5.7,5.6,5.5,5.4,5.3,5.2,5.1,5,4.9,4.8,4.7,4.6,4.5,4.4,4.3,4.2,4.1,4,3.9,3.8,3.7,3.6,3.5,3.4,3.3,3.2,3.1,3,2.9,2.8,2.7,2.6,2.5,2.4,2.3,2.2,2.1,2];
			let bonusfactors = [0.017857143,0.0357142855,0.0535714285,0.0714285715,0.0892857145,0.107142857,0.125,0.142857143,0.1607142855,0.1785714285,0.1964285715,0.2142857145,0.232142857,0.25,0.267857143,0.2857142855,0.3035714285,0.3214285715,0.3392857145,0.357142857,0.375,0.392857143,0.4107142855,0.4285714285,0.4464285715,0.4642857145,0.482142857,0.5,0.517857143,0.5357142855,0.5535714285,0.5714285715,0.5892857145,0.607142857,0.625,0.642857143,0.6607142855,0.6785714285,0.6964285715,0.7142857145,0.732142857,0.75,0.767857143,0.7857142855,0.8035714285,0.8214285715,0.8392857145,0.857142857,0.875,0.892857143,0.9107142855,0.9285714285,0.9464285715,0.9642857145,0.982142857,1];
			let basePoints = 0;
			if (exercise.unit === "min/km") {
				pace[exercise.id] = Number(count) / Number(countAdditional);
				basePoints = Number(countAdditional) * 10 * Number(exercise.factor);
			}
			if (exercise.unit === "min/m") {
				pace[exercise.id] = Number(count) / (Number(countAdditional) / 1000);
				basePoints = (Number(countAdditional) / 1000) * 10 * Number(exercise.factor);
			}

			for (let i = 1; i < paces.length; i++) {
				if ((pace[exercise.id] > paces[i] && pace[exercise.id] <= paces[i - 1]) || i == paces.length - 1 || pace[exercise.id] > paces[0]) {
					result = basePoints * bonusfactors[i];
					break;
				}
			}
			pace[exercise.id] = Number(count) / Number(countAdditional);

		}

		//STANDARD METHOD
		else if ((countAdditional == undefined && atOnce == false) || (countAdditional == undefined && exercise.calcMethod.toLowerCase() == "standard") || exercise.calcMethod == undefined) {
			result = Number(exercise.factor) * Number(count) * Number(weightFactor);
			pace[exercise.id] = "-";
		}

		//AT ONCE IS CHECKED - USE #CALCMETHOD
		else if (atOnce && countAdditional == undefined) {
			if (exercise.calcMethod.toLowerCase().search("#") > -1) {
				let countValues = exercise.calcMethod.replace("#", "");

				countValues = countValues.split(",").map(Number);
				let percent = [Math.min(Number(count) / countValues[0], 1), Math.min(Number(count) / countValues[1], 1), Math.min(Number(count) / countValues[2], 1)];
				let combinedFactor = exercise.difficulty * percent[0] + exercise.difficulty10 * percent[1] + exercise.difficulty100 * percent[2];
				if (combinedFactor < exercise.factor) {
					combinedFactor = exercise.factor;
				}
				result = Number(count) * combinedFactor * Number(weightFactor);
			}
			pace[exercise.id] = "-";
		}
		
		
		//SPECIAL LIEGESTÜTZ CALCMETHOD - old
		else if (exercise.calcMethod.toLowerCase() == "liegestütz") {
			let repsAtOnce = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
			let bonusfactors = [1, 1.04, 1.06, 1.08, 1.1, 1.12, 1.14, 1.16, 1.18, 1.2, 1.22, 1.24, 1.26, 1.28, 1.3, 1.32, 1.34, 1.36, 1.38, 1.4, 1.42, 1.44, 1.46, 1.48, 1.5, 1.52, 1.54, 1.56, 1.58, 1.6, 1.62, 1.64, 1.66, 1.68, 1.7, 1.72, 1.74, 1.76, 1.78, 1.8, 1.82, 1.84, 1.86, 1.88, 1.9, 1.92, 1.94, 1.96, 1.98, 2, 2.02, 2.04, 2.06, 2.08, 2.1, 2.12, 2.14, 2.16, 2.18, 2.2, 2.22, 2.24, 2.26, 2.28, 2.3, 2.32, 2.34, 2.36, 2.38, 2.4, 2.42, 2.44, 2.46, 2.48, 2.5, 2.52, 2.54, 2.56, 2.58, 2.6, 2.62, 2.64, 2.66, 2.68, 2.7, 2.72, 2.74, 2.76, 2.78, 2.8, 2.82, 2.84, 2.86, 2.88, 2.9, 2.92, 2.94, 2.96, 2.98, 3];
			let basePoints = Number(exercise.factor) * Number(count) * Number(weightFactor);

			for (let i = 1; i < repsAtOnce.length; i++) {
				if (Number(count) < repsAtOnce[0]) {
					result = basePoints;
				}
				if ((Number(count) < repsAtOnce[i] && Number(count) >= repsAtOnce[i - 1]) || i == repsAtOnce.length - 1) {
					result = basePoints * bonusfactors[i];
					break;
				}
			}
			pace[exercise.id] = "-";
		}
		//REST ..
		else {
			if (exercise.unit === "min/km") {
				pace[exercise.id] = Number(count) / Number(countAdditional);
				result = ((Number(exercise.paceConstant) / (Number(pace[exercise.id]) / Number(countAdditional))) * Number(exercise.factor)) * Number(weightFactor);
			}
			if (exercise.unit === "min/m") {
				pace[exercise.id] = Number(count) / Number((countAdditional) / 1000);
				result = ((Number(exercise.paceConstant) / (Number(pace[exercise.id]) / (Number(countAdditional) / 1000))) * Number(exercise.factor)) * Number(weightFactor);
				pace[exercise.id] = Number(count) / Number((countAdditional));
			}
			if (exercise.unit === "Wdh/min") {
				pace[exercise.id] = Number(count) / Number(countAdditional);
				result = ((Number(exercise.paceConstanWt) / (1 / (Number(pace[exercise.id])) / Number(count))) * Number(exercise.factor)) * Number(weightFactor);
			}
			if (exercise.unit === "Wdh/sec") {
				pace[exercise.id] = Number(count) / (Number(countAdditional)/60);
				result = ((Number(exercise.paceConstanWt) / (1 / (Number(pace[exercise.id])) / Number(count))) * Number(exercise.factor)) * Number(weightFactor);
				pace[exercise.id] = Number(count) / Number(countAdditional);
			}
		}



		
		if (result == undefined){
			result =0
		}
		if (pace[exercise.id] == undefined)
		{
			pace[exercise.id] = "-"
		}

		if (isNaN(result)){
			result = 0;
		}

		if (pace[exercise.id] != "-") {
			if (isNaN(pace[exercise.id])){
				pace[exercise.id] = "-"
			}
		}
		exercise.points += Number(result);
		return result * powerFactor;

	};

	this.calculateCardioStrengthPercents = function (cardioPoints, strengthPoints) {
		let cardioPercent = Number(cardioPoints / (cardioPoints + strengthPoints));
		let strengthPercent = strengthPoints / (cardioPoints + strengthPoints);
		cardioPercent = Number((cardioPercent * 100).toFixed(0));
		strengthPercent = Number((strengthPercent * 100).toFixed(0));

		if (isNaN(cardioPercent)) {
			cardioPercent = 0;
		}
		if (isNaN(strengthPercent)) {
			strengthPercent = 0;
		}

		return ("Cardio: " + cardioPercent + "% | Stärke: " + strengthPercent + "%");
	};

	this.sortByKey = function (array, key) {
		return array.sort(function (a, b) {
			var x = a[key]; var y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
	};

	this.getNonZeroValuesOfArray = function (array) {
		var result = 0;
		for (var i = 0; i < array.length; i++) {
			if (array[i] > 0) {
				result++;
			}
		}
		return result;
	};





}



module.exports = Calc;