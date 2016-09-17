# MQTT Benchmark library

Follow the instruction benchmark setup on this doc http://www.scalagent.com/IMG/pdf/Benchmark_MQTT_servers-v1-1.pdf

## Todo
* [ ] First working version
* [ ] Document clearly command param and usage

## Commandline usage

Example command: 
```
mqtt_bmjs --broker-url="127.0.0.1" --login="test" --password="test" \
  --topic-list=t1,t2,t3,t4,t5
  --num-pub=1000
  --num-sub=1
  --num-message
```

## Json config file usage
