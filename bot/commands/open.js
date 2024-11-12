// bot/commands/open.js

const { SlashCommandBuilder } = require('discord.js');
const Ticket = require('../models/ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('open')
    .setDescription('Open a new support ticket.'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const channelId = interaction.channelId;

    try {
      const ticket = await Ticket.create({
        userId,
        status: 'open',
        channelId,
      });

      await interaction.reply(`Your ticket has been opened! Ticket ID: ${ticket.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply('There was an error opening your ticket. Please try again later.');
    }
  },
};
