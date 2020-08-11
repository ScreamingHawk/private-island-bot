const numbers = '1⃣ 2⃣ 3⃣ 4⃣ 5⃣ 6⃣ 7⃣ 8⃣ 9⃣ 🔟'.split(' ')

module.exports = {
	// Hands
	thumbsDown: '👎',
	thumbsUp: '👍',
	wave: '👋',
	// Faces
	shrug: '🤷‍♀️',
	think: '🤔',
	// Food
	drink: '🍹',
	martini: '🍸',
	wine: '🍷',
	// Things
	box: '📦',
	island: '🏝️',
	robot: '🤖',
	tada: '🎉',
	// Misc
	number: num => numbers[num - 1],
}
