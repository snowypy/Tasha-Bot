const { TextChannel, ThreadChannel } = require('discord.js');
const { TicketTags } = require('./ticket-tags.js');
const config = require('./config.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tickets.db');

db.serialize(() => {
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
});

class TicketThread {
    static async create(client, user, category) {
        const ticketChannel = client.channels.cache.get(config.ticketChannelId);
        const thread = await ticketChannel.threads.create({
            name: `${category.name} - ${user.username}`,
            autoArchiveDuration: 1440, // 24 hours
            reason: `New ticket created by ${user.username}`
        });

        await thread.join();

        await thread.send(`Hello ${user.username}, your ticket in the ${category.name} category has been created. A staff member will be with you shortly.`);

        const stmt = db.prepare('INSERT INTO tickets (discord_user_id, discord_username, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(user.id, user.username, category.name, 'open', new Date().toISOString(), new Date().toISOString());
        stmt.finalize();

        return thread;
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async getOpenTickets() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets WHERE status = ?', ['open'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getClosedTickets() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets WHERE status = ?', ['closed'], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getUnassignedTickets() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets WHERE assignee IS NULL', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getTicketsForStaff(staffId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets WHERE assignee = ?', [staffId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async replyToTicket(id, message, staffId) {
        // Existing code...
    }

    static async assignTicket(id, staffId) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE tickets SET assignee = ? WHERE id = ?', [staffId, id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    static async closeTicket(id) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE tickets SET status = ? WHERE id = ?', ['closed', id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = { TicketThread };