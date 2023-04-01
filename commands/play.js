module.exports = {
	name: "play",
	aliases: ["p"],
	use: "play [query]",
	async run ({ message, args }) {
		let url = args.join(" ").replace(/<(.+)>/g, "$1");
		if (!url) return message.channel.send("You need to provide a `URL` or `title` to play a music.");
		
		const voiceChannel = message.member.voice?.channel;
		if (!voiceChannel) return message.channel.send("I'm sorry but you need to be in a voice channel to play a music!");
		
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has("CONNECT")) return message.channel.send("Sorry, but I need **`CONNECT`** permissions to proceed!");
		if (!permissions.has("SPEAK")) return message.channel.send("Sorry, but I need **`SPEAK`** permissions to proceed!");

		const { handleVideo, awaitableSearch, validateURL } = require("../");
		let parsedUrl = validateURL(url);

		await message.react("🔍").catch(console.error);

		if (!parsedUrl) return awaitableSearch({ query: url }).then(data => {
			const video = data.videos[0];
			parsedUrl = {
				url: video.url,
				path: "watch",
				videoId: video.videoId,
				listId: null
			}
			return play();
		}).catch(async error => {
			console.error(error);
			if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
			await message.react("❌").catch(console.error);
			message.channel.send("🆘 **|**  I could not obtain any search results.");
		});
		
		return play();
		
		async function play() {
			if (parsedUrl.path.toLowerCase() === "playlist") {
				const playlist = await awaitableSearch({ listId: parsedUrl.listId }).catch(async error => {
					console.error(error);
					if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
					await message.react("❌").catch(console.error);
					message.channel.send("🆘 **|**  I could not find the playlist.");
				});
				for (const video of playlist.videos) handleVideo({ title: video.title, id: video.videoId }, message, voiceChannel, true);
				if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
				await message.react("✅").catch(console.error);
				// Old emoji id: <:yes:591629527571234819>
				return message.channel.send(`✅ **|**  Playlist: **\`${playlist.title}\`** has been added to the queue!`);
			} else {
				let video = null;
				try {
					video = await awaitableSearch({ videoId: parsedUrl.videoId });
				} catch (error) {
					try {
						const videoData = (await awaitableSearch({ query: url })).videos[0];
						if (!videoData) {
							if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
							await message.react("❌").catch(console.error);
							return message.channel.send("🆘 **|**  I could not obtain any search results.");
						}
						video = videoData;
					} catch (err) {
						console.error(err);
						if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
						await message.react("❌").catch(console.error);
						return message.channel.send("🆘 **|**  I could not obtain any search results.");
					}
				}
				if (!video) return;
				if (message.reactions.cache.has("🔍")) message.reactions.cache.get("🔍").users.remove(message.client.user.id).catch(console.error);
				await message.react("✅").catch(console.error);
				return handleVideo({ title: video.title, id: video.videoId }, message, voiceChannel);
			}
		}
	}
}
