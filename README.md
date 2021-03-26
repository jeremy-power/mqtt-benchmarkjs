# MQTT Benchmark library

Follow the instruction benchmark setup on this doc http://www.scalagent.com/IMG/pdf/Benchmark_MQTT_servers-v1-1.pdf

## Todo
* [x] First working version
* [x] Document clearly command param and usage
* [x] Build standalone running script. Download the usage without required for install `node_modules`

## Commandline usage

Example command: 
```
numPubSub (int): number of publisher and subscriber pairs
rate (float): number of messages per second approximately by exponential randomness

node mqtt-bm.js --host="127.0.0.1"  --numPubSub=10 --rate=1

optional parameters:
limitLogging (boolean): limits number of messages sent logging to every 5 seconds for long duration logging
timeout (int): number of seconds before the program will automatically end and report (off by default, will run infinitely until cancelled)

node mqtt-bm.js --host="127.0.0.1"  --numPubSub=10 --rate=1 --timeout=60 --limitLogging=1
```
