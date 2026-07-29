const amqp = require('amqplib');

module.exports = async () => {
  try {
    const connection = await amqp.connect(process.env.RabbitMQ_URL);
    const channel = await connection.createChannel();

    const CONCURRENT_LIMIT = 1;
    channel.prefetch(CONCURRENT_LIMIT);

    console.log(' [✓] RabbitMQ Connected');

    return channel

  } catch (error) {
    console.error(' [x] Failed connect to RabbitMQ:', error.message);
  }
};