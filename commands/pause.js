module.exports = {
	name: "pause",
	async run({ message, client }) {
		const serverQueue = client.queue.get(message.guild.id);
		if (!serverQueue || !serverQueue.playing) return message.channel.send("There is nothing playing.");
		serverQueue.playing = false;
		serverQueue.subscription.player.pause();
		return message.channel.send("⏸ **|** Paused the music for you!");
	}
}
