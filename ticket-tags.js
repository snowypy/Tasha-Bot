// ticket-tags.js
const config = require('./config.js');

class TicketTags {
    static async addTags(ticketId, tags) {
        // Validate the tags against the configured options
        const validTags = tags.filter(tag => config.ticketTags.some(t => t.name === tag));

        // Update the ticket's tags in the database or other storage
        // ...

        return validTags;
    }

    static getConfiguredTags() {
        return config.ticketTags;
    }
}