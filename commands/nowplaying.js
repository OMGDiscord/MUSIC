module.exports = {
	name: "nowplaying",
	aliases: ["np"],
	async run({ message, client }) {
		const serverQueue = client.queue.get(message.guild.id);
		if (!serverQueue) return message.channel.send("There is nothing playing.");
		return message.channel.send(`🎶 **|**  Now Playing: **\`${serverQueue.songs[0].title}\`**`);
	}
}
