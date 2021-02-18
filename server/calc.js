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
		cardioPercent = (cardioPercent * 100).toFixed(0);
		strengthPercent = (strengthPercent * 100).toFixed(0);

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