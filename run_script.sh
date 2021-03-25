#!/bin/bash

echo "Stopping existing brokers"
sudo systemctl stop hivemq
sudo docker stop $(docker ps -a -q)


echo "Starting HiveMQ Docker"
sudo docker start hivemq1
echo "Waiting for broker to finish starting up"
sleep 10

echo "Running script with 50 publishers and 50 subscribers with 0.04 messages/second for 15 minutes."
node mqtt-bm.js --host="127.0.0.1"  --numPubSub=50 --rate=0.04 --timeout=10 | tee ./reports/hivemq100.log

echo "Stopping HiveMQ Docker"
sudo docker stop hivemq1

echo "Starting HiveMQ Docker"
sudo docker start hivemq1
echo "Waiting for broker to finish starting up"
sleep 10
echo "Running script with 500 publishers and 500 subscribers with 0.04 messages/second for 15 minutes."
node mqtt-bm.js --host="127.0.0.1"  --numPubSub=500 --rate=0.04 --timeout=10 | tee ./reports/hivemq1000.log