import type { Client, Message } from 'discord.js';

export interface Command {
  name: string;
  execute: (discord: Client<true>, msg: Message) => Promise<void>;
  pattern: RegExp;
}

export interface UserData {
  channelId?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface BotData {
  [userId: string]: UserData;
}
