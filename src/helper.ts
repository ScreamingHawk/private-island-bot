import {
  CategoryChannel,
  ChannelType,
  Client,
  Collection,
  Guild,
  GuildEmoji,
  GuildMember,
  Role,
  TextChannel,
  User,
  type ColorResolvable,
  type GuildBasedChannel,
  type GuildChannelCreateOptions,
  type Message,
  type Snowflake,
} from 'discord.js';
import { getChannelUserId, getUserData, saveData } from './datastore';
import emoji from './emoji';
import log from './logger';

// Reply to a message in a channel
export const reply = async (msg: Message, content: string): Promise<void> => {
  await msg.reply(content);
};

// Check mention is ok
export const mentionOk = (
  discord: Client<true>,
  msg: Message,
  mention: User | undefined,
): boolean => {
  if (!msg.content.match(/(invite|boot)/i)) {
    return true;
  }
  return mention !== discord.user && mention !== msg.author;
};

let guildCachePopulated = false;

// Get the guild
export const getGuild = async (discord: Client<true>): Promise<Guild> => {
  const guild = discord.guilds.cache.first();
  if (!guild) {
    throw new Error('No guild found');
  }
  if (!guildCachePopulated) {
    await guild.roles.fetch();
    await guild.channels.fetch();
    guildCachePopulated = true;
  }
  return guild;
};

// Find a channel by name
export const channelByName = async (
  discord: Client<true>,
  name: string,
): Promise<TextChannel | null> => {
  const guild = await getGuild(discord);
  const chan = guild.channels.cache.find((c) => c.name === name);
  if (chan && chan.type === ChannelType.GuildText) {
    return chan;
  }
  return null;
};

// Get manager channel
export const managerChannel = async (discord: Client<true>): Promise<TextChannel> => {
  const chan = await channelByName(discord, 'manager');
  if (chan && chan.type === ChannelType.GuildText) {
    return chan;
  }
  throw new Error('Manager channel not found');
};

// Helper to batch delete messages, handling old messages individually
const batchDelete = async (
  channel: TextChannel,
  messages: Collection<Snowflake, Message<true>>,
): Promise<void> => {
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  // Filter into recent and old messages
  const [recentMessages, oldMessages] = messages.partition(
    (msg) => msg.createdTimestamp > twoWeeksAgo,
  );

  // Bulk delete recent messages
  if (recentMessages.size > 0) {
    await channel.bulkDelete(recentMessages);
  }

  // Delete old messages one by one
  for (const message of oldMessages.values()) {
    await message.delete();
  }
};

// Clear a channel
export const clearChannel = async (channel: TextChannel): Promise<void> => {
  let fetched: Collection<Snowflake, Message<true>>;
  do {
    fetched = await channel.messages.fetch({ limit: 100 });
    if (fetched) {
      fetched = fetched.filter((m) => !m.pinned);
      if (fetched instanceof Collection) {
        await batchDelete(channel, fetched);
      }
    }
  } while (fetched && fetched.size >= 2);
};

// Add a welcome message to the notice-board
export const addWelcomeMessage = async (discord: Client<true>): Promise<void> => {
  const chan = await channelByName(discord, 'notice-board');
  if (chan && chan.type === ChannelType.GuildText) {
    const guild = await getGuild(discord);
    const owner = await discord.users.fetch(guild.ownerId);
    const managerChannel = await channelByName(discord, 'manager');
    chan
      .send(
        emoji.island +
          'Welcome to Private Islands!' +
          emoji.island +
          '\n' +
          '\nThis server offers a self managed safe space for everyone. ' +
          `\nChat in ${channelByName(discord, 'central')} to meet new people. ` +
          `\nHit up the ${managerChannel} to invite people to your private island. ` +
          '\n' +
          "\nEveryone's private island is complety self managed. " +
          `\nThe sever owner ${owner.tag} is an unused account. ` +
          '\nNo one will view your island without your express consent. ' +
          '\n' +
          `\nIf you like what you see then head on over to ${managerChannel} and request a \`move in\`! ` +
          '\n' +
          '\nGrab a martini at the bar, sit back and relax. ' +
          '\n' +
          emoji.drink +
          emoji.martini +
          emoji.wine,
      )
      .catch(log.error);
  }
};

