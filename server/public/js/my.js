var serverTime = 0,
    timeSlice = 0,
    currencySymbol = 'TRXUSDT',
    sliceInterval = '',
    intervalID = null,
    prices = {},
    bettingAddress = '',
    curentTx = 0,
    curentTxWithAmount = 0,
    currentAmount = 0,
    upCount = 0,
    downCount = 0,
    currentPrice = 0,
    binanceCurrentPrice = 0,
    option = null,
    myChart = null,
    socket = null,
    klinesStamp = 0,
    bets = [];
var trace = {
    categoryData: [],
    values: [],
};
var utils = '';
var server = 'http://159.65.88.52';
var endpoint = '/api/bettings/active';
var contracrsEndpoint = '/api/contracts';
var bettingContract;
var tokenContract;
var defaultAddress;
var tokenBalance;

var bettingContractAddress = 'TK8cgvTGYGozwNV8egzDmbYbkE9UQw9hQJ';
var eventServer = 'https://api.shasta.trongrid.io';
var BetLogsUrl = eventServer + '/event/contract/' + bettingContractAddress + '/Bet?since=0&size=2000&page=1';
var BetWinUrl =  eventServer +'/event/contract/' + bettingContractAddress + '/Reward?since=0&size=2000&page=1';


function initTronWeb() {
    if (!!window.tronWeb && window.tronWeb.ready){
        console.log('tronweb ready')
        contractInit();
    } else {
        setTimeout(initTronWeb, 500);
    }
}
async function contractInit() {
    bettingContract = await tronWeb.contract().at(bettingContractAddress);
    tokenContract = await tronWeb.contract().at(await bettingContract.tokenAddress().call());
    defaultAddress = tronWeb.defaultAddress.base58;
    tokenBalance = (await tokenContract.balanceOf(defaultAddress).call({
        shouldPollResponse: true,
        callValue: 0})).balance.toNumber() / 100;
    console.log('address=' + defaultAddress);
    console.log('token balance=' + tokenBalance);
    await rebuildPeoples($('input[name=amount]:checked').val())

}
setTimeout(initTronWeb, 500);

setInterval(async function(){
    rebuildPeoples($('input[name=amount]:checked').val(), true)
}, 15000);

async function calcWin(index, price, direction, bet, time){
    let bets = await bettingContract.getBetters(index).call({
        shouldPollResponse: true,
        callValue: 0
    });
    let upCount = bets.upCount.toNumber();
    let downCount = bets.downCount.toNumber();
    let sum = (upCount+downCount) * bet;
    let win = 0;
    let dir ='';
    if (direction==1){
        win = sum/upCount;
        dir = '>';
    } else {
        dir = '<';
        win = sum/downCount;
    }
    $('.ifWinList').append(` <li>You win ${win/100} MOOD if price ${dir} ${price} at ${new Date(time*1000).toISOString().replace(/([^T]+)T([^\.]+).*/g, '$1 $2')}</li>`)
    console.log(index);
}
async function rebuildPeoples(value, refreshIfBetsChanged = false) {
    if (value == 0){ currentAmount = 100 }
    if (value == 1){ currentAmount = 1000 }
    if (value == 2){ currentAmount = 5000 }
    if (value == 3){ currentAmount = 10000 }
    curentTxWithAmount = +curentTx + +value;

    let newBets = await bettingContract.getBetters(curentTxWithAmount).call({
            shouldPollResponse: true,
            callValue: 0
    });
    if (refreshIfBetsChanged == true && newBets.upCount.toNumber() == bets.upCount.toNumber()
     && newBets.downCount.toNumber() == bets.downCount.toNumber())
        return;
    bets = newBets;
    upCount = bets.upCount.toNumber();
    $('#upCount').html(upCount);
    downCount = bets.downCount.toNumber()
    $('#downCount').html(downCount);
    $(".winAmount").collapse('hide');
    $(".thirdPart").collapse('hide');
    $(".increase").removeClass('active');
    $(".fall").removeClass('active');
    console.log(BetLogsUrl);
    $.ajax({
        url: BetLogsUrl,
        cache: false,
        success: function(json){
            $('.ifWinList').html('');
            $('.createBet').html('<p class="label">Create a bet</p>');
            console.log(prices['1d'].tx);
            for(let i=0;i<json.length;i++){
                if (json[i].result.addr != '0x'+tronWeb.defaultAddress.hex.replace('41',''))
                    continue;
                if (json[i].result.index - prices['1d'].tx >= 0 && json[i].result.index - prices['1d'].tx <= 3) {
                    calcWin(json[i].result.index, prices['1d'].price, json[i].result.direction, json[i].result.bet, prices['1d'].endTime);
                }
                if (json[i].result.index - prices['4h'].tx >= 0 && json[i].result.index - prices['4h'].tx <= 3) {
                    calcWin(json[i].result.index, prices['4h'].price, json[i].result.direction, json[i].result.bet, prices['4h'].endTime);
                }
                if (json[i].result.index - prices['1h'].tx >= 0 && json[i].result.index - prices['1h'].tx <= 3) {
                    calcWin(json[i].result.index, prices['1h'].price, json[i].result.direction, json[i].result.bet, prices['1h'].endTime);
                }
                if (json[i].result.index - prices['15m'].tx >= 0 && json[i].result.index - prices['15m'].tx <= 3) {
                    calcWin(json[i].result.index, prices['15m'].price, json[i].result.direction,json[i].result.bet, prices['15m'].endTime);
                }
                $('.createBet').append(`<div class="row">
                                    <div class="col-7">
                                        <span class="date">${new Date(json[i].block_timestamp).toISOString().replace(/([^T]+)T([^\.]+).*/g, '$1 $2')}</span>
                                    </div>
                                    <div class="col-5">
                                        <span class="amount">${json[i].result.bet/100}</span>
                                        <span class="currency">MOOD</span>
                                    </div>
                                </div>`);
            }
        }
    });
    $.ajax({
        url: BetWinUrl,
        cache: false,
        success: function(json){
            $('.completeBet').html('<p class="label">Complete bet</p>');
            for(let i=0;i<json.length;i++){
                if (json[i].result.addr != '0x'+tronWeb.defaultAddress.hex.replace('41',''))
                    continue;
                //console.log(json[i])
                $('.completeBet').append(`<div class="row">
                                    <div class="col-7">
                                        <span class="date">${new Date(json[i].block_timestamp).toISOString().replace(/([^T]+)T([^\.]+).*/g, '$1 $2')}</span>
                                    </div>
                                    <div class="col-5">
                                        <span class="amount">${json[i].result.winBet/100}</span>
                                        <span class="currency">MOOD</span>
                                    </div>
                                </div>`);
            }
        }
    });
    console.log('curentTxWithAmount=' + curentTxWithAmount);
}

