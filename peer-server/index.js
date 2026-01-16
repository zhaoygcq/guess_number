const { PeerServer } = require('peer');

const PORT = process.env.PORT || 9000;
const PATH = '/guess-number';

const peerServer = PeerServer({
  port: PORT,
  path: PATH,
  allow_discovery: true,
  proxied: true // Set to true if running behind Nginx/Apache/Cloudflare
});

console.log(`
  🚀 PeerServer is running!
  --------------------------
  Port: ${PORT}
  Path: ${PATH}
  --------------------------
  
  Client Config:
  {
    host: 'localhost', // or your server IP
    port: ${PORT},
    path: '${PATH}'
  }
`);

peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});
