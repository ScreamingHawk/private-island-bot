const log = require('./logger')
const emoji = require('./emoji')
require('./helper')

module.exports.init = discord => {
	// Commands
	discord.on('message', msg => {
		if (msg.author.id === discord.user.id || msg.channel !== managerChannel(discord)){
			// Ignore myself and incorrect channel
			return
		}

		const content = msg.content
		const mention = msg.mentions.users.first()

		if (!mentionOk(discord, msg, mention)){
			reply(msg, `${emoji.think} You can't do that...`)
			return
		}

		if (content.match(/^help/i)){
			// Display help info
			log.debug("Showing help")
			reply(msg, 
				"`move in` to set up your private island on the server\n" +
				"`invite <tag_user>` to give a user access to your private island\n" +
				"`boot <tag_user>` to remove a user from your private island\n" +
				"`nsfw` `sfw` to make your island NSFW or SFW"
			)
			return
		}

		if (content.match(/^move in/i)){
			// Move in a user
			const user = msg.author
			log.debug(`${user.username} moving in`)
			reply(msg, `Moving in ${user} ${emoji.box}\nI hope you enjoy your stay`)
			createChannel(discord, user)
			return
		}

		if (content.match(/^move out/i)){
			// Move out a user
			const user = msg.author
			log.debug(`${user.username} moving in`)
			reply(msg, `Moving out ${user} ${emoji.wave}\nSee you later`)
			deleteChannel(discord, user)
			return
		}

		if (content.match(/^invite (.*)/i) && msg.mentions.users.size > 0){
			// Invite a user to your island
			log.debug(`${msg.author.username} inviting ${mention.username}`)
			reply(msg, `Inviting ${mention} to your island`)
			inviteUser(discord, msg.author, mention)
			return
		}

		if (content.match(/^boot (.*)/i) && msg.mentions.users.size > 0){
			// Remove a user from your island
			log.debug(`${msg.author.username} removing ${mention.username}`)
			reply(msg, `Booting ${mention} from your island`)
			uninviteUser(discord, msg.author, mention)
			return
		}

		if (content.match(/^nsfw/i)){
			// Make your island NSFW
			log.debug(`${msg.author.username} nsfw`)
			reply(msg, `Making your island NSFW`)
			nsfwChannel(discord, msg.author, true)
			return
		}

		if (content.match(/^sfw/i)){
			// Make your island SFW
			log.debug(`${msg.author.username} sfw`)
			reply(msg, `Making your island SFW`)
			nsfwChannel(discord, msg.author, false)
			return
		}
	})
}
