// tasha.js
import { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, InteractionType } from 'discord.js';
import { TicketThread } from './ticket-thread.js';
import { TicketTags } from './ticket-tags.js';
import config from './config.js';
import db from './database.js';

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

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
                await TicketThread.create(client, interaction.user, category);
            }
        });
    } else {
        console.error('Ticket channel not found or is not a text-based channel.');
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.channel.isThread() && 
        message.channel.parentId === config.ticketChannelId) {
        
        try {
            
            const ticket = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id FROM tickets WHERE discord_user_id = ? ORDER BY created_at DESC LIMIT 1', 
                    [message.author.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (ticket) {
                const avatarUrl = message.author.displayAvatarURL({ format: 'png' });

                await TicketThread.addMessage(
                    ticket.id,
                    message.author.id,
                    message.author.username,
                    message.content,
                    false,
                    avatarUrl
                );
            }
        } catch (error) {
            console.error('Error storing Discord message:', error);
        }
    }
});

client.login(config.discordToken);