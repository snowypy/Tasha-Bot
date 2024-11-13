// ticket-panel.js
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
const config = require('./config.js');
import { TicketThread } from './ticket-thread.js';
import { TicketTags } from './ticket-tags.js';
import { isAuthenticated } from './middleware/auth.js';
import './auth.js';

const app = express();

// Determine if the app is running in production
const isProduction = process.env.NODE_ENV === 'production';



// Trust the first proxy if behind one (e.g., Heroku, Nginx)
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
    secret: 'your-secure-session-secret', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction, // Ensures the browser only sends the cookie over HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    console.log('Deserializing user:', obj);
    done(null, obj);
});


// Render template function
const renderTemplate = (content, title = 'Tasha Ticket Panel', user = null) => `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/js/ticket-tags.js"></script>
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
    <script src="/js/main.js"></script>
</body>
</html>
`;

// Format date function
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
};

// Auth routes
app.get('/auth/discord', (req, res, next) => {
    console.log('Initiating Discord authentication');
    passport.authenticate('discord')(req, res, next);
});

app.get('/auth/discord/callback', 
    passport.authenticate('discord', {
        failureRedirect: '/auth/discord'
    }), 
    (req, res) => {
        console.log('Authentication successful for user:', req.user);
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { 
            console.error('Error during logout:', err);
            return res.status(500).send('Error logging out');
        }
        console.log('User logged out:', req.user);
        res.redirect('/');
    });
});

// Protected routes
app.get('/', isAuthenticated, (req, res) => {
    console.log('Accessing dashboard for user:', req.user);
    const content = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/tickets?status=open" class="ticket-card">
                <h3>Open Tickets</h3>
                <div class="icon">📬</div>
            </a>
            <a href="/tickets?status=closed" class="ticket-card">
                <h3>Closed Tickets</h3>
                <div class="icon">📪</div>
            </a>
            <a href="/tickets?status=unassigned" class="ticket-card">
                <h3>Unassigned Tickets</h3>
                <div class="icon">📥</div>
            </a>
            <a href="/tickets?status=mine" class="ticket-card">
                <h3>Your Tickets</h3>
                <div class="icon">👤</div>
            </a>
        </div>
    `;
    res.send(renderTemplate(content, 'Dashboard', req.user));
});

app.get('/tickets', isAuthenticated, async (req, res) => {
    console.log('Fetching tickets with status:', req.query.status);
    const { status } = req.query;
    let tickets;
    let statusTitle;

    try {
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

        // Fetch tags for each ticket
        for (const ticket of tickets) {
            ticket.tags = await TicketTags.getTagsForTicket(ticket.id);
        }

        console.log(`Retrieved ${tickets.length} tickets for status: ${statusTitle}`);

        const tagColors = config.ticketTags.reduce((acc, tag) => {
            acc[tag.name] = tag.color;
            return acc;
        }, {});

        const content = `
            <h1 class="text-2xl font-semibold mb-6">${statusTitle}</h1>
            <div class="grid gap-6">
                ${tickets.map(ticket => `
                    <div class="bg-discord-dark shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-medium">${ticket.category} - ${ticket.discord_username}</h3>
                                <p class="text-gray-400">Opened: ${TicketThread.formatDate(ticket.created_at)}</p>
                                <!-- Display tags -->
                                <div class="flex flex-wrap gap-2 mt-2">
                                    ${ticket.tags.map(tag => `
                                        <span 
                                            class="tag-btn active"
                                            style="background-color: ${tagColors[tag]}20; color: ${tagColors[tag]}; border: 1px solid ${tagColors[tag]}40">
                                            ${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm ${
                                ticket.status === 'open' ? 'bg-discord-green text-black' : 'bg-discord-red text-white'
                            }">${ticket.status}</span>
                        </div>
                        <div class="mt-4 flex gap-2">
                            <button onclick="location.href='/tickets/${ticket.id}'" 
                                    class="btn-primary">
                                View Details
                            </button>
                            ${ticket.status === 'open' ? `
                                <button onclick="closeTicket(${ticket.id})" 
                                        class="btn-secondary">
                                    Close Ticket
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
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
        const messages = await TicketThread.getMessages(req.params.id);
        const tags = await TicketTags.getConfiguredTags();
        const ticketTags = await TicketTags.getTagsForTicket(ticket.id);

        const tagColors = config.ticketTags.reduce((acc, tag) => {
            acc[tag.name] = tag.color;
            return acc;
        }, {});

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
                    ${tags.map(tag => `
                        <button 
                            type="button"
                            data-tag="${tag.name}"
                            class="tag-btn px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                                ticketTags.includes(tag.name) ? 'active' : ''
                            }"
                            style="${ticketTags.includes(tag.name) ? 
                                `background-color: ${tagColors[tag.name]}20; color: ${tagColors[tag.name]}; border: 1px solid ${tagColors[tag.name]}40` : ''
                            }"
                        >
                            ${tag.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="bg-discord-dark rounded-lg shadow-sm p-6 mb-6">
                <div class="space-y-4 mb-6 h-96 overflow-y-auto" id="messageContainer">
                    ${messages.map(msg => `
                        <div class="flex ${msg.is_staff ? 'justify-end' : 'justify-start'} items-start">
                            ${!msg.is_staff ? `
                                <img src="${msg.avatar_url}" alt="${msg.username}" class="w-8 h-8 rounded-full mr-2">
                            ` : ''}
                            <div class="message-bubble ${msg.is_staff ? 'staff' : 'user'}">
                                <p class="text-sm font-medium">${msg.username}</p>
                                <p class="text-gray-300">${msg.content}</p>
                                <p class="text-xs text-gray-500 mt-1">${TicketThread.formatDate(msg.timestamp)}</p>
                            </div>
                            ${msg.is_staff ? `
                                <img src="${msg.avatar_url}" alt="${msg.username}" class="w-8 h-8 rounded-full ml-2">
                            ` : ''}
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

                // Tag functionality
                const tagColors = ${JSON.stringify(tagColors)};

                document.querySelectorAll('.tag-btn').forEach(btn => {
                    const tag = btn.dataset.tag;
                    if (btn.classList.contains('active')) {
                        btn.style.backgroundColor = \`\${tagColors[tag]}20\`;
                        btn.style.color = tagColors[tag];
                        btn.style.border = \`1px solid \${tagColors[tag]}40\`;
                    } else {
                        btn.style.backgroundColor = '#555';
                        btn.style.color = '#888';
                        btn.style.border = '1px solid #444';
                    }

                    btn.addEventListener('click', async () => {
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
                                if (btn.classList.contains('active')) {
                                    btn.style.backgroundColor = \`\${tagColors[tag]}20\`;
                                    btn.style.color = tagColors[tag];
                                    btn.style.border = \`1px solid \${tagColors[tag]}40\`;
                                } else {
                                    btn.style.backgroundColor = '#555';
                                    btn.style.color = '#888';
                                    btn.style.border = '1px solid #444';
                                }
                            } else {
                                console.error('Failed to toggle tag:', tag);
                            }
                        } catch (error) {
                            console.error('Error toggling tag:', error);
                        }
                    });
                });

                // Reply form handler
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
        console.error('Error loading ticket details:', error);
        res.status(500).send('Error loading ticket details');
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
                description: message,
                ...embedData
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
        await TicketTags.toggleTag(ticketId, tag);
        console.log('Tag toggled for ticket:', ticketId, 'Tag:', tag);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating tags:', error);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

app.listen(3000, () => {
    console.log('Ticket panel server started on port 3000');
});