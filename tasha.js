const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');
const { TicketPanel } = require('./ticket-panel.js');
const { TicketThread } = require('./ticket-thread.js');
const { TicketTags } = require('./ticket-tags.js');
const config = require('./config.js');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Set up ticket channel and attach event listeners
    const ticketChannel = client.channels.cache.get(config.ticketChannelId);
    if (ticketChannel && ticketChannel.isTextBased()) {
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('create-ticket')
                    .setPlaceholder('Select a ticket category')
                    .addOptions(config.ticketCategories.map(cat => ({
                        label: cat.name,
                        value: cat.id
                    })))
            );

        ticketChannel.send({
            content: 'Click below to create a new ticket',
            components: [row]
        });

        client.on('messageCreate', async (message) => {
            if (message.channelId === config.ticketChannelId && message.content.toLowerCase() === '!createticket') {
                const filter = (reaction, user) => {
                    return user.id === message.author.id;
                };

                const collector = message.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async (interaction) => {
                    if (interaction.customId === 'create-ticket') {
                        const categoryId = interaction.values[0];
                        const category = config.ticketCategories.find(c => c.id === categoryId);
                        await TicketThread.create(interaction.user, category);
                    }
                });

                collector.on('end', collected => {
                    console.log(`Collected ${collected.size} items`);
                });
            }
        });
    } else {
        console.error('Ticket channel not found or is not a text-based channel.');
    }
});

client.login(config.discordToken);