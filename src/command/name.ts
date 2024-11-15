import type { Client, Message } from 'discord.js';
import { channelByName, renameChannel, reply } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const renameCommand: Command = {
  name: 'rename',
  pattern: /^rename/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const match = content.match(/^rename (.*)/i);
    if (!match || match.length < 2) {
      log.debug(`${author.username} renaming "${content}" is invalid`);
      await reply(msg, 'Please enter a new name for your island.\ne.g. `rename Coolest Island`');
      return;
    }
    // Rename a user channel
    const name = match[1];
    const channel = await channelByName(discord, name);
    if (channel) {
      log.warn(`${author.username} attempting to rename to ${name}`);
      await reply(msg, `Channel name ${name} is already in use`);
      return;
    }
    log.debug(`${author.username} renaming to ${name}`);
    await reply(msg, `Renaming ${author}'s island to ${name}`);
    renameChannel(discord, author, name);
    return;
  },
};
