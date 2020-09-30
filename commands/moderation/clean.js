module.exports = {
    name: 'clean',
    category: 'moderation',
    description: 'Dọn dẹp tin nhắn từ bot',
    usage: '<PREFIX>clean',
    run: async (client, message, args) => {
        if (message.deletable) await message.delete();
        if (!message.member.hasPermission("MANAGE_MESSAGES"))
            return message.reply("Bạn không có quyền MANAGE_MESSAGES").then(m => m.delete({ timeout: 5000 }));
        message.channel.messages.fetch({
            limit: 100,
        }).then(async messages => {
            messages = messages.filter(msg => msg.author.id === client.user.id).array();
            await message.channel.bulkDelete(messages, true);
            await message.channel.send('👍');
        });
    }
};
