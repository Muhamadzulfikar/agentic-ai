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
            const { filepath, name, content, workspaceId } = payload;

            const target = path.join(process.cwd(), 'Storages', filepath);
            await fs.writeFile(target, content);

            await storage.fPutObject(process.env.S3_BUCKET, filepath, target);
            
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