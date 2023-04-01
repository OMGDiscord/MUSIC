module.exports = {
	name: "search",
	aliases: ["sc"],
	use: "search [query]",
	async run({ message, args }) {
		
		const query = args.join(" ").replace(/<(.+)>/g, "$1");
		if (!query) return message.channel.send("You must provide a query (like a title, URL, etc).");
		
		const { awaitableSearch, handleVideo, validateURL } = require("../");
		const parsedUrl = validateURL(query);

		await message.react("🔍");
		
		if (parsedUrl) {
			const voiceChannel = message.member.voice?.channel;
			if (!voiceChannel) return message.channel.send("I'm sorry but you need to be in a voice channel to play a music!");
			
			const permissions = voiceChannel.permissionsFor(message.client.user);
			if (!permissions.has("CONNECT")) return message.channel.send("Sorry, but I need **`CONNECT`** permissions to proceed!");
			if (!permissions.has("SPEAK")) return message.channel.send("Sorry, but I need **`SPEAK`** permissions to proceed!");
			
			if (parsedUrl.path === "playlist") {
				awaitableSearch({ listId: parsedUrl.listId }).then(async playlist => {
					if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
					await message.react("✅").catch(console.error);
					for (const video of playlist.videos) handleVideo({ title: video.title, id: video.videoId }, message, voiceChannel, true);
					message.channel.send(`✅ **|**  Playlist: **\`${playlist.title}\`** has been added to the queue!`);
				}).catch(error => {
					console.error(error);
					message.channel.send("🆘 **|**  I could not find the playlist.");
				});
			} else if (parsedUrl.path === "watch") {
				awaitableSearch({ videoId: parsedUrl.videoId }).then(async video => {
					if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
					await message.react("✅").catch(console.error);
					handleVideo({ title: video.title, id: video.videoId }, message, voiceChannel);
					message.channel.send(`✅ **|** **\`${video.title}\`** has been added to the queue!`);
				}).catch(error => {
					console.error(error);
					message.channel.send("🆘 **|** I could not find the video.");
				});
			}
		} else {
			awaitableSearch(query).then(async results => {
				if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
				await message.react("✅").catch(console.error);
				const videos = results?.videos?.slice(0, 10);
				if (!videos || videos.length === 0) return message.channel.send("🆘 **|** I could not obtain any search results.");
				const resultsMessage = await message.channel.send(`I found some results for \`${query}\`:\n${videos.map(({ title, author, url }, i) => `> __**#${i + 1}**__ • **${title}** *from __${author.name}__*\n> - Link: \`${url}\``).join("\n")}\n\nNote: Please select one of the results by typing its number.`);
				const collector = message.channel.createMessageCollector({ filter: msg => msg.author.id == message.author.id, idle: 5 * 60 * 1000 });
				collector.on("collect", async col => {
					const index = parseInt(col.content);
					if (!index || index < 1 || index > videos.length) {
						await col.react("❌");
						setTimeout(() => col.reactions.cache.get("❌")?.users?.remove(col.author.id)?.catch(console.error), 2000);
						return;
					}

					const voiceChannel = message.member.voice?.channel;
					if (!voiceChannel) return message.channel.send("I'm sorry but you need to be in a voice channel to play a music!");
					
					const permissions = voiceChannel.permissionsFor(message.client.user);
					if (!permissions.has("CONNECT")) return message.channel.send("Sorry, but I need **`CONNECT`** permissions to proceed!");
					if (!permissions.has("SPEAK")) return message.channel.send("Sorry, but I need **`SPEAK`** permissions to proceed!");
					
					await col.react("✅");

					const video = videos[index - 1];
					await handleVideo({ title: video.title, id: video.videoId }, message, message.member.voice.channel);
					resultsMessage.delete();
					col.delete();
					collector.stop();
					message.channel.send(`✅ **|** **\`${video.title}\`** has been added to the queue!`);
				});
				collector.on("end", async collected => {
					for (const msg of collected.values()) await msg.delete().catch(console.error);
					await resultsMessage.delete().catch(console.error);
				});
			}).catch(error => {
				console.error(error);
				message.channel.send("🆘 **|** I could not obtain any search results.");
			});
		}
	}
}
