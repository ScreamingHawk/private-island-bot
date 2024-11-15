import { EmbedBuilder, type Client, type Message } from 'discord.js';
import { listChannelTopics, reply, setChannelTopic } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const descriptionCommand: Command = {
  name: 'description',
  pattern: /^description(?!s)/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const match = content.match(/^description (.*)/i);
    if (!match || match.length < 2) {
      log.debug(`${author.username} description "${content}" is invalid`);
      await reply(
        msg,
        'Please enter a new description for your island.\ne.g. `description A place to hang`',
      );
      return;
    }

    // Rename a user channel description
    const desc = match[1];
    log.debug(`${author.username} updating description to ${desc}`);
    await reply(msg, `Updating ${author}'s island description to "${desc}"`);
    await setChannelTopic(discord, author, desc);
    return;
  },
};

export const descriptionsCommand: Command = {
  name: 'descriptions',
  pattern: /^descriptions/i,
  async execute(discord: Client<true>, msg: Message) {
    const descriptions = await listChannelTopics(discord);
    const embed = new EmbedBuilder()
      .setTitle('Private Islands')
      .setDescription('All the islands of the archipelago')
      .addFields(
        descriptions.map((desc) => ({
          name: desc.channel.name,
          value: `${desc.topic}\nOwner: ${desc.owner?.username ?? 'Unknown'}`,
        })),
      );
    await msg.reply({ embeds: [embed] });
  },
};
