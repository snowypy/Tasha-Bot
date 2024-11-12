// panel/routes/tickets.js

const express = require('express');
const { Ticket, StaffMember } = require('../../bot/models/ticket');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const tickets = await Ticket.findAll({ where: { userId: req.user.id } });

    res.render('panel', { user: req.user, tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).send('An error occurred while fetching your tickets.');
  }
});

router.post('/close/:id', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  ticket.status = 'closed';
  await ticket.save();
  res.json({ success: true });
});

router.post('/assign/:id', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  ticket.assignedTo = req.body.staffId;
  await ticket.save();
  res.json({ success: true });
});

router.post('/reply/:id', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  // Add reply logic here using Discord.js
  res.json({ success: true });
});

module.exports = router;
