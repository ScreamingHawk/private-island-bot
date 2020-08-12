const log = require('./logger')

let data = {}

const getDataChannel = async discord => {
	const guild = await discord.guilds.cache.first().fetch()
	let chan = guild.channels.cache.find(c => c.name === "data")
	if (!chan){
		chan = await guild.channels.create(`data`, {
			permissionOverwrites: [
				{
					id: discord.user.id,
					allow: ['VIEW_CHANNEL', 'MANAGE_MESSAGES'],
				},
				{
					// @everyone
					id: guild.roles.cache.first().id,
					deny: ['VIEW_CHANNEL'],
				},
			],
			reason: `Data storage channel`,
		})
			.catch(log.error)
	}
	return chan
}

module.exports = {
	saveData: async discord => {
		const chan = await getDataChannel(discord)
		chan.send(JSON.stringify(data))
	},
	loadData: async discord => {
		log.debug("Loading data")
		const chan = await getDataChannel(discord)
		await chan.messages.fetch()
		data = chan.messages.cache.first().content
		try {
			data = JSON.parse(data)
			log.debug(`Loaded data: ${JSON.stringify(data)}`)
		} catch {
			log.error("Unable to parse data")
		}
	},
	getUserData: user => {
		if (!data[user.id]){
			data[user.id] = {}
		}
		return data[user.id]
	}
}