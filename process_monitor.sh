#!/bin/bash

# required parameters : $1=thread count $2=duration(ms) $3=broker
if [[ "$#" -ne 2 ]]; then
	echo "Usage: ./process_monitor.sh [broker] [numClients]"
	exit 1
fi

while true; do
	dt=$(date '+%m/%d/%Y %H:%M:%S');
    if [[ $1 == "emqx" ]] || [[ $1 == "vernemq" ]]; then
        ps axo pid,etime,%cpu,%mem,cmd | grep 'beam.smp' | grep -v grep | cut -f1 -d"-" >> ./reports/usage/$1$2usage.csv
    fi
    if [[ $1 == "hivemq1" ]]; then
        ps axo pid,etime,%cpu,%mem,cmd | grep 'hivemq' | grep -v "./process_monitor.sh" | grep -v "grep" | grep -v "tee" | cut -f1 -d"-" >> ./reports/usage/hivemq$2usage.csv
    fi
sleep 10
done