const helpMessage = `${emoji.island}**Island Management**${emoji.island}
\`\`\`
move in/out - to set up your private island on the server
rename new_name - rename your private island
description topic_here - set the description of your island
descriptions - list all island descriptions
invite @user - to give a user access to your private island
boot @user - to remove a user from your private island
nsfw/sfw - to make your island NSFW or SFW
colour/color ###### - give yourself a colour role
emote link name - Add an emote to the server
reset - to burn down your private island and build it up again
\`\`\`
Messages here are cleared every couple of minutes.
You should probably mute this channel...`;

// Add a help message to channel
export const addHelpMessage = async (channel: TextChannel): Promise<void> => {
  await channel.send(helpMessage);
};

// Reply with a help message
export const replyHelpMessage = async (msg: Message): Promise<void> => {
  await reply(msg, helpMessage);
};

// Find role
export const findRole = async (discord: Client<true>, name: string): Promise<Role | null> => {
  const guild = await getGuild(discord);
  return guild.roles.cache.find((r) => r.name === name) || null;
};

// Create role
export const createRole = async (
  discord: Client<true>,
  colour: ColorResolvable,
  member: GuildMember,
): Promise<Role | null> => {
  let role = await findRole(discord, colour.toString());
  if (!role) {
    const guild = await getGuild(discord);
    role = await guild.roles.create({
      name: colour.toString(),
      color: colour,
      mentionable: false,
      hoist: false,
      reason: `${colour} role added for ${member.user.username}`,
    });
  }
  await member.roles.add(role);
  return role;
};

// Find island group
export const getIslandGroup = async (discord: Client<true>): Promise<CategoryChannel | null> => {
  const guild = await getGuild(discord);
  const group = guild.channels.cache.find((c) => c.name === 'islands');
  if (group && group.type === ChannelType.GuildCategory) {
    return group;
  }
  return null;
};

// Find the owner of a channel
export const getChannelOwner = async (
  discord: Client<true>,
  chan: TextChannel,
): Promise<User | null> => {
  const id = getChannelUserId(chan);
  if (id) {
    const user = discord.users.cache.get(id) ?? null;
    if (user) {
      return user;
    }
    return discord.users.fetch(id).catch(() => null);
  }
  return null;
};

// Find the channel for the user
export const findChannel = async (
  discord: Client<true>,
  user: User,
): Promise<TextChannel | null> => {
  const guild = await getGuild(discord);
  const data = getUserData(user);
  let chan: GuildBasedChannel | undefined;
  if (data.channelId) {
    chan = guild.channels.cache.get(data.channelId);
    if (chan && chan.type === ChannelType.GuildText) {
      return chan;
    }
  }
  // Fail over to username look up
  const uname = user.username.toLowerCase();
  chan = guild.channels.cache.find((c) => c.name.startsWith(`${uname}s-`));
  if (chan && chan.type === ChannelType.GuildText) {
    // Update store
    data.channelId = chan.id;
    saveData(discord);
    return chan;
  }
  return null;
};

// Create a channel for a user
export const createChannel = async (discord: Client<true>, user: User): Promise<TextChannel> => {
  let chan = await findChannel(discord, user);
  if (!chan) {
    log.debug(`Creating channel for ${user.username}`);
    const uname = user.username.toLowerCase();

    const guild = await getGuild(discord);
    const islandGroup = await getIslandGroup(discord);
    const createOpts: GuildChannelCreateOptions = {
      name: `${uname}s-island`,
      parent: islandGroup?.id,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: discord.user.id,
          allow: ['ViewChannel', 'ManageMessages'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'ManageMessages'],
        },
        {
          id: guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ],
      reason: `Creating channel for ${user.username}`,
    };
    chan = await guild.channels.create(createOpts);
    chan.send(`${emoji.island} Welcome to ${user.username}'s island! ${emoji.island}`);
    // Persist channel data
    getUserData(user).channelId = chan.id;
    await saveData(discord);
  }
  return chan;
};

