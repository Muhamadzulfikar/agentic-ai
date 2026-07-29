const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');

const route = express.Router();

route.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required',
        });
    }

    if (email !== process.env.EMAIL && password !== process.env.PASSWORD) {
        return res.status(400).json({
            message: 'Email and Password is not match',
        })
    }

    const token = await createToken({ email, password });
    res.status(200).json({
        message: 'Successfully',
        token: token
    });
});

route.post('/machine/register', async (req, res) => {
    const { token } = req.headers;
    const { name, url } = req.body;

    if (!token) {
        return res.status(401).json({
            message: 'Missing Token',
        });
    }

    const validate = await validateToken(token);

    if (!validate || validate.isExpired) {
        return res.status(401).json({
            message: validate?.isExpired ? 'Token Expired' : 'Unvalided Token',
        });
    }

    const {publicKey, hashedKey} = createApiKey(name, url);

    const statement = db.prepare('INSERT INTO machines (name, url, public_key, hashed_key) VALUES (?, ?, ?, ?)');
    statement.run(name, url, publicKey, hashedKey);

    return res.status(200).json({
        message: 'Successfully',
        key: publicKey,
    });
});

async function createToken(payload) {
    const jwtSignatureKey = process.env.JWT_SIGNATURE_KEY;
    const createToken = jwt.sign(payload, jwtSignatureKey, { expiresIn: '5m' });
    return createToken;
}

async function validateToken(token) {
    const jwtSignatureKey = process.env.JWT_SIGNATURE_KEY;

    try {
        const validate = jwt.verify(token, jwtSignatureKey);
        return validate;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { isExpired: true };
        }
        return null;
    }
}

function createApiKey(name, url, prefix = 'sk-') {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const publicKey = prefix+randomBytes;

  const privateKey = publicKey+name+url;

  const hashedKey = crypto
    .createHash('sha256')
    .update(privateKey)
    .digest('hex');

  return { publicKey, hashedKey };
}



module.exports = route;