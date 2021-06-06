#!/usr/bin/env bash

# TODO: get port env variable and if not fallback to 9999
PORT=3002


# video and audio
# ffmpeg -f v4l2 -video_size 640x480 -framerate 25 -i /dev/video0 -f alsa -ar 44100 -ac 2 -i hw:0 -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 -codec:a mp2 -b:a 128k -muxdelay 0.001 http://127.0.0.1:3002

# TODO: only video and make it with less frame-rate - once a second
ffmpeg -f v4l2 -video_size 640x480 -framerate 25 -i /dev/video0 -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 -muxdelay 0.001 http://127.0.0.1:3002