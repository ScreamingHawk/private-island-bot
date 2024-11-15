export interface UserData {
  channelId?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface BotData {
  [userId: string]: UserData;
}
