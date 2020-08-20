const { ownerID } = require('../../config.json');
const { MessageEmbed } = require('discord.js');
module.exports = {
    name: 'developer',
    aliases: ['dev'],
    description: 'Show info của owner của bot xD',
    category: 'info',
    usage: 'developer',
    run: async (client, message, args) => {
        let Dui = client.users.cache.get(ownerID);
        let embed = new MessageEmbed()
            .setTitle(`Thông tin về Developer`)
            .addField('Thông tin cá nhân', [
                `Tên Discord: ${Dui.tag}`,
                "Quốc gia: :flag_vn:",
                `ID user: ${Dui.id}`,
                `Online? ${Dui.presence.status == 'online' ? 'Có' : 'Không'}`
            ])
            .setThumbnail(Dui.displayAvatarURL())
        message.channel.send(embed);
    }
}