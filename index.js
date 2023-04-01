"use strict";
require("dotenv").config();
// require("./server.js");

const Discord = require("discord.js");

const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;

const queue = new Map();
const commands = new Discord.Collection();

const client = new Discord.Client({ intents: Object.keys(Discord.Intents.FLAGS), disableEveryone: true });
client.queue = queue;
client.commands = commands;

client.on("warn", console.warn);
client.on("error", console.error);
client.on("disconnect", () => console.log("An error occurred, trying to reconnect!"));
client.on("reconnecting", () => console.log("I am reconnecting now..."));

client.on("ready", () => {
	console.log(`${client.user.tag} has been successfully turned on!`);

	const { readdirSync } = require("fs");
	const { join } = require("path");

	const commandsPath = join(__dirname, "commands");
	const commandsFiles = readdirSync(commandsPath);
	console.log("Initializing commands handler...");
	for (const filename of commandsFiles) {
		const dir = join(commandsPath, filename);
		const command = require(dir);
		if (!command) throw new Error(`Invalid command "${dir}"`);
		if (typeof command.name != "string" || command.name.length == 0) throw new Error(`Command "${dir}" has not a valid name.`);
		if (Array.isArray(command.aliases)) {
			for (const alias of command.aliases) {
				if (typeof alias != "string" || alias.length == 0) throw new Error(`Command "${dir}" has a invalid alias (${alias})`);
			}
		}
		if (command.use) {
			if (typeof command.use != "string" || command.use.length == 0 || !command.use.startsWith(command.name)) throw new Error(`Command "${dir}" use is invalid.\n- It must start with the command name.`);
		}
		if (typeof command.run != "function") throw new Error(`'command.run' must be a function. (path "${dir}")`);
		client.commands.set(command.name, command);
	}
	console.log(`${commands.size} commands successfully handled.`);
});

client.on("messageCreate", async message => { // eslint-disable-line
	if (message.author.bot) return; // Filter all bots
	if (message.channel.type == "DM") return message.channel.send("You can't use commands on DM Channels.");
	if (!message.content.startsWith(PREFIX)) return; // Filter only command messages

	const args = message.content.slice(PREFIX.length).split(" "); // Removes the prefix and splits all spaces
	const commandName = args.shift().toLowerCase(); // Removes the first arg (now args is just a array without the command name)
	const command = commands.find(c => [c.name, ...(c.aliases || [])].map(n => n.toLowerCase()).includes(commandName));
	if (!command) return;
	command.run({ message, args, client, command, commandName });
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	const song = {
		id: video.id,
		title: video.title,
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
		
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			subscription: null,
			songs: [],
			volume: 1,
			playing: true
		};

		queue.set(msg.guildId, queueConstruct);
		queueConstruct.songs.push(song);

		try {
			joinVoiceChannel({ channelId: voiceChannel.id, guildId: voiceChannel.guildId, adapterCreator: voiceChannel.guild.voiceAdapterCreator });
			queueConstruct.connection = getVoiceConnection(voiceChannel.guildId);
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			msg.channel.send(`I could not join the voice channel: **\`${error}\`**`);
		}
	} else {
		serverQueue.songs.push(song);
		// Old emoji: <:yes:591629527571234819>
		if (!playlist) msg.channel.send(`✅ **|** **\`${song.title}\`** has been added to the queue!`);
	}
	return;
}

async function play(guild, song, attempt = 0) {
	const { getVoiceConnection } = require("@discordjs/voice");
	const connection = getVoiceConnection(guild.id);
	if (!guild | !connection) return;
	
	if (!song) {
		connection.destroy();
		queue.delete(guild.id);
		return;
	}

	const { createAudioPlayer, createAudioResource } = require("@discordjs/voice");
	
	const serverQueue = queue.get(guild.id);

	const player = createAudioPlayer();
	player.on("error", error => {
		console.error(`Received an error on audio playing:`, error);
		attempt++;
		serverQueue.textChannel.send(`🆘 **|** An error ocurried. Trying to play again - Attempt ${attempt}`);
		if (attempt > 3) {
			serverQueue.songs.shift();
			return play(guild, serverQueue.songs[0]);
		}
		return play(guild, song, attempt);
	});

	const subscription = connection.subscribe(player);
	serverQueue.subscription = subscription;

	const { stream } = require("play-dl");

	const source = await stream(song.url);

	const resource = createAudioResource(source.stream, {
		inputType: source.type,
		inlineVolume: serverQueue.volume
	});
	serverQueue.resource = resource;

	player.play(resource);
	
	serverQueue.textChannel.send(`🎶  **|**  Start Playing: **\`${song.title}\`**`);
}

client.login(TOKEN);

module.exports = {
	handleVideo,
	play,
	client,
	validateURL(url) {
		const urlSimilarsRegex = /^(?:https:\/\/)?(?:www\.)?(youtu\.be|youtube\.com)\//i;
		if (urlSimilarsRegex.test(url)) {
			if (url.startsWith("www.")) url = `https://${url}`;
			else if (url.startsWith("https://")) url = url.replace("https://", "https://www.");
			else url = `https://www.${url}`;
		} else return null;
		if (/youtu\.be\/[a-zA-Z\d-]{11}/g.test(url)) {
			const id = url.match(/[a-zA-Z\d-]{11}/)[0];
			url = `https://www.youtube.com/watch?v=${id}`;
		}
		if (!url.startsWith("https://")) return null;
		try {
			const parsed = new URL(url);
			const validURL =  {
				url,
				path: parsed.pathname.slice(1),
				videoId: parsed.searchParams.get("v") || undefined,
				listId: parsed.searchParams.get("list") || undefined
			}
			if (validURL.path === "playlist" && /[\da-z]{34}/i.test(validURL.listId)) return null;
			if (validURL.path === "watch" && /[\da-z-]{11}/i.test(validURL.videoId)) return null;
			return validURL;
		} catch(e) {
			return null;
		}
	},
	async awaitableSearch(query) {
		return new Promise((res, rej) => {
			const ytsearch = require("yt-search");
			ytsearch(query, (error, data) => {
				if (error) rej(error);
				else res(data);
			});
		});
	}
}
