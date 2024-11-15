import type { Client, Message } from 'discord.js';
import { ChannelType } from 'discord.js';
import { addHelpMessage } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const helpCommand: Command = {
  name: 'help',
  pattern: /^help/i,
  async execute(_: Client, msg: Message) {
    if (msg.channel.type !== ChannelType.GuildText) {
      return;
    }
    log.debug('Showing help');
    await addHelpMessage(msg.channel);
    return;
  },
};
