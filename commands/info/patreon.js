module.exports = {
    name: 'patreon',
    category: 'info',
    description: 'Support patreon!',
    usage: 'patreon',
    run: async (client, message, args) => {
        message.channel.send('https://www.patreon.com/AgentBot')
    }
}