import type { Client } from 'discord.js';
import emoji from './emoji';
import { channelByName } from './helper';

const ANNOUNCEMENT: string = `${emoji.island} **Private Islands Is Back!** ${emoji.island}

After a long, restful retirement, the Manager has returned to the islands, ready to bring everything back to its former glory! ${emoji.drink}${emoji.tree}

With the Manager back in action, all services are returning to normal. Reclaim your favourite spots, restore your custom settings, and pick up right where you left off - it's all yours once again! Whether you're relaxing on your private beach or chilling at the bar, you'll find everything right where it belongs.

Raise a toast, settle into your hammock, and enjoy the revived island life. ${emoji.coconut}`;

export const sendAnnouncement = async (discord: Client<true>): Promise<void> => {
  const chan = await channelByName(discord, 'notice-board');
  if (chan) {
    // Delete last announcement
    const messages = await chan.messages.fetch();
    if (messages.size > 0) {
      await messages.last()?.delete();
      await chan.send(ANNOUNCEMENT);
    }
  }
};

export const deleteAnnouncement = async (discord: Client<true>): Promise<void> => {
  const chan = await channelByName(discord, 'notice-board');
  if (chan) {
    await chan.messages.delete('1306869759865786428');
  }
};