async function createBet() {
    if (tokenBalance < currentAmount){
        alert('ERROR: Token balance < Current Bet');
        return;
    }

    let direction;
    if ($('.fall.active').length == 0) direction = 1; else direction = 2;
    $('.thirdPart .placeABet').hide(); //show "tanks for bet" label
    $('.thirdPart .betAccepted').show();
    await bettingContract.createBet(curentTxWithAmount, direction).send({
        shouldPollResponse: true,
        callValue: 0});

    $('.thirdPart .placeABet').show();
    $('.thirdPart .betAccepted').hide();
    await rebuildPeoples($('input[name=amount]:checked').val())
}

$(function () {

    timeSlice = +$('[name="time"]:checked').val();
    sliceInterval = getSliceInterval();
    currencySymbol = $('[name="currency"]:checked').val();
    getServerTime();
    getPricesData();
    getCurrentPrice(currencySymbol);
    startSocket();

    getServerCandlestickData(currencySymbol, sliceInterval);

    $('#priceBtn').change(function (e) { // show "place a bet" button when click "increase" of "fail" price button
        $(".winAmount").collapse('show');
        $(".thirdPart").collapse('show');
        let sum = (upCount+downCount+1)*currentAmount*0.9;
        let direction = e.target.defaultValue;
        if (direction == 1){
            sum = sum / (upCount+1)
        } else {
            sum = sum / (downCount+1)
        }
        $('#winAmountMood').html(sum);
        //alert(sum);

    });
    $('#termsAccept').change(function (e) { //enable "place a bet" button when checkbox is checked
        if($(this).prop('checked') == true){
            $('#placeABet').prop('disabled', false);
        } else {
            $('#placeABet').prop('disabled', true);
        }
    });
    //override submitting "make a bet" form
    $('#makeABet').submit(function (e) {
        e.preventDefault(); //stop page reload
        $(this).trigger('reset'); //reset form data
        $('#placeABet').prop('disabled', true);

        //alert(1);
        createBet();


    });
    $('#timeline').change(function (e) {
        timeSlice = +$('[name="time"]:checked').val();
        sliceInterval = getSliceInterval();
        getServerTime();
        getServerCandlestickData(currencySymbol,sliceInterval);
        getPricesData();
        startSocket();
    });
    $('#currSymbol').change(function (e) {
        currencySymbol = $('[name="currency"]:checked').val();
        getServerCandlestickData(currencySymbol,sliceInterval);
    });
});

