#!/bin/bash

mkdir -p reports

brokers=("hivemq1", "emqx", "vernemq")
numClients=("50" "500" "5000" "10000")

echo "Stopping all existing brokers"
sudo docker stop $(docker ps -a -q)
for i in ${brokers[@]}; do
	for t in ${numClients[@]}; do

		echo "Starting $i Docker"
		sudo docker start $i
		echo "Waiting for broker to finish starting up"
		sleep 10

		echo "Running script with $t publishers and $5 subscribers with 0.04 messages/second for 15 minutes."
		node mqtt-bm.js --host="127.0.0.1"  --numPubSub=$t --rate=0.04 --timeout=10 --limitLogging=1 | tee ./reports/hivemq$t.log

		echo "Stopping $i Docker"
		sudo docker stop $i
	done
done