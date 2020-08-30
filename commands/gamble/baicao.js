const Eco = require('quick.eco');
const eco = new Eco.Manager();
const { randomcard, createembedfield, laysodep, locbai } = require('../../functions/utils');
const ms = require('ms');
const doubledownEmoji = "👌";
const stopEmoji = "🛑";
const check_game = new Set();
module.exports = {
    name: 'baicao',
    cooldown: 5,
    aliases: ['bc'],
    description: 'bài cào',
    category: 'gamble',
    run: async (client, message, args) => {
        if (check_game.has(message.author.id)) return message.channel.send('Bạn chưa hoàn thành ván đấu, vui lòng hoàn thành ván chơi!');
        const playerDeck = [];
        const botsDeck = [];
        const maxbet = 250000;
        const backcard = '<:back:709983842542288899>';
        let listofcard = require('../../assets/cardemojis.json').fulllist;
        const hide_deck = [];
        let bet = undefined;
        const userdata = eco.fetchMoney(message.author.id);
        if (args[0] == 0) return message.channel.send('Bạn không thể cược 0.');
        else if (args[0] == 'all') {
            bet = 100000;
            if (bet > userdata.amount) bet = userdata.amount;
        }
        else if (isNaN(args[0])) return message.channel.send('Vui lòng nhập tiền cược!');
        else bet = args[0];
        if (bet > parseInt(userdata.amount) || userdata.amount == 0) return message.channel.send('Bạn không có đủ tiền để chơi!');
        else if (bet > maxbet) bet = maxbet;
        check_game.add(message.author.id);
        // 3 lá 1 set
        for (let i = 0; i < 3; i++) {
            playerDeck.push(await randomcard(listofcard));
            listofcard = locbai(listofcard, playerDeck);
            botsDeck.push(await randomcard(listofcard));
            listofcard = locbai(listofcard, botsDeck);
            hide_deck.push(backcard);
        }
        const msg = await message.channel.send(createembed(message.author, bet, createembedfield(playerDeck), createembedfield(botsDeck), getval(playerDeck).point, getval(botsDeck).point, createembedfield(hide_deck), "not"));
        const usercard = getval(playerDeck);
        const botdata = getval(botsDeck);
        if (usercard.jqk === 3) {
            // x3 tiền + win
            await money(message.author.id, 'thang', bet * 3);
            check_game.delete(message.author.id);
            return msg.edit(createembed(message.author, bet, createembedfield(playerDeck), createembedfield(botsDeck), usercard.point, botdata.point, createembedfield(hide_deck), 'jqkwin'));
        } else if (botdata.jqk === 3) {
            // mất tiền + thua
            await money(message.author.id, 'lose', bet);
            check_game.delete(message.author.id);
            return msg.edit(createembed(message.author, bet, createembedfield(playerDeck), createembedfield(botsDeck), usercard.point, botdata.point, createembedfield(hide_deck), 'jqklose'));
        }
        if (userdata.amount >= bet * 2) msg.react(doubledownEmoji);
        msg.react(stopEmoji);
        const filter = (reaction, user) => {
            return (reaction.emoji.name === doubledownEmoji || reaction.emoji.name === stopEmoji) && user.id === message.author.id;
        };
        const collector = msg.createReactionCollector(filter, { time: ms('1m'), maxEmojis: 1 });
        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === doubledownEmoji && userdata.amount >= bet * 2) {
                // check người ta có đủ điều kiện để cược x2
                bet = bet * 2;
                await stop(usercard, botdata, bet, message.author, playerDeck, botsDeck, hide_deck, msg, check_game);
                collector.stop();
            } else if (reaction.emoji.name === stopEmoji) {
                await stop(usercard, botdata, bet, message.author, playerDeck, botsDeck, hide_deck, msg, check_game);
                collector.stop();
            }
        });
        collector.on('end', async (collected, reason) => {
            if (reason == 'time') {
                msg.edit('Trò chơi hết hạn. Bạn sẽ bị trừ tiền.');
                money(message.author.id, "thua", bet);
            }
            check_game.delete(message.author.id);
        });
    },
};

