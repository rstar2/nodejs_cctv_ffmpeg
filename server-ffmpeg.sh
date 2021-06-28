#!/usr/bin/env bash

PORT="${PORT_STREAM:-9999}"

# wait max 20 secs (-t 20) for the server 127.0.0.1:8888 to be available
# and ONLY then (-s) execute the subcommand (-- COMMAND ARGS)
./wait-for-it.sh -s -t 20 127.0.0.1:$PORT -- ./ffmpeg-webcapture-stream.sh
