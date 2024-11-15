import type { Client, Message } from 'discord.js';
import { commands } from './command';
import emoji from './emoji';
import {
  addHelpMessage,
  channelByName,
  clearChannel,
  deleteChannel,
  managerChannel,
  mentionOk,
  reply,
} from './helper';
import log from './logger';

export const init = (discord: Client<true>): void => {
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

    if (user.id === discord.user.id) {
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

    for (const command of commands) {
      const match = content.match(command.pattern);
      if (match) {
        return await command.execute(discord, msg);
      }
    }

    // No command found. Ignore.
  });
};
