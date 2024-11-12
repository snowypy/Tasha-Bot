// ticket-tags.js
const config = require('./config.js');

class TicketTags {
    static async addTags(ticketId, tags) {

        const validTags = tags.filter(tag => config.ticketTags.some(t => t.name === tag));

        return validTags;
    }

    static getConfiguredTags() {
        return config.ticketTags;
    }
}