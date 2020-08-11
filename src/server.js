const log = require('./logger')
const emoji = require('./emoji')
require('./helper')

const discordjs = require('discord.js')
const { inviteUser, reply } = require('./helper')
const discord = new discordjs.Client()

// Login
discord.login(process.env.DISCORD_TOKEN).then(() => {
	log.info(`${discord.user.username} operational`)
}).catch(err => {
	log.error("Unable to login to discord")
	log.error(err)
	process.exit(1)
})

// Begin conversation
discord.on('message', msg => {
	if (msg.author.id === discord.user.id || msg.channel !== managerChannel(discord)){
		// Ignore myself and incorrect channel
		return
	}
	if (msg.mentions.users.first() === discord.user){
		// Say hi
		reply(msg, `Hello ${msg.author} ${emoji.wave}\nHow may I help?`)
		return
	}

	const content = msg.content

	if (content.match(/^help/i)){
		// Display help info
		log.debug("Showing help")
		reply(msg, 
			"`move in` to set up your private island on the server\n" +
			"`invite <tag_user>` to give a user access to your private island\n" +
			"`boot <tag_user>` to remove a user from your private island"
		)
		return
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
})