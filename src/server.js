const log = require('./logger')
const emoji = require('./emoji')
const { deleteEmote, reply, listChannelTopics } = require('./helper')
require('./helper')

module.exports.init = discord => {
	// Clear channels on an interval
	setInterval(async () => {
		const channel = managerChannel(discord)
		let fetched = await channel.messages.fetch({limit: 100})
			.catch(log.error)
		if (fetched && fetched.size >= 2){
			channel.send(`${emoji.robot} Clearing all messages...`)
			setTimeout(async () => {
				await clearChannel(channel)
			}, 3000)
		}
	}, 120000)

	// Welcome message
	discord.on('guildMemberAdd', member => {
		channelByName(discord, "central").send(`${member} has sailed ashore! Welcome ${emoji.boat}!`)
	})

	// Goodbye message
	discord.on('guildMemberRemove', member => {
		channelByName(discord, "central").send(`${member.user.username} has been voted off the island! Farewell ${emoji.boat}!`)
		deleteChannel(discord, member.user)
	})

	// Commands
	discord.on('message', async msg => {
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

		if (match = content.match(/^emote (.*) (.*)/i)){
			if (match.length < 3){
				log.debug(`${user.username} adding emoji "${content}" is invalid`)
				reply(msg, "To add an emoji, supply a link to the image and a name.\ne.g. `emoji https://i.imgur.com/MqYAZT9.png bunny`")
				return
			}
			if (match[1] === "delete" || match[1] === "remove"){
				// Delete an emote
				deleteEmote(discord, match[2])
					.then(() => {
						reply(msg, `Deleted emote ${match[2]}`)
					})
					.catch(err => {
						log.error(err)
						reply(msg, `Unable to delete emote ${match[2]}`)
					})
				return
			}
			// Add an emoji
			log.debug(`${user.username} adding emote ${match[2]}`)
			addEmote(discord, match[1], match[2])
				.then(emote => {
					reply(msg, `Added emote ${emote}`)
				})
				.catch(err => {
					log.error(err)
					reply(msg, "Unable to add emoji...")
					if (err && err.message && /image: /.test(err.message)){
						reply(msg, err.message.split("image: ")[1])
					} else {
						reply(msg, "To add an emoji, supply a link to the image and a name.\ne.g. `emoji https://i.imgur.com/MqYAZT9.png bunny`")
					}
				})
			return
		}

		if (content.match(/^colou?r .*/i)){
			let match = content.match(/([0-9a-fA-F]{6})/)
			if (!match || match.length < 2){
				log.debug(`${user.username} colour "${content}" is invalid`)
				reply(msg, "Please use a valid hex code for your colour role.\ne.g. `colour ABC123`")
				return
			}
			const colour = "#" + match[1]
			log.debug(`Giving ${user.username} colour ${colour}`)
			reply(msg, `Giving ${user.username} colour \`${colour}\``)
			// First remove colour role from user
			const member = getGuild(discord).member(user)
			const oldRole = member.roles.cache.find(role => role.name.startsWith('#'))
			if (oldRole){
				log.debug(`Removing ${oldRole.name} role from ${user.username}`)
				await member.roles.remove(oldRole)
					.catch(log.error)
			}
			// Add new role
			const role = findRole(discord, colour)
			if (role){
				member.roles.add(role)
					.catch(log.error)
			} else {
				createRole(discord, colour, member)
			}
			return
		}

		if (content.match(/^help/i)){
			// Display help info
			log.debug("Showing help")
			addHelpMessage(msg.channel)
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
			resetUserPerm(discord, user)
			return
		}

		if (match = content.match(/^rename (.*)/i)){
			if (match.length < 2){
				log.debug(`${user.username} renaming "${content}" is invalid`)
				reply(msg, "Please enter a new name for your island.\ne.g. `rename Coolest Island`")
				return
			}
			// Rename a user channel
			const name = match[1]
			if (discord.channels.cache.find(c => c.name === name)){
				log.warn(`${user.username} attempting to rename to ${name}`)
				reply(msg, `Channel name ${name} is already in use`)
				return
			}
			log.debug(`${user.username} renaming to ${name}`)
			reply(msg, `Renaming ${user}'s island to ${name}`)
			renameChannel(discord, user, name)
			return
		}

		if (content.match(/^descriptions$/i)){
			const descriptions = await listChannelTopics(discord)
			reply(msg, descriptions)
			return
		}

		if (match = content.match(/^description (.*)/i)){
			if (match.length < 2){
				reply(msg, "Please enter a new description for your island.\ne.g. `description A place to hang`")
				return
			}
			// Rename a user channel description
			const desc = match[1]
			log.debug(`${user.username} updating description to ${desc}`)
			reply(msg, `Updating ${user}'s island description to "${desc}"`)
			setChannelTopic(discord, user, desc)
			return
		}

		if (content.match(/^invite (.*)/i) && msg.mentions.users.size > 0){
			// Invite a user to your island
			log.debug(`${user.username} inviting ${mention.username}`)
			reply(msg, `Inviting ${mention} to your island`)
			const chan = findChannel(discord, user)
			await inviteUser(chan, mention)
			chan.send(`${emoji.wave} ${mention}! Welcome to ${chan.name}`)
			return
		}

		if (content.match(/^boot (.*)/i) && msg.mentions.users.size > 0){
			// Remove a user from your island
			log.debug(`${user.username} removing ${mention.username}`)
			reply(msg, `Booting ${mention} from your island`)
			const chan = findChannel(discord, user)
			await uninviteUser(chan, mention)
			chan.send(`${mention.username} has left ${chan.name} ${emoji.boat}`)
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