// eslint-disable-next-line no-shadow
async function stop(usercard, botdata, bet, user, playerDeck, botsDeck, hide_deck, msg, check_game) {
    check_game.delete(user.id);
    let kind_of_winning = undefined;
        if (usercard.point == botdata.point) {
            kind_of_winning = 'hoa';
        } else if (usercard.point > botdata.point) {
            kind_of_winning = 'thang';
        } else kind_of_winning = 'thua';
        msg.edit(createembed(user, bet, createembedfield(playerDeck), createembedfield(botsDeck), usercard.point, botdata.point, createembedfield(hide_deck), kind_of_winning));
        if (kind_of_winning !== 'hoa') await money(user.id, kind_of_winning, bet);
}

function createembed(nguoichoi, bet, deck_user, deck_bot, nguoichoi_val, bot_val, hidden_deck, end) {
    const { MessageEmbed } = require('discord.js');
    const embed = new MessageEmbed()
            .setColor("#00FFFF")
            .setTitle(`Chọn ${doubledownEmoji} để cược gấp đôi nếu bạn tự tin.`)
            .setAuthor(`${nguoichoi.tag}, bạn đã cược ${laysodep(bet)} để chơi bài cào!`, nguoichoi.displayAvatarURL())
            .setFooter("Đang chơi!");
    if (end == 'thang') {
        // light green
        embed.setColor("#90EE90")
            .addFields(
            { name: `Bot: [${bot_val}]`, value: deck_bot },
            { name: `User: [${nguoichoi_val}]`, value: deck_user },
        );
        embed.footer.text = `Bạn thắng ${laysodep(bet)} tiền!`;
    } else if (end == 'thua') {
        // thua
        embed.setColor("#FF0000")
            .addFields(
            { name: `Bot: [${bot_val}]`, value: deck_bot },
            { name: `User: [${nguoichoi_val}]`, value: deck_user },
        );
        embed.footer.text = `Bạn thua ${laysodep(bet)} tiền!`;
    } else if (end == 'hoa') {
        embed.setColor("#D3D3D3")
            .addFields(
            { name: `Bot: [${bot_val}]`, value: deck_bot },
            { name: `User: [${nguoichoi_val}]`, value: deck_user },
        );
        embed.footer.text = `Bạn không mất tiền cho trận đấu này`;
    } else if (end == 'not') {
        embed.addFields(
            { name: `Bot: [?]`, value: hidden_deck },
            { name: `User: [${nguoichoi_val}]`, value: deck_user },
        );
    } else if (end == 'jqkwin') {
        embed.setColor("#77dd77")
            .addFields(
            { name: `Bot: [${bot_val}]`, value: deck_bot },
            { name: `User: [${nguoichoi_val}]`, value: deck_user },
        )
            .setTitle(`Bạn có 3 con tiên!`);
        embed.footer.text = `Bạn thắng ${laysodep(parseInt(bet.toString().replace(',', '')) * 3)} tiền!`;
    } else if (end == 'jqklose') {
        embed.setColor("#FF0000")
            .setTitle(`Bot có 3 con tiên!`)
            .addFields(
                { name: `Bot: [${bot_val}]`, value: deck_bot },
                { name: `User: [${nguoichoi_val}]`, value: deck_user },
        );
        embed.footer.text = `Bạn mất hết số tiền cược!`;
    }
    return embed;
}

function getval(list) {
    let jqk = 0;
    let countpoint = 0;
    for (let i = 0; i < list.length; i++) {
        const card = list[i].slice(2, 3);
        if (!isNaN(card)) {
            switch(parseInt(card)) {
                case 1:
                    countpoint += 10;
                    break;
                default:
                    countpoint += parseInt(card);
                    break;
            }
        } else {
            switch(card) {
                case "a":
                    countpoint++;
                    break;
                default:
                    countpoint += 10;
                    jqk++;
                    break;
            }
        }
    }
    let realpoint = undefined;
    if (countpoint.toString().length == 1) realpoint = countpoint;
    else realpoint = parseInt(countpoint.toString().slice(1));
    return { point: realpoint, jqk: jqk };
}

async function money(userid, kind, ammount) {
    if (!userid || !ammount) return null;
    if (isNaN(ammount)) return null;
    if (kind == 'thang') {
        await eco.addMoney(userid, ammount);
    } else await eco.removeMoney(userid, ammount);
}