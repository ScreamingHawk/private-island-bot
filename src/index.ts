import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { config as dotenvConfig } from 'dotenv';
import { loadData } from './datastore';
import log from './logger';
import { init } from './server';

// Initialise env
dotenvConfig();

if (!process.env.DISCORD_TOKEN) {
  for (let i = 5; i-- > 0; ) {
    console.error('MISSING CONFIG!!!');
  }
  process.exit(1);
}

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Login
discord
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    if (discord.user) {
      log.info(`${discord.user.username} operational`);
      // Fun status
      if (Math.random() > 0.5) {
        discord.user.setActivity({
          name: 'with sand',
          type: ActivityType.Playing,
        });
      } else {
        discord.user.setActivity({
          name: 'boats sail by',
          type: ActivityType.Watching,
        });
      }
    }

    // Start the app
    loadData(discord);
    init(discord);
  })
  .catch((err) => {
    log.error('Unable to login to discord');
    log.error(err);
    process.exit(1);
  });
