import { config } from './config.js';
import { startBot } from './bot.js';
import { startServer } from './server.js';
import { attachSocket } from './socket.js';
import { events } from './state.js';

events.on('update', (id, data) => {
  console.log(`state updated: ${id} (${data.discord_status})`);
});

await startBot();
const server = await startServer(config.port);
attachSocket(server);

console.log(`Users are available at ${config.publicUrl}/v1/users/<discord id>`);
console.log(`Live updates at ${config.publicUrl.replace(/^http/, 'ws')}/socket`);