const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.js');
const { TicketThread } = require('./ticket-thread.js');
const { TicketTags } = require('./ticket-tags.js');

const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.login(config.discordToken);

const renderTemplate = (content, title = 'Tasha Ticket Panel') => `
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

app.use(express.static('public'));
app.use(express.json());

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
};

app.get('/', (req, res) => {
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
    res.send(renderTemplate(content));
});

app.get('/tickets', async (req, res) => {
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
            tickets = await TicketThread.getTicketsForStaff(req.staffId);
            statusTitle = 'Your Tickets';
        } else {
            tickets = await TicketThread.getAll();
            statusTitle = 'All Tickets';
        }

        const content = `
        <h1 class="text-2xl font-semibold mb-6">${statusTitle}</h1>
        <div class="grid gap-6">
            ${tickets.map(ticket => `
                <div class="bg-discord-dark shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-medium">${ticket.category} - ${ticket.discord_username}</h3>
                            <p class="text-gray-400">Opened: ${formatDate(ticket.created_at)}</p>
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
    res.send(renderTemplate(content, `${statusTitle} - Tasha`));
    } catch (error) {
        res.status(500).send('Error loading tickets');
    }
});

app.get('/tickets/:id', async (req, res) => {
    try {
        const ticket = await TicketThread.getById(req.params.id);
        const messages = await TicketThread.getMessages(req.params.id);
        const tags = await TicketTags.getConfiguredTags();
        const ticketTags = await TicketTags.getTagsForTicket(ticket.id);
        
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
                        style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40">
                        ${tag.name}
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="bg-discord-dark rounded-lg shadow-sm p-6 mb-6">
            <div class="space-y-4 mb-6 h-96 overflow-y-auto" id="messageContainer">
                ${messages.map(msg => `
                    <div class="flex ${msg.is_staff ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[70%] ${msg.is_staff ? 'bg-discord-blurple bg-opacity-20' : 'bg-discord-darker'} rounded-lg p-3">
                            <p class="text-sm font-medium">${msg.username}</p>
                            <p class="text-gray-300">${msg.content}</p>
                            <p class="text-xs text-gray-500 mt-1">${formatDate(msg.timestamp)}</p>
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
                    try {
                        const response = await fetch(\`/tickets/\${ticketId}/tags\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tag })
                        });
                        if (response.ok) {
                            btn.classList.toggle('active');
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
                    
                    try {
                        const response = await fetch(\`/tickets/\${ticketId}/reply\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                message: content,
                                staffId: 'staff-member-id'
                            })
                        });

                        if (response.ok) {
                            location.reload();
                        }
                    } catch (error) {
                        console.error('Error sending reply:', error);
                    }
                });
            }
        </script>
    `;
    res.send(renderTemplate(content, `Ticket #${ticket.id} - Tasha`));
    } catch (error) {
        res.status(500).send('Error loading ticket details');
    }
});

app.post('/tickets/:id/close', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await TicketThread.getById(ticketId);
        
        await TicketThread.closeTicket(ticketId);
        
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
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error closing ticket:', error);
        res.status(500).json({ error: 'Failed to close ticket' });
    }
});

app.post('/tickets/:id/assign', async (req, res) => {
    const staffId = req.user.id;
    await TicketThread.assignTicket(req.params.id, staffId);
    
    const thread = await getTicketThread(req.params.id);
    await thread.send({
        embeds: [{
            color: 0x57F287,
            description: `This ticket has been assigned to <@${staffId}>`
        }]
    });
    
    res.json({ success: true });
});

app.post('/tickets/:id/reply', async (req, res) => {
    const staffMember = req.user;
    const { message, embedData } = req.body;
    
    await TicketThread.addMessage(ticketId, staffMember.id, staffMember.username, message, true);
    
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
});

app.listen(3000, () => {
    console.log('Ticket panel server started on port 3000');
});