function getDateStringFromTimestamp(timestamp) {
    var date = new Date(timestamp),
        year = date.getFullYear() + '',
        month = date.getMonth()+1 + '',
        day = date.getDate() + '',
        hour = date.getHours() + '',
        min = date.getMinutes() + '';
        sec = date.getSeconds() + '';
        msec = date.getMilliseconds() + '';
    if((month + '').length == 1){
        month = '0' + month;
    }
    if((day + '').length == 1){
        day = '0' + day;
    }
    if((hour + '').length == 1){
        hour = '0' + hour;
    }
    if((min + '').length == 1){
        min = '0' + min;
    }
    if((sec + '').length == 1){
        sec = '0' + sec;
    }
    if((msec + '').length < 3){
        for (var i=0; i<=3-msec.length;i++){
            msec = '0' + msec;
        }
    }
    var dateString = year+'-'+month+'-'+day+'T'+hour+':'+min+':'+sec+'.'+msec+'Z';
    return dateString;
}

function getServerTime() {
    $.ajax({
        url:'http://moodtoken.com/api/cors?url=https%3A%2F%2Fapi.binance.com%2Fapi%2Fv1%2Ftime',
        complete: function (response) {
            processServerTime(JSON.parse(response.responseText).serverTime);
        },
        error: function () {
            console.log('Can\'t get server time!');
        },
    });
}

function getServerCandlestickData(symbol, interval) {
    $.ajax({
        url:'http://moodtoken.com/api/cors?url=https%3A%2F%2Fapi.binance.com%2Fapi%2Fv1%2Fklines%3Fsymbol%3D'+symbol+'%26interval%3D'+interval+'%26limit%3D20',
        complete: function (response) {
            processCandlestickData(JSON.parse(response.responseText));
        },
        error: function () {
            console.log('Can\'t get server candlestick data!');
        },
    });
}

function getCurrentPrice(symbol) {
    $.ajax({
        url:'http://moodtoken.com/api/cors?url=https%3A%2F%2Fapi.binance.com%2Fapi%2Fv3%2Fticker%2Fprice%3Fsymbol%3D'+symbol,
        complete: function (response) {
            processCurrentPrice(JSON.parse(response.responseText));
        },
        error: function () {
            console.log('Can\'t get server candlestick data!');
        },
    });
}

function getPricesData() {
    $.ajax({
        url:server+endpoint,
        complete: function (response) {
            processPrices(JSON.parse(response.responseText));
        },
        error: function () {
            console.log('Can\'t get server candlestick data!');
        },
    });
}

function getContractsData() {
    $.ajax({
        url:server+contracrsEndpoint,
        complete: function (response) {
            bettingAddress = JSON.parse(response.responseText).bettingAddress;
            utils.setTronWeb(tronWeb);
            console.log(utils.contract);
        },
        error: function () {
            console.log('Can\'t get server candlestick data!');
        },
    });
}

function processPrices(data) {

    if (Array.isArray(data)) {
        data.forEach(function (item, index) {
            prices[item.duration] = {price: item.price, tx: item.tx, endTime: item.endTime};
        });
        curentTx = prices[sliceInterval].tx;
        currentPrice = Number.parseFloat(prices[sliceInterval].price).toFixed(6);
        $('.endPrice .timerData .amount').html(currentPrice);
        rebuildPeoples($('input[name=amount]:checked').val());
        /*let txInput = $('.endPrice .timerData [name="tx"]');
        if (txInput.length > 0) {
            txInput.val(prices[sliceInterval].tx);

        } else {
            $('.endPrice .timerData').append('<input type="hidden" name="tx" value="'+prices[sliceInterval].tx+'">');
        }*/
    }

}

function processServerTime(time) {
    serverTime = time;
    var sliceStamp = timeSlice / 1000;
    var days = Math.floor(sliceStamp / 86400);
    sliceStamp -= days * 86400;
    var hours = Math.floor(sliceStamp / 3600) % 24;
    sliceStamp -= hours * 3600;
    var minutes = Math.floor(sliceStamp / 60) % 60;

    var serverDate = new Date(serverTime), //divide server time for hours minutes and seconds
        hrs = serverDate.getUTCHours(),
        min = serverDate.getUTCMinutes(),
        sec = serverDate.getUTCSeconds(),
        interval = 0;
    if (days > 1) {
        interval += days * 24 * 60 * 60 * 1000;
    }
    if (days > 0) {
        interval += ((23 - hrs) * 60 * 60 * 1000) + ((59 - min) * 60 * 1000) + ((59 - sec) * 1000);
    } else {
        interval += (59 - sec) * 1000;
    }
    if (hours > 0) {
        for (var i = 1; i <= 24 / hours; i++) {
            if (i * hours > hrs) {
                interval += ((i * hours - hrs - 1) * 60 * 60 * 1000) + ((59 - min) * 60 * 1000);
                break;
            }
        }
    }
    if (minutes > 0) {
        for (var i = 1; i <= 60 / minutes; i++) {
            if (i * minutes > min) {
                interval += (i * minutes - min - 1) * 60 * 1000;
                break;
            }
        }
    }
    //the end of the bet timer

    if (intervalID != null) {
        clearInterval(intervalID);
    }
    intervalID = setInterval(function time() { // change counting time every 1 second
        var d = new Date(interval), //divide server time for hours minutes and seconds
            hrs = d.getUTCHours(),
            min = d.getUTCMinutes(),
            sec = d.getUTCSeconds();
        if ((sec + '').length == 1) {
            sec = '0' + sec;
        }
        if ((min + '').length == 1) {
            min = '0' + min;
        }
        if ((hrs + '').length == 1) {
            hrs = '0' + hrs;
        }
        jQuery('.firstPart .timerData .hours').html(hrs); // apply counting time to html
        jQuery('.firstPart .timerData .minutes').html(min);
        jQuery('.firstPart .timerData .seconds').html(sec);
        interval -= 1000; //reduce counting time for 1 second
        if (interval < 1000) {
            getServerTime();
        }
    }, 1000);
}

