import db from './database.js';
import config from './config.js';

export class TicketTags {
    static async addTags(ticketId, tags) {
        const validTags = tags.filter(tag => 
            config.ticketTags.some(t => t.name === tag)
        );
        
        return new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS ticket_tags (
                    ticket_id INTEGER,
                    tag_name TEXT,
                    PRIMARY KEY (ticket_id, tag_name),
                    FOREIGN KEY(ticket_id) REFERENCES tickets(id)
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const stmt = db.prepare(
                    'INSERT OR REPLACE INTO ticket_tags (ticket_id, tag_name) VALUES (?, ?)'
                );
                
                validTags.forEach(tag => {
                    stmt.run(ticketId, tag);
                });
                
                stmt.finalize();
                resolve(validTags);
            });
        });
    }

    static async getTagsForTicket(ticketId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT tag_name FROM ticket_tags WHERE ticket_id = ?',
                [ticketId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows.map(row => row.tag_name));
                    }
                }
            );
        });
    }

    static getConfiguredTags() {
        return config.ticketTags;
    }
}