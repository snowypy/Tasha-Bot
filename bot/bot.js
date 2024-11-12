const { Client, GatewayIntentBits } = require('discord.js');
const { Ticket } = require('./models/ticket');
const config = require('../config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!ticket')) {
    const content = message.content.slice(8).trim();
    const ticket = await Ticket.create({
      userId: message.author.id,
      content: content,
      status: 'open'
    });
    message.reply(`Ticket created with ID: ${ticket.id}`);
  }
});

async function startBot(io) {
  io.on('connection', (socket) => {
    console.log('User connected to web panel');
  });

  await client.login(config.BOT_TOKEN);
}

module.exports = { startBot };
