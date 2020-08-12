const log = require('./src/logger')

// Initialise env
require('dotenv').config()

if (!process.env.DISCORD_TOKEN){
	for (let i = 5; i-- > 0;){
		console.error('MISSING CONFIG!!!')
	}
	process.exit(1)
}

const discordjs = require('discord.js')
const discord = new discordjs.Client()

// Login
discord.login(process.env.DISCORD_TOKEN).then(() => {
	log.info(`${discord.user.username} operational`)
	// Fun status
	if (Math.random() > 0.5){
		discord.user.setActivity('with sand', { type: 'PLAYING' })
	} else {
		discord.user.setActivity('boats sail by', { type: 'WATCHING' })
	}

	// Start the app
	require('./src/datastore').loadData(discord)
	require('./src/server').init(discord)
}).catch(err => {
	log.error("Unable to login to discord")
	log.error(err)
	process.exit(1)
})