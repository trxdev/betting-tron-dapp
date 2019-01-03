let Betting = artifacts.require("./Betting.sol");
let MoodToken = artifacts.require("./MoodToken.sol");
//const BigNumber = web3.BigNumber;

contract('Betting', accounts => {
    beforeEach(async () => {

    });

    afterEach(async () => {

    });

    it("#1 Should work", async () => {
        let betting = await Betting.deployed();
        let token = await MoodToken.deployed();
        await betting.createBetting(1,2);

        console.log('COMMISSION RECIPIENT=' + await betting.commissionRecipientAddress());
        console.log('ACCOUNT 0 =' + accounts[0]);
        console.log((await token.balanceOf.call(accounts[0])).balance.toNumber());
        await betting.createBet(0,1, {account: accounts[0]});
        console.log((await token.balanceOf.call(accounts[0])).balance.toNumber());
        let endBetting = await betting.endBetting(0,2);
        //console.log(await betting.BettingStarted());
        console.log((await token.balanceOf.call(accounts[0])).balance.toNumber());
        //await betting.createBet(2,2);


    });


});
