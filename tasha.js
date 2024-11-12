const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, InteractionType } = require('discord.js');
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

        client.on('interactionCreate', async (interaction) => {
            if (interaction.type === InteractionType.MessageComponent && interaction.customId === 'create-ticket') {
                const categoryId = interaction.values[0];
                const category = config.ticketCategories.find(c => c.id === categoryId);
                await TicketThread.create(interaction.user, category);
            }
        });
    } else {
        console.error('Ticket channel not found or is not a text-based channel.');
    }
});

client.login(config.discordToken);