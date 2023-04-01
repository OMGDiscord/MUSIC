module.exports = {
	name: "volume",
	aliases: ["vol"],
	use: "volume [amount: 0-100]",
	async run({ message, args, client }) {
		if (!message.member.voice) return message.channel.send("I'm sorry but you need to be in a voice channel to play music!");
		const serverQueue = client.queue.get(message.guildId);
		if (!serverQueue) return message.channel.send("There is nothing playing.");
		if (!args[0]) return message.channel.send(`The current volume is: **\`${serverQueue.volume * 100}%\`**`);
		const volume = isNaN(args[0]) ? null : parseInt(args[0]);
		if (!volume || volume > 100 || volume < 0) return message.channel.send(`The volume "${args[0]}" is not a valid value.`);
		serverQueue.volume = volume / 100;
		serverQueue.resource.volume.setVolume(serverQueue.volume);
		message.channel.send(`${volume < 50 ? "🔉" : "🔊"} **|** Volume changed to **\`${volume}%\`**`);
	}
}
