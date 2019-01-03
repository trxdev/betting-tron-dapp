const MoodToken = artifacts.require("./MoodToken.sol");
const Betting = artifacts.require("./Betting.sol");

module.exports = function (deployer, network, account) {
   deployer.then(async () => {
       await deployer.deploy(MoodToken);
       await deployer.deploy(Betting, MoodToken.address, 'TMj3QNpFtkhu2Rrbu1m82o3ZaGq45rZ73g');
       let token = await MoodToken.deployed();
       await token.setBettingContract(Betting.address);
       console.log('TOKEN ='+ MoodToken.address);
       console.log('BETTING ='+ Betting.address);

   });
};
