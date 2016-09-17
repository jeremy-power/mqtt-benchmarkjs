# MQTT Benchmark library

Follow the instruction benchmark setup on this doc http://www.scalagent.com/IMG/pdf/Benchmark_MQTT_servers-v1-1.pdf

## Todo
* [x] First working version
* [x] Document clearly command param and usage
* [ ] Build standalone running script. Download the usage without required for install `node_modules`

## Commandline usage

Example command: 
```
mqtt_bmjs --host="127.0.0.1" --login="test" --password="test" \
  --topic=t1,t2,t3,t4,t5
  --numPub=1000
  --numSub=1
```

## Json config file usage
