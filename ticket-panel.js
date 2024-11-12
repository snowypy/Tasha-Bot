const express = require('express');
const path = require('path');
const { TicketThread } = require('./ticket-thread.js');
const { TicketTags } = require('./ticket-tags.js');

const app = express();

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Helper function to format date
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
};

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tasha Ticket Panel</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body class="bg-gray-100">
            <div class="min-h-screen">
                <nav class="bg-indigo-600 shadow-lg">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center justify-between h-16">
                            <div class="flex items-center">
                                <span class="text-white text-xl font-semibold">Tasha Ticket System</span>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a href="/tickets?status=open" class="ticket-card bg-green-100 hover:bg-green-200">
                            <h3>Open Tickets</h3>
                            <div class="icon">📬</div>
                        </a>
                        <a href="/tickets?status=closed" class="ticket-card bg-red-100 hover:bg-red-200">
                            <h3>Closed Tickets</h3>
                            <div class="icon">📪</div>
                        </a>
                        <a href="/tickets?status=unassigned" class="ticket-card bg-yellow-100 hover:bg-yellow-200">
                            <h3>Unassigned Tickets</h3>
                            <div class="icon">📥</div>
                        </a>
                        <a href="/tickets?status=mine" class="ticket-card bg-blue-100 hover:bg-blue-200">
                            <h3>Your Tickets</h3>
                            <div class="icon">👤</div>
                        </a>
                    </div>
                </main>
            </div>
            <script src="/js/main.js"></script>
        </body>
        </html>
    `);
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

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${statusTitle} - Tasha</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="/css/style.css">
            </head>
            <body class="bg-gray-100">
                <nav class="bg-indigo-600 shadow-lg">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center justify-between h-16">
                            <div class="flex items-center">
                                <a href="/" class="text-white text-xl font-semibold">Tasha Ticket System</a>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <h1 class="text-2xl font-semibold mb-6">${statusTitle}</h1>
                    <div class="grid gap-6">
                        ${tickets.map(ticket => `
                            <div class="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="text-lg font-medium">${ticket.category} - ${ticket.discord_username}</h3>
                                        <p class="text-sm text-gray-500">Opened: ${formatDate(ticket.created_at)}</p>
                                    </div>
                                    <span class="px-3 py-1 rounded-full text-sm ${
                                        ticket.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                </main>
                <script src="/js/main.js"></script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error loading tickets');
    }
});

app.listen(3000, () => {
    console.log('Ticket panel server started on port 3000');
});