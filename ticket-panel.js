const express = require('express');
const { TicketThread } = require('./ticket-thread.js');
const { TicketTags } = require('./ticket-tags.js');

const app = express();

app.get('/tickets', async (req, res) => {
    const tickets = await TicketThread.getAll();
    res.json(tickets);
});

app.get('/tickets/:id', async (req, res) => {
    const ticket = await TicketThread.getById(req.params.id);
    res.json(ticket);
});

app.post('/tickets/:id/reply', async (req, res) => {
    const { message, staffId } = req.body;
    const ticket = await TicketThread.replyToTicket(req.params.id, message, staffId);
    res.json(ticket);
});

app.post('/tickets/:id/assign', async (req, res) => {
    const { staffId } = req.body;
    const ticket = await TicketThread.assignTicket(req.params.id, staffId);
    res.json(ticket);
});

app.post('/tickets/:id/close', async (req, res) => {
    const ticket = await TicketThread.closeTicket(req.params.id);
    res.json(ticket);
});

app.post('/tickets/:id/tags', async (req, res) => {
    const { tags } = req.body;
    const ticket = await TicketTags.addTags(req.params.id, tags);
    res.json(ticket);
});

app.listen(3000, () => {
    console.log('Ticket panel server started on port 3000');
});