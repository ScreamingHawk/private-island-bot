// Initialise env
require('dotenv').config()

if (!process.env.DISCORD_TOKEN){
	for (let i = 5; i-- > 0;){
		console.error('MISSING CONFIG!!!')
	}
	process.exit(1)
}

// Start the app
require('./src/server')