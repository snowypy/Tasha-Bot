module.exports = {
    discordToken: 'your-discord-bot-token',
    discord: {
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        callbackURL: 'http://172.93.101.158:3000/auth/discord/callback',
        guildId: 'your-guild-id',
        staffRoleId: 'your-staff-role-id'
    },
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