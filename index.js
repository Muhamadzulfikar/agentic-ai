const express = require('express');
const cors = require('cors');
const { default: helmet } = require('helmet');

const migrate = require('./src/Migrations/Migrate');
const RabbitMQ = require('./src/Services/RabbitMQ');
const job = require('./src/Jobs/Job');
const s3 = require('./src/Services/Minio');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.disable('x-powered-by');
require('dotenv').config();
migrate();

const port = process.env.PORT;

const registerRoutes = require('./src/Routes/Register');
const workspaceRoutes = require('./src/Routes/Workspace');
const chatRoutes = require('./src/Routes/Chat');
const documentRoutes = require('./src/Routes/Document');

app.use('/api/registers', registerRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'successfully',
  });
});


async function startServer() {
  try {
    const channel = await RabbitMQ();
    const storage = await s3();
    app.set('channel', channel);
    app.set('storage', storage);

    job(channel, storage);

    app.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();