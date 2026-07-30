const path = require('path');
const fs = require('fs/promises');

module.exports = async (channel) => {
    const processQueue = 'destroyLocalFile';
    const exchange = 'destroyLocalFileExchange';
    const waitQueue = 'destroyLocalFileWait';
    const routingKey = 'destroyLocalFileRouting';

    await channel.assertExchange(exchange, 'direct', { durable: true });

    await channel.assertQueue(processQueue, { durable: true });
    await channel.bindQueue(processQueue, exchange, routingKey);

    await channel.assertQueue(waitQueue, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': exchange,
            'x-dead-letter-routing-key': routingKey,
            'x-message-ttl': 30 * 24 * 60 * 60 * 1000 // 30 day
        }
    });

    channel.consume(processQueue, async (msg) => {
        if (!msg) return;

        try {
            const payload = JSON.parse(msg.content.toString());
            const { filepath } = payload;

            const target = path.join(process.cwd(), 'Storage', filepath);

            await fs.unlink(target);

            channel.ack(msg);

        } catch (error) {
            console.error('Cannot destroy local file', error.message);
            channel.nack(msg, false, false);
        }
    });
};
