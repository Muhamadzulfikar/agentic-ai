const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');

module.exports = (req, res, next) => {
    const { key, appName, url } = req.headers;

    const privateKey = key + appName + url;

    const hashedKey = crypto
        .createHash('sha256')
        .update(privateKey)
        .digest('hex');

    const validate = db.prepare(`SELECT EXISTS
        (SELECT 1 FROM machines WHERE hashed_key = ?)
    `).get(hashedKey);


    if (!validate) {
        return res.status(401).json({ message: 'API key is not valid' });
    }

    req.hashedKey = hashedKey;

    next();
}