module.exports = {
	name: "resume",
	async run({ message, client }) {
		const serverQueue = client.queue.get(message.guild.id);
		if (!serverQueue || serverQueue.playing) return message.channel.send("There is nothing playing.");
		serverQueue.playing = true;
		serverQueue.subscription.player.unpause();
		return message.channel.send("▶ **|** Resumed the music for you!");
	}
}
