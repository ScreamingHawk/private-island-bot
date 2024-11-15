import type { Client, Message } from 'discord.js';
import { addEmote, deleteEmote, reply } from '../helper';
import log from '../logger';
import type { Command } from '../types';

export const emoteCommand: Command = {
  name: 'emote',
  pattern: /^emote/i,
  async execute(discord: Client<true>, msg: Message) {
    const { author, content } = msg;

    const pattern = /^emote (.*) (.*)/i;
    const match = content.match(pattern);

    if (!match || match.length < 3) {
      log.debug(`${author.username} adding emoji "${content}" is invalid`);
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
    log.debug(`${author.username} adding emote ${match[2]}`);
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
  },
};
