module.exports = {
    discordToken: 'your-discord-bot-token',
    ticketChannelId: 'discord-channel-id-for-tickets',
    ticketCategories: [
        { id: 'category1', name: 'General Support' },
        { id: 'category2', name: 'Billing' },
        { id: 'category3', name: 'Technical' }
    ],
    ticketTags: [
        { name: 'high-priority', color: '#ff0000' },
        { name: 'low-priority', color: '#00ff00' },
        { name: 'bug', color: '#0000ff' },
        { name: 'feature-request', color: '#ffff00' }
    ]
};