// Delete a channel for a user
export const deleteChannel = async (
  discord: Client<true>,
  user: User,
  callback?: () => void,
): Promise<void> => {
  const chan = await findChannel(discord, user);
  if (chan) {
    log.debug(`Deleting channel for ${user.username}`);
    await chan.delete();
  }
  if (callback) {
    callback();
  }
};

// Rename a channel for a user
export const renameChannel = async (
  discord: Client<true>,
  user: User,
  name: string,
): Promise<void> => {
  const chan = await findChannel(discord, user);
  if (chan) {
    log.debug(`Renaming channel for ${user.username} to ${name}`);
    await chan.setName(name);
  }
};

// Update a channel topic for a user
export const setChannelTopic = async (
  discord: Client<true>,
  user: User,
  desc: string,
): Promise<void> => {
  const chan = await findChannel(discord, user);
  if (chan) {
    log.debug(`Setting topic for ${user.username} to ${desc}`);
    await chan.setTopic(desc);
  }
};

// Get all topics
type ChannelTopic = {
  channel: TextChannel;
  owner: User;
  topic: string;
};

export const listChannelTopics = async (discord: Client<true>): Promise<ChannelTopic[]> => {
  const guild = await getGuild(discord);
  const channels = guild.channels.cache
    .filter((c) => c.type === ChannelType.GuildText)
    .filter((c) => c.topic !== null);

  const topics = await Promise.all(
    channels.map(async (c) => ({
      channel: c,
      owner: await getChannelOwner(discord, c),
      topic: c.topic,
    })),
  );

  return topics.filter((c) => c.topic !== null && c.owner !== null) as ChannelTopic[];
};

// Reset channel perms on a user channel
export const resetUserPerm = async (discord: Client<true>, user: User): Promise<void> => {
  const guild = await getGuild(discord);
  const chan = await findChannel(discord, user);
  if (chan && chan.type === ChannelType.GuildText) {
    chan.permissionOverwrites
      .set([
        {
          id: discord.user.id,
          allow: ['ViewChannel', 'ManageMessages'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'ManageMessages'],
        },
        {
          id: guild.roles.everyone.id,
          deny: ['ViewChannel'],
        },
      ])
      .catch(log.error);
  }
};

// Update channel perms on a channel for a user
export const updateUserPerm = async (
  chan: TextChannel,
  user: User,
  allow: boolean,
): Promise<void> => {
  if (chan) {
    await chan.permissionOverwrites
      .edit(user.id, {
        ViewChannel: allow,
      })
      .catch(log.error);
  }
};

// Add user to a user channel
export const inviteUser = async (channel: TextChannel, user: User): Promise<void> =>
  await updateUserPerm(channel, user, true);

// Remove a user from a user channel
export const uninviteUser = async (channel: TextChannel, user: User): Promise<void> =>
  await updateUserPerm(channel, user, false);

// Make channel NSFW
export const nsfwChannel = async (
  discord: Client<true>,
  user: User,
  nsfw: boolean,
): Promise<void> => {
  const chan = await findChannel(discord, user);
  if (chan && chan.type === ChannelType.GuildText) {
    chan.setNSFW(nsfw).catch(log.error);
  }
};

// Add emote
export const addEmote = async (
  discord: Client<true>,
  link: string,
  name: string,
): Promise<GuildEmoji> => {
  const guild = await getGuild(discord);
  return guild.emojis.create({
    attachment: link,
    name,
  });
};

// Delete emote
export const deleteEmote = async (discord: Client<true>, name: string): Promise<GuildEmoji> => {
  const guild = await getGuild(discord);
  const e = guild.emojis.cache.find((e) => e.name === name);
  if (e) {
    return e.delete();
  }
  return Promise.reject('Emote not found');
};
