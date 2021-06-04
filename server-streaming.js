const ws = require('ws');

// here will come the HTTP live stream
const PORT_STREAM = process.argv[2] || 8888;

// here a client will connect and receive the broadcasted stream
const PORT_WEBSOCKET = process.argv[3] || 9999;

const STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

const width = 320,
  height = 240;

// 1. Websocket Server - that listens ofr client connections
const socketServer = new ws.Server({ port: PORT_WEBSOCKET });
socketServer.on('connection', (socket) => {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  const streamHeader = Buffer.alloc(8);  // 8 octets
  streamHeader.write(STREAM_MAGIC_BYTES); // 4 octets
  streamHeader.writeUInt16BE(width, 4);   // 2 octets
  streamHeader.writeUInt16BE(height, 6);  // 2 octets 
  socket.send(streamHeader, { binary: true });

  console.log('New WebSocket Connection (' + socketServer.clients.length + ' total)');

  socket.on('close', (/* code, message */) => {
    console.log('Disconnected WebSocket (' + socketServer.clients.length + ' total)');
  });
});

socketServer.broadcast = (data, opts) => {
  // this here is socketServer
  socketServer.clients.forEach((socket) => {
    if (socket.readyState === ws.OPEN) {
      socket.send(data, opts);
    } else {
      console.log('Error: Client (' + socket + ') not connected.');
    }
  });
};

// 2. HTTP Server to accept incoming MPEG Stream
const streamServer = require('http').createServer((request, response) => {
  response.connection.setTimeout(0);

  console.log('Stream Connected - and feeding');

  // on each new data received on the HTTP request as it's a stream :)
  // then broadcast it to all connected clients
  request.on('data', (data) => {
    socketServer.broadcast(data, { binary: true });
  });
});
streamServer.listen(PORT_STREAM);

console.log('Listening for MPEG Stream on http://127.0.0.1:' + PORT_STREAM + '/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + PORT_WEBSOCKET + '/');
