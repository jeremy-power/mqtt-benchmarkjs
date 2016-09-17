# MQTT Benchmark library

Follow the instruction benchmark setup on this doc http://www.scalagent.com/IMG/pdf/Benchmark_MQTT_servers-v1-1.pdf

## Todo
* [x] First working version
* [x] Document clearly command param and usage
* [x] Build standalone running script. Download the usage without required for install `node_modules`

## Commandline usage

Example command: 
```
node mqtt-bm.js --host="127.0.0.1" --login="test" --password="test" \
  --topic=t1
  --numPub=1000
  --numSub=1
```