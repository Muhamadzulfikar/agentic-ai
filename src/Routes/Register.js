const express = require('express');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');

const route = express.Router();

route.post('/', async (req, res) => {
    try {
        const { key } = req.headers;
        const {name, url} = req.body;

        if (!key) {
            return res.status(401).json({
                message: 'Token is required'
            })
        }

        const adminKey = crypto.createHash('sha256').update(key).digest('hex');

        if (!safeCompare(adminKey, process.env.ADMIN_KEY)) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        
        if (!name) {
            return res.status(400).json({ message: 'Valid name is required' });
        }

        if (!url) {
            return res.status(400).json({ message: 'Valid URL is required' });
        }

        const { publicKey, hashedKey } = createApiKey();


        const { existKey } = db.prepare(`SELECT EXISTS(SELECT 1 FROM machines WHERE name = ? AND url = ?) AS existKey`)
            .get(name, url);

        if (Boolean(existKey)) {
            return res.status(400).json({
                message: 'Machine Already exist'
            });
        }

    db.prepare('INSERT INTO machines (name, url, hashed_key) VALUES (?, ?, ?)')
        .run(name, url, hashedKey);

        return res.status(200).json({
            message: 'Successfully create machine',
            key: publicKey,
        });

    } catch (error) {
        console.error('Cannot create machine', error.message)
    }
});

function createApiKey() {
    const randomBytes = crypto.randomBytes(32).toString('hex');

    const publicKey = 'sk-' + randomBytes;

    const hashedKey = crypto.createHash('sha256').update(publicKey).digest('hex');

    return { publicKey, hashedKey };
}

function safeCompare(a, b) {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}



module.exports = route;