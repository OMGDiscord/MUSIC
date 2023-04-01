module.exports = {
	name: "stop",
	async run ({ message, client }) {
		if (!message.member.voice?.channel) return message.channel.send("I'm sorry but you need to be in a voice channel to play music!");
		const serverQueue = client.queue.get(message.guild.id);
		if (!serverQueue) return message.channel.send("There is nothing playing that I could **\`stop\`** for you.");
		const stop = serverQueue.subscription.player.stop();
		if (stop)	{
			client.queue.delete(message.guild.id);
			message.channel.send("⏹️ **|**  Stop command has been used!");
		} else message.channel.send("❌ **|**  I could not stop the music for you.");
	}
}
