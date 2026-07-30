const express = require('express');
const machineMiddleware = require('../Middlewares/Machine');

const route = express.Router();

route.post('/', machineMiddleware, (req, res) => {
    const { name, type, content, workspaceId } = req.body;

    if (!name) {
        return res.status(400).json({
            message: 'Name is required',
        });
    }

    if (!type) {
        return res.status(400).json({
            message: 'Type is required',
        });
    }

    const allowedType = ['md', 'txt', 'json']

    if (!allowedType.includes(type)) {
        return res.status(400).json({
            message: 'Allowed type is md, text, json'
        })
    }

    if (!content) {
        return res.status(400).json({
            message: 'Content is required',
        });
    }

    if (!workspaceId) {
        return res.status(400).json({
            message: 'Workspace ID is required',
        });
    }

    const filename = `${name}-${crypto.randomUUID()}.${type}`;

    const channel = req.app.get('channel');

     const payload = {
        title: 'Create file into workspace',
        data: {
            filename,
            content,
            workspaceId
        },
        timestamp: new Date().toLocaleTimeString()
    };

    channel.sendToQueue(
        'document',
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );
    
    return res.status(200).json({
        message: 'File creation task has been queued up.',
    });
});

module.exports = route;
