import type { Client, ColorResolvable, Message } from 'discord.js';
import { ChannelType } from 'discord.js';
import emoji from './emoji';
import {
  addEmote,
  addHelpMessage,
  channelByName,
  clearChannel,
  createChannel,
  createRole,
  deleteChannel,
  deleteEmote,
  findChannel,
  findRole,
  getDiscordUser,
  getGuild,
  inviteUser,
  listChannelTopics,
  managerChannel,
  mentionOk,
  nsfwChannel,
  renameChannel,
  reply,
  resetUserPerm,
  setChannelTopic,
  uninviteUser,
} from './helper';
import log from './logger';

export const init = (discord: Client): void => {
  // Clear channels on an interval
  const clearManagerChannel = async (): Promise<void> => {
    log.debug('Clearing manager channel');
    const channel = await managerChannel(discord);
    const fetched = await channel.messages.fetch({ limit: 100 });
    if (fetched && fetched.size >= 2) {
      channel.send(`${emoji.robot} Clearing all messages...`);
      setTimeout(async () => {
        await clearChannel(channel);
        await addHelpMessage(channel);
      }, 3000);
    }
  };
  setInterval(clearManagerChannel, 120000);
  clearManagerChannel(); // Do it once on startup

  // Welcome message
  discord.on('guildMemberAdd', async (member) => {
    const channel = await channelByName(discord, 'central');
    if (channel) {
      channel.send(`${member} has sailed ashore! Welcome ${emoji.boat}!`);
    }
  });

  // Goodbye message
  discord.on('guildMemberRemove', async (member) => {
    const channel = await channelByName(discord, 'central');
    if (channel) {
      channel.send(
        `${member.user.username} has been voted off the island! Farewell ${emoji.boat}!`,
      );
    }
    await deleteChannel(discord, member.user);
  });

  // Commands
  discord.on('messageCreate', async (msg: Message) => {
    const user = msg.author;
    const content = msg.content;
    const mention = msg.mentions.users.first();

    const dUser = await getDiscordUser(discord);
    if (user.id === dUser.id) {
      // Ignore myself
      return;
    }

    const channel = await managerChannel(discord);
    if (msg.channel.id !== channel.id) {
      // Ignore incorrect channel
      return;
    }

    if (!mentionOk(discord, msg, mention)) {
      await reply(msg, `${emoji.think} You can't do that...`);
      return;
    }

    // Emote logic
    let match = content.match(/^emote (.*) (.*)/i);
    if (match) {
      if (match.length < 3) {
        log.debug(`${user.username} adding emoji "${content}" is invalid`);
        await reply(
          msg,
          'To add an emoji, supply a link to the image and a name.\ne.g. `emoji https://i.imgur.com/MqYAZT9.png bunny`',
        );
        return;
      }
      if (match[1] === 'delete' || match[1] === 'remove') {
        // Delete an emote
        await deleteEmote(discord, match[2]);
        await reply(msg, `Deleted emote ${match[2]}`);
        return;
      }
      // Add an emoji
      log.debug(`${user.username} adding emote ${match[2]}`);
      try {
        const emote = await addEmote(discord, match[1], match[2]);
        await reply(msg, `Added emote ${emote}`);
      } catch (err: unknown) {
        log.error(err);
        await reply(msg, 'Unable to add emoji...');
        if (
          err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof err.message === 'string' &&
          /image: /.test(err.message)
        ) {
          await reply(msg, err.message.split('image: ')[1]);
        } else {
          await reply(
            msg,
            'To add an emoji, supply a link to the image and a name.\ne.g. `emoji https://i.imgur.com/MqYAZT9.png bunny`',
          );
        }
      }
      return;
    }

    // Color logic
    match = content.match(/^colou?r .*/i);
    if (match) {
      const colorMatch = content.match(/([0-9a-fA-F]{6})/);
      if (!colorMatch || colorMatch.length < 2) {
        log.debug(`${user.username} colour "${content}" is invalid`);
        await reply(msg, 'Please use a valid hex code for your colour role.\ne.g. `colour ABC123`');
        return;
      }
      const colour = ('#' + colorMatch[1]) as ColorResolvable & string;
      log.debug(`Giving ${user.username} colour ${colour}`);
      await reply(msg, `Giving ${user.username} colour \`${colour}\``);
      // First remove colour role from user
      const guild = await getGuild(discord);
      const member = guild.members.cache.get(user.id);
      if (!member) {
        await reply(msg, `Unable to find member ${user.username}`);
        return;
      }
      const oldRole = member.roles.cache.find((role) => role.name.startsWith('#'));
      if (oldRole) {
        log.debug(`Removing ${oldRole.name} role from ${user.username}`);
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
    }

    // Help logic
    if (content.match(/^help/i)) {
      log.debug('Showing help');
      await addHelpMessage(channel);
      return;
    }

    // Move in logic
    if (content.match(/^move in/i)) {
      log.debug(`${user.username} moving in`);
      await reply(msg, `Moving in ${user} ${emoji.box}\nI hope you enjoy your stay`);
      await createChannel(discord, user);
      return;
    }

    // Move out logic
    match = content.match(/^move out/i);
    if (match) {
      log.debug(`${user.username} moving in`);
      await reply(msg, `Moving out ${user} ${emoji.wave}\nSee you later`);
      await deleteChannel(discord, user);
      return;
    }

    // Reset logic
    match = content.match(/^reset/i);
    if (match) {
      log.debug(`${user.username} moving in`);
      await reply(msg, `Resetting ${user}'s island ${emoji.island}\n`);
      await resetUserPerm(discord, user);
      return;
    }

    // Rename logic
    match = content.match(/^rename (.*)/i);
    if (match) {
      if (match.length < 2) {
        log.debug(`${user.username} renaming "${content}" is invalid`);
        await reply(msg, 'Please enter a new name for your island.\ne.g. `rename Coolest Island`');
        return;
      }
      // Rename a user channel
      const name = match[1];
      const channel = await channelByName(discord, name);
      if (channel) {
        log.warn(`${user.username} attempting to rename to ${name}`);
        await reply(msg, `Channel name ${name} is already in use`);
        return;
      }
      log.debug(`${user.username} renaming to ${name}`);
      await reply(msg, `Renaming ${user}'s island to ${name}`);
      renameChannel(discord, user, name);
      return;
    }

    // Descriptions logic
    match = content.match(/^descriptions$/i);
    if (match) {
      const descriptions = await listChannelTopics(discord);
      await reply(msg, descriptions);
      return;
    }

    // Description logic
    match = content.match(/^description (.*)/i);
    if (match) {
      if (match.length < 2) {
        await reply(
          msg,
          'Please enter a new description for your island.\ne.g. `description A place to hang`',
        );
        return;
      }
      // Rename a user channel description
      const desc = match[1];
      log.debug(`${user.username} updating description to ${desc}`);
      await reply(msg, `Updating ${user}'s island description to "${desc}"`);
      await setChannelTopic(discord, user, desc);
      return;
    }

    // Invite logic
    match = content.match(/^invite (.*)/i);
    if (match && mention) {
      // Invite a user to your island
      log.debug(`${user.username} inviting ${mention.username}`);
      await reply(msg, `Inviting ${mention} to your island`);
      const chan = await findChannel(discord, user);
      if (chan && chan.type === ChannelType.GuildText) {
        await inviteUser(chan, mention);
        chan.send(`${emoji.wave} ${mention}! Welcome to ${chan.name}`);
      }
      return;
    }

    // Boot logic
    match = content.match(/^boot (.*)/i);
    if (match && mention) {
      // Remove a user from your island
      log.debug(`${user.username} removing ${mention.username}`);
      await reply(msg, `Booting ${mention} from your island`);
      const chan = await findChannel(discord, user);
      if (chan && chan.type === ChannelType.GuildText) {
        await uninviteUser(chan, mention);
        await chan.send(`${mention.username} has left ${chan.name} ${emoji.boat}`);
      }
      return;
    }

    // NSFW logic
    match = content.match(/^n?sfw/i);
    if (match) {
      // Make your island NSFW / SFW
      const nsfw = match[0].toLowerCase().startsWith('n');
      log.debug(`${user.username} ${nsfw ? 'nsfw' : 'sfw'}`);
      await reply(msg, `Making your island ${nsfw ? 'NSFW' : 'SFW'}`);
      await nsfwChannel(discord, user, nsfw);
      return;
    }
  });
};
