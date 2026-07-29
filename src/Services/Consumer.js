module.exports = (channel) => {
    channel.consume(process.env.QUEUE_NAME, (msg) => {
        if (msg === null) return

        const data = JSON.parse(msg.content.toString());
        console.log(` [Consumer] Pesan diambil dari Queue:`, data);

        channel.ack(msg);
    });
}