#!/bin/bash

# required parameters : $1=thread count $2=duration(ms) $3=broker
if [[ "$#" -ne 1 ]]; then
	echo "Usage: ./process_monitor.sh [broker]"
	exit 1
fi

while true; do
    if [[ $1 == "emqx" ]] || [$1 == "vernemq"]; then
        ps axo pid,etime,%cpu,%mem,cmd | grep 'beam.smp' | grep -v grep | cut -f1 -d"-" >> ./reports/$1monitor.csv
    fi
    if [[ $1 == "hivemq1" ]]; then
        ps axo pid,etime,%cpu,%mem,cmd | grep 'hivemq' | grep -v grep | cut -f1 -d"-" >> ./reports/$1monitor.csv
    fi
sleep 60
done