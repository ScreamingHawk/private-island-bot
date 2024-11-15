import type { Client, Message } from 'discord.js';
import emoji from '../emoji';
import { findChannel, inviteUser, reply, uninviteUser } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const inviteCommand: Command = {
  name: 'invite',
  pattern: /^invite/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const match = content.match(/^invite (.*)/i);
    const mention = msg.mentions.users.first();
    if (!match || !mention) {
      log.debug(`${author.username} invite "${content}" is invalid`);
      await reply(msg, 'Please enter a user to invite.\ne.g. `invite @user`');
      return;
    }

    // Invite a user to your island
    log.debug(`${author.username} inviting ${mention.username}`);
    await reply(msg, `Inviting ${mention} to your island`);
    const chan = await findChannel(discord, author);
    if (!chan) {
      log.debug(`${author.username} no channel found`);
      await reply(msg, `No channel found for ${author}. Move in first.`);
      return;
    }

    await inviteUser(chan, mention);
    await chan.send(`${emoji.wave} ${mention}! Welcome to ${chan.name}`);
    return;
  },
};

export const bootCommand: Command = {
  name: 'boot',
  pattern: /^boot/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const match = content.match(/^invite (.*)/i);
    const mention = msg.mentions.users.first();
    if (!match || !mention) {
      log.debug(`${author.username} boot "${content}" is invalid`);
      await reply(msg, 'Please enter a user to boot.\ne.g. `boot @user`');
      return;
    }

    // Remove a user from your island
    log.debug(`${author.username} removing ${mention.username}`);
    await reply(msg, `Booting ${mention} from your island`);
    const chan = await findChannel(discord, author);
    if (!chan) {
      log.debug(`${author.username} no channel found`);
      await reply(msg, `No channel found for ${author}. Move in first.`);
      return;
    }
    await uninviteUser(chan, mention);
    await chan.send(`${mention.username} has left ${chan.name} ${emoji.boat}`);
    return;
  },
};
