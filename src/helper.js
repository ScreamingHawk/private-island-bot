const log = require('./logger')

// Reply to a message in a channel
module.exports.reply = reply = (msg, content) => {
	msg.channel.send(content)
		.catch(log.error)
}

// Get the guild
module.exports.getGuild = getGuild = (discord) => discord.guilds.cache.first()

// Get manager channel
module.exports.managerChannel = managerChannel = discord =>
	this.getGuild(discord).channels.cache.find(c => c.name === "manager")

// Find the role for everyone
module.exports.everyoneRole = everyoneRole = (discord) =>
	this.getGuild(discord).roles.cache.first()

// Find island group
module.exports.islandGroup = islandGroup = (discord) => {
	return this.getGuild(discord).channels.cache.find(c => c.name === "islands")
}

// Find the channel for the user
module.exports.findChannel = findChannel = (discord, user) => {
	const uname = user.username.toLowerCase()
	return this.getGuild(discord).channels.cache.find(c => c.name.startsWith(`${uname}s-`))
}

// Create a channel for a user
module.exports.createChannel = createChannel = (discord, user) => {
	if (!this.findChannel(discord, user)){
		log.debug(`Creating channel for ${user.username}`)
		const uname = user.username.toLowerCase()
		this.getGuild(discord).channels.create(`${uname}s-island`, {
			parent: this.islandGroup(discord),
			permissionOverwrites: [
				{
					id: discord.user.id,
					allow: ['VIEW_CHANNEL'],
				},
				{
					id: user.id,
					allow: ['VIEW_CHANNEL'],
				},
				{
					id: this.everyoneRole(discord).id,
					deny: ['VIEW_CHANNEL'],
				},
			],
			reason: `Creating channel for ${user.username}`,
		})
			.catch(log.error);
	}
}

// Add user to a user channel
module.exports.inviteUser = inviteUser = (discord, user, mention) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		chan.overwritePermissions([{
			id: mention.id,
			allow: ['VIEW_CHANNEL'],
		}])
			.catch(log.error)
	}
}

// Remove a user from a user channel
module.exports.uninviteUser = uninviteUser = (discord, user, mention) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		chan.overwritePermissions([{
			id: mention.id,
			deny: ['VIEW_CHANNEL'],
		}])
			.catch(log.error)
	}
}

// Make channel NSFW
module.exports.nsfwChannel = nsfwChannel = (discord, user, nsfw) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		chan.setNSFW(nsfw)
			.catch(log.error)
	}
}