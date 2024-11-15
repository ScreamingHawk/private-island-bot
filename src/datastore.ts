import { ChannelType, User, type Client, type TextChannel } from 'discord.js';
import { getGuild } from './helper';
import log from './logger';
import type { BotData, UserData } from './types';

let data: BotData = {};

const getDataChannel = async (discord: Client<true>): Promise<TextChannel> => {
  const guild = await getGuild(discord);
  let chan = guild.channels.cache.find((c) => c.name === 'data');
  if (!chan) {
    chan = await guild.channels.create({
      name: 'data',
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: discord.user.id,
          allow: ['ViewChannel', 'ManageMessages'],
        },
        {
          // @everyone
          id: guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
      reason: 'Data storage channel',
    });
  }
  if (chan.type !== ChannelType.GuildText) {
    throw new Error('Data channel is not a text channel');
  }
  return chan;
};

export const saveData = async (discord: Client<true>): Promise<void> => {
  const chan = await getDataChannel(discord);
  if (chan && chan.send) {
    chan.send(JSON.stringify(data));
  }
};

export const loadData = async (discord: Client<true>): Promise<void> => {
  log.debug('Loading data');
  const chan = await getDataChannel(discord);
  await chan.messages.fetch();
  const msg = chan.messages.cache.first();
  if (!msg) {
    throw new Error('No message found');
  }
  data = JSON.parse(msg.content);
  log.debug(`Loaded data: ${JSON.stringify(data)}`);
};

export const getUserData = (user: User): UserData => {
  if (!(user.id in data)) {
    data[user.id] = {};
  }
  return data[user.id];
};
