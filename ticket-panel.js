// ticket-panel.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.js');
const { TicketThread } = require('./ticket-thread.js');
const { TicketTags } = require('./ticket-tags.js');
const { isAuthenticated } = require('./middleware/auth');
require('./auth');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
console.log('Environment:', isProduction ? 'Production' : 'Development');

if (isProduction) {
    app.set('trust proxy', 1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.login(config.discordToken);

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({
    secret: 'your-secure-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    },
    name: 'tasha_session'
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization with isStaff determination
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user);
});

passport.deserializeUser(async (obj, done) => {
    console.log('Deserializing user:', obj);
    try {
        const guild = await client.guilds.fetch(config.guildId);
        const member = await guild.members.fetch(obj.id);
        const isStaff = member.roles.cache.has(config.staffRoleId);
        obj.isStaff = isStaff;
        console.log(`User ${obj.username} isStaff: ${isStaff}`);
        done(null, obj);
    } catch (error) {
        console.error('Error during deserialization:', error);
        done(error, null);
    }
});

// Helper Functions
const formatDate = (date) => {
    return new Date(date).toLocaleString();
};

const renderTemplate = (content, title = 'Tasha Ticket Panel', user = null) => `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        discord: {
                            'blurple': '#5865F2',
                            'green': '#57F287',
                            'yellow': '#FEE75C',
                            'red': '#ED4245',
                            'dark': '#36393F',
                            'darker': '#2F3136',
                            'darkest': '#202225'
                        }
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="bg-discord-darkest text-gray-100">
    <nav class="bg-discord-dark shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="text-white text-xl font-semibold">Tasha Ticket System</a>
                </div>
                ${user ? `
                    <div class="flex items-center gap-4">
                        <span class="text-gray-400">${user.username}</span>
                        <a href="/logout" class="btn-secondary">Logout</a>
                    </div>
                ` : `
                    <div class="flex items-center">
                        <a href="/auth/discord" class="btn-primary">Login with Discord</a>
                    </div>
                `}
            </div>
        </div>
    </nav>
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        ${content}
    </main>
</body>
</html>
`;

// Routes
app.get('/tickets', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.query;
        let tickets;
        let statusTitle;

        if (status === 'open') {
            tickets = await TicketThread.getOpenTickets();
            statusTitle = 'Open Tickets';
        } else if (status === 'closed') {
            tickets = await TicketThread.getClosedTickets();
            statusTitle = 'Closed Tickets';
        } else if (status === 'unassigned') {
            tickets = await TicketThread.getUnassignedTickets();
            statusTitle = 'Unassigned Tickets';
        } else if (status === 'mine') {
            tickets = await TicketThread.getTicketsForStaff(req.user.id);
            statusTitle = 'Your Tickets';
        } else {
            tickets = await TicketThread.getAll();
            statusTitle = 'All Tickets';
        }

        const ticketTags = await Promise.all(
            tickets.map(async ticket => ({
                id: ticket.id,
                tags: await TicketTags.getTagsForTicket(ticket.id)
            }))
        );

        const content = `
            <h1 class="text-2xl font-semibold mb-6">${statusTitle}</h1>
            <div class="grid gap-6">
                ${tickets.map(ticket => {
                    const tags = ticketTags.find(t => t.id === ticket.id)?.tags || [];
                    return `
                    <div class="bg-discord-dark shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-medium">${ticket.category} - ${ticket.discord_username}</h3>
                                <p class="text-gray-400">Opened: ${formatDate(ticket.created_at)}</p>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    ${tags.map(tag => {
                                        const configTag = config.ticketTags.find(t => t.name === tag);
                                        return `
                                            <span class="px-2 py-0.5 rounded-full text-xs" 
                                                  style="background-color: ${configTag?.color || '#666'}20; 
                                                         color: ${configTag?.color || '#666'}; 
                                                         border: 1px solid ${configTag?.color || '#666'}40">
                                                ${tag}
                                            </span>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm ${
                                ticket.status === 'open' ? 'bg-discord-green text-black' : 'bg-discord-red text-white'
                            }">${ticket.status}</span>
                        </div>
                        <div class="mt-4 flex gap-2">
                            <button onclick="location.href='/tickets/${ticket.id}'" class="btn-primary">View Details</button>
                            ${ticket.status === 'open' ? `
                                <button onclick="closeTicket(${ticket.id})" class="btn-secondary">Close Ticket</button>
                            ` : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
        res.send(renderTemplate(content, `${statusTitle} - Tasha`, req.user));
    } catch (error) {
        console.error('Error loading tickets:', error);
        res.status(500).send('Error loading tickets');
    }
});

app.get('/tickets/:id', isAuthenticated, async (req, res) => {
    console.log('Fetching details for ticket ID:', req.params.id);
    try {
        const ticket = await TicketThread.getById(req.params.id);

        if (!ticket) {
            console.error('Ticket not found:', req.params.id);
            return res.status(404).send('Ticket not found');
        }

        const messages = await TicketThread.getMessages(req.params.id);
        const tags = await TicketTags.getConfiguredTags() || [];
        const ticketTags = await TicketTags.getTagsForTicket(ticket.id) || [];

        console.log('Ticket details retrieved:', ticket);

        const content = `
            <div class="bg-discord-dark rounded-lg shadow-sm p-6 mb-6">
                <div class="flex justify-between items-start">
                    <div>
                        <h1 class="text-2xl font-semibold mb-2">Ticket #${ticket.id}</h1>
                        <p class="text-gray-400">Opened by ${ticket.discord_username}</p>
                        <p class="text-gray-400">Category: ${ticket.category}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${
                        ticket.status === 'open' ? 'bg-discord-green text-black' : 'bg-discord-red text-white'
                    }">${ticket.status}</span>
                </div>
            </div>
            <div class="bg-discord-dark rounded-lg shadow-sm p-6 mb-6">
                <h3 class="text-lg font-medium mb-4">Tags</h3>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${tags.map(tag => {
                        const isActive = ticketTags.includes(tag.name);
                        return `
                            <button 
                                type="button"
                                data-tag="${tag.name}"
                                class="tag-btn px-3 py-1 rounded-full text-sm transition-all duration-200"
                                style="background-color: ${isActive ? tag.color : '#666'}20; 
                                       color: ${isActive ? tag.color : '#666'}; 
                                       border: 1px solid ${isActive ? tag.color : '#666'}40">
                                ${tag.name}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="bg-discord-dark rounded-lg shadow-sm p-6 mb-6">
                <div class="space-y-4 mb-6 h-96 overflow-y-auto" id="messageContainer">
                    ${messages.map(msg => `
                        <div class="flex ${msg.is_staff ? 'justify-end' : 'justify-start'}">
                            <div class="flex items-start gap-3">
                                ${!msg.is_staff ? `
                                    <img src="https://cdn.discordapp.com/avatars/${ticket.discord_user_id}/${msg.avatar || 'default'}.png" 
                                         class="w-8 h-8 rounded-full" 
                                         onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"
                                    >
                                ` : ''}
                                <div class="message-bubble ${msg.is_staff ? 'staff' : 'user'}">
                                    <p class="text-sm font-medium">${msg.username}</p>
                                    <p class="text-gray-300">${msg.content}</p>
                                    <p class="text-xs text-gray-500 mt-1">${formatDate(msg.timestamp)}</p>
                                </div>
                                ${msg.is_staff ? `
                                    <img src="https://cdn.discordapp.com/avatars/${msg.user_id}/${msg.avatar || 'default'}.png"
                                         class="w-8 h-8 rounded-full"
                                         onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"
                                    >
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${ticket.status === 'open' ? `
                    <form id="replyForm" class="mt-4">
                        <div class="flex gap-2">
                            <input type="text" 
                                   id="replyContent" 
                                   class="flex-1 bg-discord-darker border-discord-dark text-gray-100 rounded-md focus:ring-discord-blurple focus:border-discord-blurple"
                                   placeholder="Type your reply...">
                            <button type="submit" class="btn-primary">Send Reply</button>
                        </div>
                    </form>
                ` : ''}
            </div>
            <script>
                const ticketId = ${ticket.id};
                const replyForm = document.getElementById('replyForm');
                const messageContainer = document.getElementById('messageContainer');

                // Tag functionality
                document.querySelectorAll('.tag-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const tag = btn.dataset.tag;
                        console.log('Tag clicked:', tag);
                        try {
                            const response = await fetch(\`/tickets/\${ticketId}/tags\`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ tag })
                            });
                            if (response.ok) {
                                console.log('Tag toggled:', tag);
                                btn.classList.toggle('active');
                            } else {
                                console.error('Failed to toggle tag:', tag);
                            }
                        } catch (error) {
                            console.error('Error toggling tag:', error);
                        }
                    });
                });

                // Existing reply form handler
                if (replyForm) {
                    replyForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const content = document.getElementById('replyContent').value;
                        console.log('Reply submitted:', content);
                        
                        try {
                            const response = await fetch(\`/tickets/\${ticketId}/reply\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                    message: content,
                                    staffId: '${req.user.id}'
                                })
                            });

                            if (response.ok) {
                                console.log('Reply sent successfully');
                                location.reload();
                            } else {
                                console.error('Failed to send reply');
                            }
                        } catch (error) {
                            console.error('Error sending reply:', error);
                        }
                    });
                }
            </script>
        `;
        res.send(renderTemplate(content, `Ticket #${ticket.id} - Tasha`, req.user));
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).send('Error fetching ticket details');
    }
});

app.post('/tickets/:id/close', isAuthenticated, async (req, res) => {
    console.log('Closing ticket ID:', req.params.id);
    try {
        const ticketId = req.params.id;
        const ticket = await TicketThread.getById(ticketId);
        
        await TicketThread.closeTicket(ticketId);
        console.log('Ticket status updated to closed:', ticketId);
        
        const ticketChannel = client.channels.cache.get(config.ticketChannelId);
        const thread = await ticketChannel.threads.fetch(ticket.thread_id);
        if (thread) {
            await thread.send({
                embeds: [{
                    color: 0xff0000,
                    title: '🔒 Ticket Closed',
                    description: 'This ticket has been closed by a staff member.',
                    timestamp: new Date()
                }]
            });
            await thread.setLocked(true);
            await thread.setArchived(true);
            console.log('Discord thread locked and archived for ticket:', ticketId);
        }
        
        await TicketThread.addMessage(ticketId, req.user.id, req.user.username, 'Ticket closed by staff.', true);
        console.log('Closed ticket message added:', ticketId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error closing ticket:', error);
        res.status(500).json({ error: 'Failed to close ticket' });
    }
});

app.post('/tickets/:id/assign', isAuthenticated, async (req, res) => {
    console.log('Assigning ticket ID:', req.params.id, 'to staff ID:', req.user.id);
    try {
        const staffId = req.user.id;
        await TicketThread.assignTicket(req.params.id, staffId);
        console.log(`Ticket ${req.params.id} assigned to staff ${staffId}`);
        
        const ticket = await TicketThread.getById(req.params.id);
        const thread = await client.channels.cache.get(config.ticketChannelId).threads.fetch(ticket.thread_id);
        if (thread) {
            await thread.send({
                embeds: [{
                    color: 0x57F287,
                    description: `This ticket has been assigned to <@${staffId}>`
                }]
            });
            console.log('Assignment message sent to Discord thread for ticket:', req.params.id);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({ error: 'Failed to assign ticket' });
    }
});

app.post('/tickets/:id/reply', isAuthenticated, async (req, res) => {
    console.log('Replying to ticket ID:', req.params.id, 'Message:', req.body.message);
    try {
        const staffMember = req.user;
        const { message, embedData } = req.body;

        await TicketThread.addMessage(req.params.id, staffMember.id, staffMember.username, message, true);
        console.log('Reply message added to ticket:', req.params.id);

        const ticket = await TicketThread.getById(req.params.id);
        const thread = await client.channels.cache.get(config.ticketChannelId).threads.fetch(ticket.thread_id);
        if (thread) {
            const embed = {
                color: 0x5865f2,
                author: {
                    name: staffMember.username,
                    icon_url: `https://cdn.discordapp.com/avatars/${staffMember.id}/${staffMember.avatar}.png`
                },
                thumbnail: {
                    url: `https://cdn.discordapp.com/avatars/${staffMember.id}/${staffMember.avatar}.png`
                },
                description: message,
                ...embedData,
                timestamp: new Date()
            };
            await thread.send({ embeds: [embed] });
            console.log('Reply embed sent to Discord thread for ticket:', req.params.id);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

app.post('/tickets/:id/tags', isAuthenticated, async (req, res) => {
    console.log('Updating tags for ticket ID:', req.params.id, 'Tag:', req.body.tag);
    try {
        const { tag } = req.body;
        const ticketId = req.params.id;
        await TicketTags.addTags(ticketId, [tag]);
        console.log('Tag added to ticket:', ticketId, 'Tag:', tag);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating tags:', error);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

app.listen(3000, () => {
    console.log('Ticket panel server started on port 3000');
});