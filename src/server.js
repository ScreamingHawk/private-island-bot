const log = require('./logger')
const emoji = require('./emoji')
require('./helper')

module.exports.init = discord => {
	// Commands
	discord.on('message', msg => {
		const user = msg.author
		const content = msg.content
		const mention = msg.mentions.users.first()

		if (user.id === discord.user.id || msg.channel !== managerChannel(discord)){
			// Ignore myself and incorrect channel
			return
		}

		if (!mentionOk(discord, msg, mention)){
			reply(msg, `${emoji.think} You can't do that...`)
			return
		}

		if (content.match(/^help/i)){
			// Display help info
			log.debug("Showing help")
			reply(msg, 
				"`move in/out` to set up your private island on the server\n" +
				"`invite @user` to give a user access to your private island\n" +
				"`boot @user` to remove a user from your private island\n" +
				"`nsfw/sfw` to make your island NSFW or SFW\n" +
				"`reset` to burn down your private island and build it up again"
			)
			return
		}

		if (content.match(/^move in/i)){
			// Move in a user
			log.debug(`${user.username} moving in`)
			reply(msg, `Moving in ${user} ${emoji.box}\nI hope you enjoy your stay`)
			createChannel(discord, user)
			return
		}

		if (content.match(/^move out/i)){
			// Move out a user
			log.debug(`${user.username} moving in`)
			reply(msg, `Moving out ${user} ${emoji.wave}\nSee you later`)
			deleteChannel(discord, user)
			return
		}

		if (content.match(/^reset/i)){
			// Reset a user's channel
			log.debug(`${user.username} moving in`)
			reply(msg, `Resetting ${user}'s island ${emoji.island}\n`)
			deleteChannel(discord, user, () => {
				createChannel(discord, user)
			})
			return
		}

		if (content.match(/^invite (.*)/i) && msg.mentions.users.size > 0){
			// Invite a user to your island
			log.debug(`${user.username} inviting ${mention.username}`)
			reply(msg, `Inviting ${mention} to your island`)
			inviteUser(discord, user, mention)
			return
		}

		if (content.match(/^boot (.*)/i) && msg.mentions.users.size > 0){
			// Remove a user from your island
			log.debug(`${user.username} removing ${mention.username}`)
			reply(msg, `Booting ${mention} from your island`)
			uninviteUser(discord, user, mention)
			return
		}

		if (content.match(/^nsfw/i)){
			// Make your island NSFW
			log.debug(`${user.username} nsfw`)
			reply(msg, `Making your island NSFW`)
			nsfwChannel(discord, user, true)
			return
		}

		if (content.match(/^sfw/i)){
			// Make your island SFW
			log.debug(`${user.username} sfw`)
			reply(msg, `Making your island SFW`)
			nsfwChannel(discord, user, false)
			return
		}
	})
}
