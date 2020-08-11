const log = require('./logger')
const emoji = require('./emoji')
require('./helper')

const discordjs = require('discord.js')
const { inviteUser } = require('./helper')
const discord = new discordjs.Client()

// Login
discord.login(process.env.DISCORD_TOKEN).then(() => {
	log.info(`${discord.user.username} operational`)
}).catch(err => {
	log.error("Unable to login to discord")
	log.error(err)
	process.exit(1)
})

const states = {}

// Begin conversation
discord.on('message', msg => {
	if (msg.author.id === discord.user.id){
		// Ignore myself
		return
	}
	if (msg.mentions.users.first() === discord.user){
		// Initialise
		log.debug(`${msg.author.username} convo started`)
		states[msg.author.id] = {
			step: 'hello',
		}
		reply(msg, `Hello ${msg.author} ${emoji.wave}\nHow may I help?`)
		return
	}
	if (states[msg.author.id]){
		// User is in a conversation
		const content = msg.content

		if (content.match(/(bye)|(thank)/i)){
			// End conversation
			log.debug(`${msg.author.username} convo ended`)
			states[msg.author.id] = undefined
			reply(msg, `Bye! ${emoji.wave}`)
		}

		if (content.match(/^move in/i)){
			// Move in a user
			const user = msg.author.username
			log.debug(`${user} moving in`)
			reply(msg, `Moving in ${user} ${emoji.box}\nPlease hold...`)
			createChannel(discord, user)
			return
		}

		if (content.match(/^invite (.*)/i) && msg.mentions.users.size > 0){
			// Invite a user to your island
			const mention = msg.mentions.users.first()
			log.debug(`${msg.author.username} inviting ${mention.username}`)
			reply(msg, `Inviting ${mention} to your island`)
			inviteUser(discord, msg.author, mention)
			return
		}

		if (content.match(/^boot (.*)/i) && msg.mentions.users.size > 0){
			// Remove a user from your island
			const mention = msg.mentions.users.first()
			log.debug(`${msg.author.username} removing ${mention.username}`)
			reply(msg, `Booting ${mention} from your island`)
			uninviteUser(discord, msg.author, mention)
			return
		}
	}
})