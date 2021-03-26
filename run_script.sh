#!/bin/bash

if [[ "$#" -ne 2 ]]; then
	echo "Usage: ./process_monitor.sh [duration(s)] [rate]"
	exit 1
fi

rm -r reports
mkdir -p reports
mkdir -p ./reports/usage

brokers=("emqx" "hivemq1" "vernemq")
numClients=("50" "500" "5000" "10000")

echo "Stopping all existing brokers"
sudo docker stop $(docker ps -a -q)
for i in ${brokers[@]}; do
	for t in ${numClients[@]}; do
		dt=$(date '+%m/%d/%Y %H:%M:%S');
		echo "Starting $i Docker at $dt" | tee -a ./reports/$i$t.log
		sudo docker start $i
		echo "Waiting for broker to finish starting up"
		sleep 10
		timeout $1 ./process_monitor.sh $i $t &

		echo "Running node script on $i with $t publishers and $t subscribers with $2 messages/second for $1 seconds." | tee -a ./reports/$i$t.log
		echo "Starting at $dt" | tee -a ./reports/$i$t.log
		node mqtt-bm.js --host="127.0.0.1"  --numPubSub=$t --rate=$2 --timeout=$1 --limitLogging=1 | tee -a ./reports/$i$t.log

		dt=$(date '+%m/%d/%Y %H:%M:%S');
		echo "Stopping $i Docker at $dt" | tee -a ./reports/$i$t.log
		sudo docker stop $i
	done 
	sleep 60
done
echo "Testing sucessfully completed. Check reports directory for results."
