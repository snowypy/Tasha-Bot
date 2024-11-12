const { TextChannel, ThreadChannel } = require('discord.js');
const { TicketTags } = require('./ticket-tags.js');
const config = require('./config.js');

class TicketThread {
    static async create(client, user, category) {
        const ticketChannel = client.channels.cache.get(config.ticketChannelId);
        const thread = await ticketChannel.threads.create({
            name: `${category.name} - ${user.username}`,
            autoArchiveDuration: 1440, // 24 hours
            reason: `New ticket created by ${user.username}`
        });

        // Add ticket creator to the thread
        await thread.join();

        // Send initial message
        await thread.send(`Hello ${user.username}, your ticket in the ${category.name} category has been created. A staff member will be with you shortly.`);

        return thread;
    }

    static async getAll() {
        // Fetch all tickets from the database or other storage
    }

    static async getById(id) {
        // Fetch a specific ticket by its ID
    }

    static async replyToTicket(id, message, staffId) {
        const thread = await this.getById(id);
        await thread.send({
            embeds: [{
                author: {
                    name: `Staff Member (ID: ${staffId})`,
                    iconURL: `https://cdn.discordapp.com/avatars/${staffId}/${client.users.cache.get(staffId).avatar}.png`
                },
                description: message,
                timestamp: new Date().toISOString()
            }]
        });

        return thread;
    }

    static async assignTicket(id, staffId) {
        const thread = await this.getById(id);
        // Update the ticket's assignee in the database or other storage
        return thread;
    }

    static async closeTicket(id) {
        const thread = await this.getById(id);
        // Close the ticket, send the transcript to the user, and update the database or other storage
        return thread;
    }
}

module.exports = { TicketThread }