const numbers: string[] = '1⃣ 2⃣ 3⃣ 4⃣ 5⃣ 6⃣ 7⃣ 8⃣ 9⃣ 🔟'.split(' ');

interface EmojiMap {
  pray: string;
  thumbsDown: string;
  thumbsUp: string;
  wave: string;
  shrug: string;
  think: string;
  drink: string;
  martini: string;
  wine: string;
  boat: string;
  box: string;
  island: string;
  robot: string;
  tada: string;
  number: (num: number) => string;
}

const emoji: EmojiMap = {
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
};

export default emoji;
