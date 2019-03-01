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
		if (exercise.usesWeight){
			weightFactor = Number(weight) / Number(exercise.baseWeight);
		}
		else{
			weightFactor = 1;
		}
		
		var result = Number(exercise.factor) * Number(count) * Number(weightFactor);

		exercise.points += Number(result);

		return result;
	};

	this.sortByKey = function(array, key) {
		return array.sort(function(a, b) {
			var x = a[key]; var y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
	}


}

module.exports = Calc;