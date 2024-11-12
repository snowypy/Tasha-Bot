const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tickets.db');

db.serialize(() => {
    // Create tickets table
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_user_id TEXT NOT NULL,
            discord_username TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            assignee TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // Create messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_staff BOOLEAN,
            FOREIGN KEY(ticket_id) REFERENCES tickets(id)
        )
    `);

    // Create index
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id 
        ON ticket_messages(ticket_id)
    `);
});

module.exports = db;