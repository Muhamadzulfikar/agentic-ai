const fs = require('fs/promises');
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');

module.exports = async (channel, storage) => {
    await channel.assertQueue('document', { durable: true });

    channel.consume('document', async (msg) => {
        if (!msg) return

        try {
            const payload = JSON.parse(msg.content.toString());
            const { filepath, content } = payload;

            const target = path.join(process.cwd(), 'Storage', filepath);
            const file = await fs.writeFile(target, content);

            storage.fputObject(process.env.S3_OBJECT, filepath, file);

            db.prepare(`
                    INSERT INTO documents (
                        workspace_id,
                        name,
                        filepath
                    ) VALUES (?, ?, ?)
                `).run(workspaceId, name, filepath);

            channel.ack(msg);
        } catch (error) {
            console.error('Cannot create document', error.message);
            channel.nack(msg, false, false)
        }
    });
}