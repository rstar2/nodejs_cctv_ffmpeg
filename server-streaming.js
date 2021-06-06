const child_process = require('child_process');

const ws = require('ws');

// here will come the HTTP live stream
const PORT_STREAM = process.env.PORT_STREAM || 8888;

// here a client will connect and receive the broadcasted stream
const PORT_WEBSOCKET = process.env.PORT_WEBSOCKET || 9999;

// whether or not to spawn internally ffmpeg-capturing when needed
const INTERNAL_FFMPEG_PROCESS = process.env.INTERNAL_FFMPEG_PROCESS !== 'false';

const STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

const width = 320,
  height = 240;

/**
 * Created only if INTERNAL_FFMPEG_PROCESS is true
 * @type {child_process.ChildProcess}
 */
let webCapture;

// 1. Websocket Server - that listens for client connections
const socketServer = new ws.Server({ port: PORT_WEBSOCKET });
socketServer.on('connection', (socket) => {
  console.log('New WebSocket Connection (' + socketServer.clients.size + ' total)');

  socket.on('close', (/* code, message */) => {
    console.log('Disconnected WebSocket (' + socketServer.clients.size + ' total)');

    // if this is last client then stop web-capturing
    if (socketServer.clients.size === 0) {
      stopWebCapture();
    }
  });

  // Send magic bytes and video size to the newly connected socket
  // so that client can understand that this is MPEG stream format

  // struct { char magic[4]; unsigned short width, height;}
  const streamHeader = Buffer.alloc(8); // 8 octets
  streamHeader.write(STREAM_MAGIC_BYTES); // 4 octets
  streamHeader.writeUInt16BE(width, 4); // 2 octets
  streamHeader.writeUInt16BE(height, 6); // 2 octets
  socket.send(streamHeader, { binary: true });

  // if this is first client then start web-capturing
  if (socketServer.clients.size === 1) {
    startWebCapture();
  }
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

// 2. HTTP Server to accept incoming MPEG Stream (from FFmpeg for instance)
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

/**
 * Start web-capturing process
 */
function startWebCapture() {
  if (!INTERNAL_FFMPEG_PROCESS) return;

  if (webCapture) {
    console.error('Already started web-capturing process');
  } else {
    console.log('Starting web-capturing process');
    webCapture = child_process.spawn('./ffmpeg-webcapture.sh', { detached: true });
    console.log('Started web-capturing process');

    // webCapture = child_process.exec(
    //   'ffmpeg -f v4l2 -video_size 640x480 -framerate 25 -i /dev/video0 -f alsa -ar 44100 -ac 2 -i hw:0 -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 -codec:a mp2 -b:a 128k -muxdelay 0.001 http://127.0.0.1:8888',
    //   { detached: true }
    // );

    // webCapture = child_process.spawn(
    //   'ffmpeg -f v4l2 -video_size 640x480 -framerate 25 -i /dev/video0 -f alsa -ar 44100 -ac 2 -i hw:0 -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 -codec:a mp2 -b:a 128k -muxdelay 0.001 http://127.0.0.1:8888',
    //   { detached: true }
    // );
  }
}

/**
 * Stop web-capturing process
 */
function stopWebCapture() {
  if (!INTERNAL_FFMPEG_PROCESS) return;

  if (!webCapture) {
    console.error('Already stopped web-capturing process');
  } else {
    console.log('Stopping web-capturing process');

    try {
      // NOTE: this is not working as I guess the there's underlying 'ffmpeg' process started
      // webCapture.kill();
      // so kill the group the process is in
      // https://stackoverflow.com/questions/56016550/node-js-cannot-kill-process-executed-with-child-process-exec/56016614
      // NOTE: It's not just webCapture.pid, but -webCapture.pid ,
      // which instructs process.kill to kill the process group the PID belongs
      // other option is to use 'fkill' module, but no need for now
      process.kill(-webCapture.pid);

      console.log('Stopped web-capturing process');
    } catch (err) {
      console.error('Failed to stop web-capturing process');
    }

    webCapture = undefined;
  }
}

console.log(`INTERNAL_FFMPEG_PROCESS=${INTERNAL_FFMPEG_PROCESS}`);
console.log('Listening for MPEG Stream on http://0.0.0.0:' + PORT_STREAM + '/<width>/<height>');
console.log('Awaiting client WebSocket connections on ws://0.0.0.0:' + PORT_WEBSOCKET + '/');
