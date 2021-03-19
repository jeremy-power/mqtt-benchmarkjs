#!/bin/node

import mqtt from 'mqtt';
import Promise from 'bluebird';
import logUpdate from 'log-update';
import readline from 'readline';
const percentile = require("percentile");
const median = require('median')

const argv = require('minimist')(process.argv.slice(1));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getConfigFromCmd(argv){
  const acceptArgs = [
    'host', 'login', 'password', 'topic',
    'numSub', 'numPub',
  ];

  if(argv.fileConfig){
    // TODO: read config from file
  } else {
    const conf = {};
    acceptArgs.forEach(key => {
      conf[key] = argv[key];
    });

    return conf;
  }
}

const conf = getConfigFromCmd(argv);

const brokerUrl = conf.host;
const login = conf.login;
const password = conf.password;
const topicId = conf.topic;
const numSub = parseInt(conf.numSub);
const numPub = parseInt(conf.numPub);

const metrics = {
  numMsgSent: 0,
  numMsgRecv: 0,
  timeSpan: 0,
  numMsgPerSecond: 0,
  latency: 0,
  latencyAvg: 0,
  latencyMax: 0,
  numSub,
  numPub,
}


function makeMqttClient(clientId = 'unittest-sub') {
  return mqtt.connect(null, {
    host: brokerUrl,
    port: 1883,
    clientId,
    clean: false,
    username: login,
    password,
    keepalive: 60 * 60,
  });
}

function setupOneSubscriberForTopic(clientId, topicId) {
  return new Promise((resolve, reject) => {
    const c = makeMqttClient(clientId);
    console.log('Subscriber is setup with', clientId, topicId);
    c.on('connect', () => {
      console.log('CONNECTED - Subscriber is setup with', clientId, topicId);
      c.subscribe(topicId, err => {
        console.log('SUBSCRIBED to topic ', topicId);
        if (err) {
          reject(err);
        } else {
          resolve(c);
        }
      });
    });
    c.on('close', () => {
      console.log('CLOSED - Subscriber', clientId, topicId);
      console.log('......');
    });
    c.on('error', (err) => {
      console.log('ERROR - Subscriber', clientId, topicId, err);
      console.log('......');
    });
  });
}

function setupOnePublisher(clientId) {
  const c = makeMqttClient(clientId);
  return new Promise((resolve) => {
    c.on('connect', () => {
      console.log(`publisher ${clientId} connected`);
      resolve(c);
    });
    c.on('reconnect', () => {
      console.log(`publisher ${clientId} ${topicId} reconnect`);
    });
    c.on('close', (packet) => {
      console.log(`publisher ${clientId} ${topicId} closed`, packet);
    });
    c.on('error', (packet) => {
      console.log(`publisher ${clientId} ${topicId} closed`, packet);
    });
  });
}

/**
 * FIXME: refactor! surely there should be more easy to understand when reading the code.
 */
function setupClientsInBatch(funPromiseList, limit) {
  let resultList = [];
  const seriesOfPromises = funPromiseList.reduce((group, fn, i) => {
    const groupIndex = Math.floor(i / limit);
    if (i % limit === 0) {
      group.push([]);
    }
    group[groupIndex].push(fn);
    return group;
  }, []);
  return new Promise(resolve => {
    Promise.mapSeries(
      seriesOfPromises,
      fnList => Promise.all(
        fnList.map(fn => fn())
      ).then(result => { resultList = resultList.concat(result); })
    ).then(() => resolve(resultList));
  });
}

function times(num) {
  const result = [];
  for (let i = 0; i < num; i++) {
    result.push(i);
  }
  return result;
}

function sendMsg(pubList) {
  pubList.forEach(pub => {
    if (pub.connected) {
      metrics.numMsgSent++;
      const msg = ['Test Msg ', metrics.numMsgSent, (+(new Date()))].join('|');
      pub.publish(topicId, msg);
    }
  });
}

function makeLogStatus(timeStart) {
  const frames = ['-', '\\', '|', '/'];
  let i = 0;
  return (numSent, numRecv) => {
    const frame = frames[i = ++i % frames.length];
    const ts = +(new Date()) - timeStart;

    metrics.timeSpan = ts;

    logUpdate(`${frame} ${ts} ms - ${numSent} msgs sent vs. ${numRecv} msgs received ${frame}`);
  };
}

let stopTransfer = null;
function doTransfer(pubList) {
  const logStatus = makeLogStatus(+(new Date()));
  const tidSendMsg = setInterval(() => sendMsg(pubList), 1000);
  const tidLogStatus = setInterval(() => logStatus(metrics.numMsgSent, metrics.numMsgRecv), 80);
  stopTransfer = () => {
    clearInterval(tidSendMsg);
    clearInterval(tidLogStatus);
    logUpdate.done();
    return function resume(){
      return doTransfer(pubList);
    }
  }

  return stopTransfer;
}

function stressTest() {
  const funSetupSubsList = times(numSub)
    .map(i => setupOneSubscriberForTopic.bind(null, `stress-test-sub-${i + 1}`, topicId));
  const funSetupPubsList = times(numPub)
    .map(i => setupOnePublisher.bind(null, `stress-test-pub-${i + 1}`));

  setupClientsInBatch(funSetupSubsList, 100)
    .then(subList => {
      subList.forEach(sub => {
        sub.on('message', (topic, packet) => {
          // console.log('received at', topic, 'mesage', packet.toString());
          const msg = packet.toString();
          const timeSent = msg.split('|').splice(-1);
          const msgLatency = +(new Date()) - timeSent;
          metrics.latency += msgLatency;
          if(msgLatency > metrics.latencyMax){
            metrics.latencyMax = msgLatency;
          }
          metrics.numMsgRecv++;
        });
      });
      return subList;
    })
    .then(() => setupClientsInBatch(funSetupPubsList, 100))
    .then(pubList => {
      stopTransfer = doTransfer(pubList);
     });
}

function roundBy(decimalDigit = 3){
  return (num) => {
    return Math.ceil(num * Math.pow(10, decimalDigit)) / 1000;
  }
}

function report(){
  const numMsgPerSecond = metrics.numMsgRecv / (metrics.timeSpan/1000);
  const latencyAvg = metrics.numMsgRecv ? metrics.latency / metrics.numMsgRecv: 0;
  const latency95th = percentile(95, metrics.latency);
  const latencyMedian = median(metrics.latency);
  metrics.numMsgPerSecond = numMsgPerSecond;
  metrics.latencyAvg = latencyAvg;
  const roundBy3 = roundBy(3);
  console.log('===========================================================');
  console.log('MQTT broker Benchmark result');
  console.log('Host:', brokerUrl);
  console.log('Topic(s):', topicId);
  console.log('---');
  console.log('Total Message Sent:', metrics.numMsgSent);
  console.log('Total Message Received:', metrics.numMsgRecv);
  console.log('> Number of messages delivered per second:', roundBy3(metrics.numMsgPerSecond));
  console.log('---');
  console.log('Total Deliver Message Latency:', roundBy3(metrics.latency), 'ms');
  console.log('> Median Latency:', roundBy3(latencyMedian), 'ms');
  console.log('> 95th Percentile:', roundBy3(latency95th), 'ms');
  console.log('> Average Latency per Message:', roundBy3(metrics.latencyAvg), 'ms');
  console.log('> Maximum Latency per Message:', roundBy3(metrics.latencyMax), 'ms');
  console.log('===========================================================');
}

stressTest();
rl.on('SIGINT', () => {
  const resume = stopTransfer();
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) {
      report();
      process.exit();
    } else {
      resume();
    }
  });
});
