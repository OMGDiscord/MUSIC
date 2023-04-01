const { MessageEmbed } = require("discord.js");

module.exports = {
	name: "help",
	aliases: ["cmd"],
	async run ({ message, client }) {
		const commandsList = client.commands.map(c => {
			let commandNames = [c.name];
			if (c.aliases?.length > 0) commandNames = commandNames.concat(c.aliases);
			const namesList = commandNames.map(n => `\`${n}\``).join(", ");
			const use = typeof c.use == "string" && c.use?.length > 0 ? ` > **\`${c.use}\`**`: "";
			return `> ${namesList}${use}`;
		}).join("\n");
		
		const helpembed = new MessageEmbed()
			.setColor("#7289DA")
			.setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() })
			.setDescription(`__**Commands List**__\n${commandsList}`)
			.setFooter({ text: "©️ 2020 Zealcord Development", iconURL: "https://app.zealcord.xyz/assets/Logo.png" });
		
		return message.channel.send({ embeds: [ helpembed ] }).catch(console.error);
	}
}
