module.exports = {
	name: "queue",
	aliases: ["q"],
	async run({ message, client }) {
		const serverQueue = client.queue.get(message.guild.id);
		if (!serverQueue) return message.channel.send("There is nothing playing.");
		return message.channel.send(`
__**Song Queue**__
${serverQueue.songs.map((song, i) => `**#${i + 1} •** ${song.title}${i === 0 ? " (now playing)" : i === 1 ? " (next)" : ""}`).join("\n")}
    `);
	}
}
