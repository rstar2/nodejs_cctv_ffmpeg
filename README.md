## Used Technologies

1. FFmpeg for webcam-capture and streaming to a listening HTTP server (e.g. on 8888 port)

```bash
$ ffmpeg -f v4l2 \
             -video_size 640x480 -framerate 25 -i /dev/video0 \
         -f alsa
             -ar 44100 -ac 2 -i hw:0 \
         -f mpegts \
             -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
             -codec:a mp2 -b:a 128k \
             -muxdelay 0.001 \
         http://127.0.0.1:8888
```

Here most important are the output format for MPEG-TS demuxer, MPEG1 video & MP2 audio decoders 
 (which is what later JSMpeg is able to decode)

1. Streaming HTTP server that:
  2.1. Simple HTTP Node.js server that listens on 8888 and receives the data sent from ffmpeg
  2.2. Plain Websocket server that listens to client connections and broadcast the incoming stream data to connected clients

1. Single HTTP server for just serving the client UI (could use whatever solution here - static hosting , serverless, etc...)
1. Client that uses JSMpeg.js to connect to the Websocket server and render the incoming video/audio stream (on a CANVAS element)

## List video devices

1. To list the supported, connected capture devices you can use the v4l-ctl tool:

```bash
$ v4l2-ctl --list-devices
```

1. To list available formats (supported pixel formats, video formats, and frame sizes) for a particular input device:

```bash
$ ffmpeg -f v4l2 -list_formats all -i /dev/video0
```

## FFMPEG readme

### Capture Webcam

```bash
$ ffmpeg -f v4l2 -framerate 25 -video_size 640x480 -i /dev/video0 output.mkv
```

or simpler

```bash
$ ffmpeg -f v4l2 -r 25 -s 640x480 -i /dev/video0 output.mp4
```

### Capture video and audio

```bash
$ ffmpeg -f v4l2 -r 25 -s 640x480 -i /dev/video0 -f alsa -i hw:0 -acodec aac -ac 2 -ab 32k -ar 44100 -f mpegts output.mp4
```

Where: 
``` -f v4l2 -r 25 -s 640x480 -i /dev/video0 ``` is for video input

``` -f alsa -i hw:0 -acodec aac -ac 2 -ab 32k -ar 44100 ``` is for audio

``` -f mpegts ``` will be packed into video and audio MPEG transport stream

## Run

### With running 'ffmpeg capturing' internally from the streaming server only when a client is connected 

> Start the UI-server and the re-streaming server: ```npm run start```

### With running 'ffmpeg capturing' constantly - set env variable INTERNAL_FFMPEG_PROCESS=false

> Start the UI-server, the re-streaming server and the ffmpeg-capturing: ```npm run start-no-internal``` or run each server individually
