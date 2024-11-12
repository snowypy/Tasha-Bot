// panel/routes/tickets.js

const express = require('express');
const { Ticket } = require('../../bot/models/ticket');
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

module.exports = router;
