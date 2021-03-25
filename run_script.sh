#!/bin/bash

# required parameters : $1=thread count $2=duration(ms) $3=broker
if [[ "$#" -ne 3 ]]; then
	echo "Usage: ./run_script.sh [threads] [duration(ms)] [broker]"
	exit 1
fi
echo "Stopping existing brokers"
sudo systemctl stop hivemq
sudo docker stop $(docker ps -a -q)

if [[ $3 == "hivemqd" ]]; then
echo "Starting HiveMQ Docker"
sudo docker start hivemq1
fi

if [[ $3 == "hivemq" ]]; then
echo "Starting HiveMQ Service (Use hivemqd for docker)"
sudo systemctl start hivemq
fi


if [[ $3 == "emqx" ]]; then
echo "Starting EMQX"
sudo docker start emqx
fi

if [[ $3 == "vernemq" ]]; then
echo "Starting VerneMQ"
sudo docker start vernemq
fi

echo "Waiting for broker to finish starting up"
sleep 10

echo "Deleting Existing reports"
rm -r report
rm run.jtl

/home/ec2-user/apache-jmeter-5.4.1/bin/jmeter -n -t  NymiTrafficModelLive.jmx -Jthreads=$1 -Jduration=$2 -l run.jtl -e -o ./report
