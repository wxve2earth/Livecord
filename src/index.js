process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

import { config } from './config.js';
import { startBot } from './bot.js';
import { startServer } from './server.js';
import { attachSocket } from './socket.js';

await startBot();
const server = await startServer(config.port);
attachSocket(server);