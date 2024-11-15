const numbers: string[] = '1⃣ 2⃣ 3⃣ 4⃣ 5⃣ 6⃣ 7⃣ 8⃣ 9⃣ 🔟'.split(' ');

const emoji = {
  pray: '🙏',
  thumbsDown: '👎',
  thumbsUp: '👍',
  wave: '👋',
  shrug: '🤷‍♀️',
  think: '🤔',
  drink: '🍹',
  martini: '🍸',
  wine: '🍷',
  boat: '⛵',
  box: '📦',
  island: '🏝️',
  robot: '🤖',
  tada: '🎉',
  number: (num: number) => numbers[num - 1],
} as const;

export default emoji;
