import type { Client, Message } from 'discord.js';
import { nsfwChannel, reply } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const nsfwCommand: Command = {
  name: 'nsfw',
  pattern: /^n?sfw/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const match = content.match(/^n?sfw/i);
    if (!match) {
      throw new Error('Invalid command');
    }
    // Make your island NSFW / SFW
    const nsfw = match[0].toLowerCase().startsWith('n');
    log.debug(`${author.username} ${nsfw ? 'nsfw' : 'sfw'}`);
    await reply(msg, `Making your island ${nsfw ? 'NSFW' : 'SFW'}`);
    await nsfwChannel(discord, author, nsfw);
    return;
  },
};
