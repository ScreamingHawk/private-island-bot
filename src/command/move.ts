import type { Client, Message } from 'discord.js';
import emoji from '../emoji';
import { createChannel, deleteChannel, reply, resetUserPerm } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const moveInCommand: Command = {
  name: 'move in',
  pattern: /^move in/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author } = msg;

    log.debug(`${author.username} moving in`);
    await reply(msg, `Moving in ${author} ${emoji.box}\nI hope you enjoy your stay`);
    await createChannel(discord, author);
    return;
  },
};

export const moveOutCommand: Command = {
  name: 'move out',
  pattern: /^move out/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author } = msg;

    log.debug(`${author.username} moving out`);
    await reply(msg, `Moving out ${author} ${emoji.wave}\nSee you later`);
    await deleteChannel(discord, author);
    return;
  },
};

export const resetCommand: Command = {
  name: 'reset',
  pattern: /^reset/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author } = msg;

    log.debug(`${author.username} resetting`);
    await reply(msg, `Resetting ${author}'s island ${emoji.island}\n`);
    await resetUserPerm(discord, author);
  },
};
