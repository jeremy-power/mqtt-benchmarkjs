#!/bin/bash
rm -r reports
mkdir -p reports
mkdir -p ./reports/usage

brokers=("emqx" "hivemq1" "vernemq")
numClients=("50" "500" "5000" "10000")

echo "Stopping all existing brokers"
sudo docker stop $(docker ps -a -q)
for i in ${brokers[@]}; do
	sleep 60
	for t in ${numClients[@]}; do
		dt=$(date '+%d/%m/%Y %H:%M:%S');
		echo "Starting $i Docker at $dt" | tee -a ./reports/$i$t.log
		sudo docker start $i
		echo "Waiting for broker to finish starting up"
		sleep 10
		timeout 900 ./process_monitor $i $t &

		echo "Running node script on $i with $t publishers and $t subscribers with 0.04 messages/second for 15 minutes." | tee -a ./reports/$i$t.log
		echo "Starting at $dt" | tee -a ./reports/$i$t.log
		node mqtt-bm.js --host="127.0.0.1"  --numPubSub=$t --rate=0.04 --timeout=900 --limitLogging=1 | tee -a ./reports/$i$t.log

		dt=$(date '+%d/%m/%Y %H:%M:%S');
		echo "Stopping $i Docker at $dt" | tee -a ./reports/$i$t.log
		sudo docker stop $i
	done 
done
echo "Testing sucessfully completed. Check reports directory for results."