function processCandlestickData(data) {
    if (Array.isArray(data)) {
        trace = {
            categoryData: [],
            values: [],
        }
        data.forEach(function (item, index) {
            trace.values.push([item[0], item[1], item[4], item[3], item[2]]);
        });
        var upColor = '#26A69A';
        var upBorderColor = '#26A69A';
        var downColor = '#EF5350';
        var downBorderColor = '#EF5350';

        var lastDate = trace.values[trace.values.length-1][0],
            max = lastDate + (lastDate - trace.values[0][0]) * 0.3,
            min = trace.values[0][0] - timeSlice,
            avgPrice = (+trace.values[trace.values.length-1][2] + +trace.values[trace.values.length-1][1])/2;

        option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        color: '#000',
                        backgroundColor: '#fff',
                    }
                },
                crossStyle: {
                    type: 'solid',
                },
                lineStyle: {
                    type: 'solid',
                },
                backgroundColor: '#fff',
                textStyle: {
                    color: '#000',
                },
            },
            grid: {
                left: 60,
                right: 60,
                bottom: '15%',
                containLabel: true,
            },
            xAxis: {
                type: 'time',
                boundaryGap: ['20%', '20%'],
                scale: true,
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: 'transparent',
                    }
                },
                max: max,
                min: min,
            },
            yAxis: {
                type: 'value',
                scale: true,
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: 'transparent',
                    }
                },
                position: 'right',
            },
            series: [
                {
                    type: 'candlestick',
                    data: trace.values,
                    itemStyle: {
                        normal: {
                            color: upColor,
                            color0: downColor,
                            borderColor: upBorderColor,
                            borderColor0: downBorderColor
                        }
                    },
                    markPoint: {
                        data: [
                            {
                                symbol: 'image://img/r.png',
                                symbolOffset: [80,0],
                                symbolSize: [144,80],
                                name: 'Current price',
                                coord: [lastDate, avgPrice],
                                value: binanceCurrentPrice,
                                label: {
                                    position: 'insideLeft',
                                    distance: 55,
                                    color: '#000',
                                    fontSize: 14,
                                },
                            }
                        ]
                    },
                },
            ],
            backgroundColor: '#fff',
        };

        myChart = echarts.init(document.getElementById('main'));
        myChart.setOption(option);
    }
}

function processCurrentPrice(data) {
    if (typeof data === 'object') {

    }
}

function getSliceInterval() {
    var sliceStamp = timeSlice / 1000;
    var days = Math.floor(sliceStamp / 86400);
    sliceStamp -= days * 86400;
    var hours = Math.floor(sliceStamp / 3600) % 24;
    sliceStamp -= hours * 3600;
    var minutes = Math.floor(sliceStamp / 60) % 60;
    if (days > 0) {
        return days + 'd';
    }
    if (hours > 0) {
        return hours + 'h';
    }
    if (minutes > 0) {
        return minutes + 'm';
    }
}

function startSocket() {
    if (socket != null) {
        socket.close(1000);
    }
    socket = new WebSocket('wss://stream.binance.com:9443/stream?streams='+currencySymbol.toLowerCase()+'@kline_'+sliceInterval+'/'+currencySymbol.toLowerCase()+'@ticker');
    socket.onmessage = function(event) {
        if (option != null) {
            var message = JSON.parse(event.data).data;
            if ('kline' == message.e) {
                /*if (klinesStamp && klinesStamp != message.k.t) {

                }*/
                var optData = option.series[0].data,
                    optArr = optData[optData.length-1];
                optArr[0] = message.k.t;
                optArr[1] = message.k.o;
                optArr[2] = message.k.c;
                optArr[3] = message.k.l;
                optArr[4] = message.k.h;
            } else if ('24hrTicker' == message.e) {
                binanceCurrentPrice = Number.parseFloat(message.c).toFixed(6);
                option.series[0].markPoint.data[0].value = binanceCurrentPrice;
            }
            myChart.setOption(option);
        }

    };
}
