const log = require('./logger')
const emoji = require('./emoji')
const datastore = require('./datastore')

// Reply to a message in a channel
module.exports.reply = reply = (msg, content) => {
	msg.channel.send(content)
		.catch(log.error)
}

// Check mention is ok
module.exports.mentionOk = mentionOk = (discord, msg, mention) =>
	mention !== discord.user && mention !== msg.author

// Get the guild
module.exports.getGuild = getGuild = (discord) => discord.guilds.cache.first()

// Find a channel by name
module.exports.channelByName = channelByName = (discord, name) =>
	this.getGuild(discord).channels.cache.find(c => c.name === name)

// Get manager channel
module.exports.managerChannel = managerChannel = discord =>
	this.channelByName(discord, "manager")

// Clear a channel
module.exports.clearChannel = clearChannel = async channel => {
	let fetched;
	do {
		fetched = await channel.messages.fetch({limit: 100})
			.catch(log.error)
		fetched = fetched.filter(m => !m.pinned)
		channel.bulkDelete(fetched)
			.catch(log.error)
	} while(fetched.size >= 2)
}

// Add a welcome message to the notice-board
module.exports.addWelcomeMessage = addWelcomeMessage = discord => {
	this.channelByName(discord, "notice-board")
		.send(emoji.island + "Welcome to Private Islands!" + emoji.island +
			"\n" +
			"\nThis server offers a self managed safe space for everyone. " +
			`\nChat in ${this.channelByName(discord, "central")} to meet new people. ` +
			`\nHit up the ${this.channelByName(discord, "manager")} to invite people to your private island. ` +
			"\n" + 
			"\nEveryone's private island is complety self managed. " +
			`\nThe sever owner ${this.getGuild(discord).owner} is an unused account. ` +
			"\nNo one will view your island without your express consent. " +
			"\n" +
			`\nIf you like what you see then head on over to ${this.channelByName(discord, "manager")} and request a \`move in\`! ` +
			"\n" +
			"\nGrab a martini at the bar, sit back and relax. " +
			"\n" + emoji.drink + emoji.martini + emoji.wine
		).catch(log.error)
}

// Add a help message to channel
module.exports.addHelpMessage = addHelpMessage = channel => {
	channel.send(
		emoji.island + "**Island Management**" + emoji.island +
		"\n```move in/out - to set up your private island on the server\n" +
		"rename <new_name> - rename your private island\n" +
		"invite @user - to give a user access to your private island\n" +
		"boot @user - to remove a user from your private island\n" +
		"nsfw/sfw - to make your island NSFW or SFW\n" +
		"colour/color ###### - give yourself a colour role\n" +
		"reset - to burn down your private island and build it up again```" +
		"Messages here are cleared every couple of minutes.\n" +
		"You should probably mute this channel..."
	).catch(log.error)
}

// Find the role for everyone
module.exports.everyoneRole = everyoneRole = (discord) =>
	this.getGuild(discord).roles.cache.first()

// Find role
module.exports.findRole = findRole = (discord, name) =>
	this.getGuild(discord).roles.cache.find(r => r.name === name)

// Create role
module.exports.createRole = createRole = (discord, colour, member) => {
	if (!this.findRole(discord, colour)){
		this.getGuild(discord).roles.create({
			data: {
				name: colour,
				color: colour,
				mentionable: false,
				hoist: false,
			},
			reason: `${colour} role added for ${member.user.username}`,
		})
			.then(role => {
				member.roles.add(role)
					.catch(log.error)
			})
			.catch(log.error)
	}
}

// Find island group
module.exports.islandGroup = islandGroup = (discord) => {
	return this.getGuild(discord).channels.cache.find(c => c.name === "islands")
}

// Find the channel for the user
module.exports.findChannel = findChannel = (discord, user) => {
	const data = datastore.getUserData(user)
	let chan = null
	if (data.channelId){
		chan = this.getGuild(discord).channels.cache.get(data.channelId)
		if (chan){
			return chan
		}
	}
	// Fail over to username look up
	const uname = user.username.toLowerCase()
	chan = this.getGuild(discord).channels.cache.find(c => c.name.startsWith(`${uname}s-`))
	if (chan){
		// Update store
		data.channelId = chan.id
		datastore.saveData(discord)
	}
	return chan
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
					allow: ['VIEW_CHANNEL', 'MANAGE_MESSAGES'],
				},
				{
					id: user.id,
					allow: ['VIEW_CHANNEL', 'MANAGE_MESSAGES'],
				},
				{
					id: this.everyoneRole(discord).id,
					deny: ['VIEW_CHANNEL'],
				},
			],
			reason: `Creating channel for ${user.username}`,
		})
			.then(chan => {
				chan.send(`${emoji.island} Welcome to ${user.username}'s island! ${emoji.island}`)
					.catch(log.error)
				// Persist channel data
				datastore.getUserData(user).channelId = chan.id
				datastore.saveData(discord)
			})
			.catch(log.error)
	}
}

// Delete a channel for a user
module.exports.deleteChannel = deleteChannel = async (discord, user, callback) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		log.debug(`Deleting channel for ${user.username}`)
		await chan.delete()
			.catch(log.error);
	}
	if (callback) {
		callback()
	}
}

// Rename a channel for a user
module.exports.renameChannel = renameChannel = async (discord, user, name) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		log.debug(`Renaming channel for ${user.username} to ${name}`)
		await chan.setName(name)
			.catch(log.error);
	}
}

// Reset channel perms on a user channel
module.exports.resetUserPerm = resetUserPerm = (discord, user) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		chan.permissionOverwrites([
			{
				id: discord.user.id,
				allow: ['VIEW_CHANNEL', 'MANAGE_MESSAGES'],
			},
			{
				id: user.id,
				allow: ['VIEW_CHANNEL', 'MANAGE_MESSAGES'],
			},
			{
				id: this.everyoneRole(discord).id,
				deny: ['VIEW_CHANNEL'],
			},
		],)
			.catch(log.error)
	}
}

// Update channel perms on a channel for a user
module.exports.updateUserPerm = updateUserPerm = async (chan, user, allow) => {
	if (chan){
		await chan.updateOverwrite(user.id, {
			VIEW_CHANNEL: allow,
		})
			.catch(log.error)
	}
}

// Add user to a user channel
module.exports.inviteUser = inviteUser = async (channel, user) => await updateUserPerm(channel, user, true)

// Remove a user from a user channel
module.exports.uninviteUser = uninviteUser = async (channel, user) => await updateUserPerm(channel, user, false)

// Make channel NSFW
module.exports.nsfwChannel = nsfwChannel = (discord, user, nsfw) => {
	const chan = this.findChannel(discord, user)
	if (chan){
		chan.setNSFW(nsfw)
			.catch(log.error)
	}
}