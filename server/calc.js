// @ts-nocheck
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
	 * @param {{ votes: { [x: string]: any; }; difficulty: number; difficulty10: number; difficulty100: number; baseWeight: number; usesWeight: boolean; factor: string | number; }} exercise
	 */
		function (exercise) {
			var difficultySum = 0;
			var difficulty10Sum = 0;
			var difficulty100Sum = 0;
			var baseWeightSum = 0;
			var voteCount = 0;
			for (var i in exercise.votes) {
				var vote = exercise.votes[i];
				difficultySum += Number(vote.difficulty);
				difficulty10Sum += Number(vote.difficulty10);
				difficulty100Sum += Number(vote.difficulty100);
				baseWeightSum += Number(vote.baseWeight);
				voteCount++;
			}

			exercise.difficulty = difficultySum / voteCount;
			exercise.difficulty10 = difficulty10Sum / voteCount;
			exercise.difficulty100 = difficulty100Sum / voteCount;
			exercise.baseWeight = baseWeightSum / voteCount;
			if (exercise.baseWeight > 0) {
				exercise.usesWeight = true;
			}

			exercise.factor = ((Number(exercise.difficulty) + Number(exercise.difficulty10) + Number(exercise.difficulty100)) / 3).toFixed(2);
			exercise.factor = Number(exercise.factor);

			return exercise;
		};


	this.calculatePoints = function (exercise, weight, count) {
		var weightFactor = 0;
		if (exercise.usesWeight) {
			weightFactor = Number(weight) / Number(exercise.baseWeight);
		}
		else {
			weightFactor = 1;
		}

		var result = Number(exercise.factor) * Number(count) * Number(weightFactor);

		exercise.points += Number(result);

		return result;
	};

	this.sortByKey = function (array, key) {
		return array.sort(function (a, b) {
			var x = a[key]; var y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
	};

	this.getDateFormat = function (date, format, fromFormat) {
		var addZeroMonth = "";
		var addZeroDay = "";
		if (typeof fromFormat === 'undefined') { fromFormat = 'default'; }

		if (format === "YYYY-MM-DD") {
			if (fromFormat === "DD.MM.YYYY") {
				var day = date.substring(0, 2);
				var month = date.substring(3, 5);
				var year = date.substring(6);
				date = year + "-" + month + "-" + day;
			}
			else {
				if (date.getMonth() < 9) {
					addZeroMonth = "0";
				}
				if (date.getDate() < 10) {
					addZeroDay = "0";
				}
				date = date.getFullYear() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + addZeroDay + date.getDate();
			}
		}
		if (format === "DD-MM-YYYY") {
			if (date.getMonth() < 9) {
				addZeroMonth = "0";
			}
			if (date.getDate() < 10) {
				addZeroDay = "0";
			}
			date = addZeroDay + date.getDate() + "-" + addZeroMonth + (date.getMonth() + 1) + "-" + date.getFullYear();
		}
		if (format === "DD.MM.YYYY") {
			if (date.getMonth() < 9) {
				addZeroMonth = "0";
			}
			if (date.getDate() < 10) {
				addZeroDay = "0";
			}
			date = addZeroDay + date.getDate() + "." + addZeroMonth + (date.getMonth() + 1) + "." + date.getFullYear();
		}

		return date;

	};

	this.createZeroDate = function (date) {
		if (typeof date === 'undefined') {
			zeroDate = new Date();
			zeroDate.setHours(0);
			zeroDate.setMinutes(0);
			zeroDate.setSeconds(0);
		}
		else {
			zeroDate = new Date(date);
			zeroDate.setHours(0);
			zeroDate.setMinutes(0);
			zeroDate.setSeconds(0);
		}
		return zeroDate;
	};

	this.getNonZeroValuesOfArray = function(array){
		var result = 0;
		for(var i = 0; i<array.length;i++){
			if (array[i] > 0){
				result++;
			}
		}
		return result;
	};


}

module.exports = Calc;