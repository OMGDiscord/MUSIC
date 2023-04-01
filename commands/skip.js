module.exports = {
	name: "skip",
	async run({ message, client }) {
		const serverQueue = client.queue.get(message.guild.id);
		if (!message.member.voice?.channel) return message.channel.send("I'm sorry but you need to be in a voice channel to play a music!");
		if (!serverQueue) return message.channel.send("There is nothing playing that I could **\`skip\`** for you.");
		serverQueue.songs.shift();
		const { play } = require("../");
		play(message.guild, serverQueue.songs[0]);
		message.channel.send("⏭️ **|**  Skip command has been used!");
		return;
	}
}
