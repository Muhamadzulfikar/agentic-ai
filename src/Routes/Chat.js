const express = require('express');
const crypto = require('crypto');
const machineMiddleware = require('../Middlewares/Machine');

const route = express.Router();

route.post('/', machineMiddleware, async (req, res) => {
    const { instruction, data } = req.body;

    if (!instruction) {
        return res.status(400).json({
            message: 'Instruction is required',
        });
    }

    const jobUuid = crypto.randomUUID();

    const channel = req.app.get('rabbitChannel');

    const payload = {
        id: jobUuid,
        title: 'Execution Task With Claude Code',
        data: {
            instruction,
            data
        },
        timestamp: new Date().toLocaleTimeString()
    };

    channel.sendToQueue(
        process.env.QUEUE_NAME,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );

    return res.status(200).json({
        message: 'Task has been added to queue, claude code will process it soon',
        jobId: jobUuid,
    });
});

module.exports = route;