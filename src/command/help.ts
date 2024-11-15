import type { Client, Message } from 'discord.js';
import { replyHelpMessage } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const helpCommand: Command = {
  name: 'help',
  pattern: /^help/i,
  async execute(_: Client, msg: Message) {
    log.debug('Showing help');
    await replyHelpMessage(msg);
    return;
  },
};
