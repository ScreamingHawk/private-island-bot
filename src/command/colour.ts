import type { Client, ColorResolvable, Message } from 'discord.js';
import { createRole, findRole, getGuild, reply } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const colourCommand: Command = {
  name: 'colour',
  pattern: /^colou?r/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const pattern = /^colou?r (.*)/i;
    const match = content.match(pattern);
    if (!match || match.length < 2) {
      log.debug(`${author.username} colour "${content}" is invalid`);
      await reply(msg, 'Please use a valid hex code for your colour role.\ne.g. `colour ABC123`');
      return;
    }

    const colorMatch = match[1].match(/([0-9a-fA-F]{6})/);
    if (!colorMatch || colorMatch.length < 2) {
      log.debug(`${author.username} colour "${content}" is invalid`);
      await reply(msg, 'Please use a valid hex code for your colour role.\ne.g. `colour ABC123`');
      return;
    }
    const colour = ('#' + colorMatch[1]) as ColorResolvable & string;
    log.debug(`Giving ${author.username} colour ${colour}`);
    await reply(msg, `Giving ${author.username} colour \`${colour}\``);
    // First remove colour role from user
    const guild = await getGuild(discord);
    const member = guild.members.cache.get(author.id);
    if (!member) {
      await reply(msg, `Unable to find member ${author.username}`);
      return;
    }
    const oldRole = member.roles.cache.find((role) => role.name.startsWith('#'));
    if (oldRole) {
      log.debug(`Removing ${oldRole.name} role from ${author.username}`);
      await member.roles.remove(oldRole).catch(log.error);
    }
    // Add new role
    const role = await findRole(discord, colour);
    if (role) {
      member.roles.add(role).catch(log.error);
    } else {
      await createRole(discord, colour as ColorResolvable, member);
    }
    return;
  },
};
