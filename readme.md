# File Structure

```yaml
/ticket-bot/
│
├── bot/
│   ├── bot.js                // Main bot logic
│   ├── commands/             // Folder for bot commands
│   └── models/               // Sequelize models for SQLite
│       └── ticket.js         // Ticket model schema
│
├── panel/
│   ├── views/                // Folder for EJS templates
│   │   ├── panel.ejs         // Web panel where users view tickets
│   │   └── transcript.ejs    // Ticket transcript view
│   └── routes/               // API routes for ticket interactions
│       ├── auth.js           // OAuth2 Discord authentication
│       └── tickets.js        // Routes to handle tickets (reply, close, etc.)
│
├── public/                   // Static resources (CSS, JS)
│   └── style.css             // Styling for the web panel
│
├── config.json               // Config file for tokens, SQLite path
├── index.js                  // Main entry point, starts both bot and web server
├── database.sqlite           // SQLite database file (automatically generated)
└── package.json              // Dependencies
```