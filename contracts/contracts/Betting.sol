pragma solidity ^0.4.23;

import "./base/SafeMath.sol";
import "./base/Owned.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract Betting is Owned {
    using SafeMath for uint;

    event BettingStarted(uint indexed index, uint rate, uint endTimestamp, uint bet);
    event BettingEnd(uint indexed index, uint endRate, uint direction, uint winBet);
    event Bet(uint indexed index, uint direction, address indexed addr, uint bet);
    event Reward(uint indexed index, address indexed addr, uint winBet);

    IERC20 token;
    address commissionRecipient;
    uint DIRECTORY_UP = 1;
    uint DIRECTORY_DOWN = 2;

    uint COMMISSION = 10; //10%

    uint BET100 = 100 * 100;
    uint BET1K  = 1000 * 100;
    uint BET5K  = 5000 * 100;
    uint BET10K = 10000 * 100;

    struct Betting {
        uint rate;
        uint endRate;
        uint endTimestamp;
        bool ended;
        uint bet;
        uint sum;
        uint result;
        uint winBet;
        address[] addressUp;
        address[] addressDown;
    }


    Betting[] public bettingStorage;

    constructor(address _tokenAddress, address _commissionRecipient) public {
        token = IERC20(_tokenAddress);
        commissionRecipient = _commissionRecipient;
    }

    function tokenAddress() public view returns(address) {
        return token;
    }

    function commissionRecipientAddress() public view returns(address) {
        return commissionRecipient;
    }

    function getBetters(uint256 _index) public view returns (uint256 upCount, uint256 downCount, address[] addressUp, address[] addressDown) {
        return (bettingStorage[_index].addressUp.length, bettingStorage[_index].addressDown.length, bettingStorage[_index].addressUp, bettingStorage[_index].addressDown);

    }

    function getBetting(uint256 _index) public view
        returns(uint rate,
                uint endRate,
                uint endTimestamp,
                uint bet,
                uint sum,
                uint result,
                uint winBet) {
        return (bettingStorage[_index].rate,
                bettingStorage[_index].endRate,
                bettingStorage[_index].endTimestamp,
                bettingStorage[_index].bet,
                bettingStorage[_index].sum,
                bettingStorage[_index].result,
                bettingStorage[_index].winBet);
    }

    function createBetting(uint rate, uint endTimestamp) onlyOwner public returns(uint256) {
        Betting memory betting;
        betting.rate = rate;
        betting.endTimestamp = endTimestamp;
        betting.ended = false;
        betting.bet = BET100;
        uint index = bettingStorage.length;
        emit BettingStarted(bettingStorage.length, rate, endTimestamp, betting.bet);
        bettingStorage.push(betting);

        betting.bet = BET1K;
        emit BettingStarted(bettingStorage.length, rate, endTimestamp, betting.bet);
        bettingStorage.push(betting);

        betting.bet = BET5K;
        emit BettingStarted(bettingStorage.length, rate, endTimestamp, betting.bet);
        bettingStorage.push(betting);

        betting.bet = BET10K;
        emit BettingStarted(bettingStorage.length, rate, endTimestamp, betting.bet);
        bettingStorage.push(betting);

        return index;
    }

    function endBetting(uint index, uint endRate) onlyOwner public {

        require(bettingStorage[index].bet == BET100);
        for (uint j=0; j < 4; j++){

            Betting memory betting = bettingStorage[index + j];
            address[] memory winners;
            require(betting.ended == false);
            betting.ended = true;
            betting.endRate = endRate;



            if (betting.sum != 0){
                if (betting.endRate > endRate) {
                    betting.result = DIRECTORY_UP;
                    if (betting.addressUp.length != 0) {
                        betting.winBet = betting.sum.div(betting.addressUp.length);
                        winners = betting.addressUp;
                    } else {
                        betting.winBet = betting.sum.div(betting.addressDown.length);
                        winners = betting.addressDown;
                    }
                } else {
                    betting.result = DIRECTORY_DOWN;
                    if (betting.addressDown.length != 0){
                        betting.winBet = betting.sum.div(betting.addressDown.length);
                        winners = betting.addressDown;
                    } else {
                        betting.winBet = betting.sum.div(betting.addressUp.length);
                        winners = betting.addressUp;
                    }
                }
                for(uint i = 0; i < winners.length; i++){
                    require(token.transfer(winners[i], betting.winBet));
                    emit Reward(index + j, winners[i], betting.winBet);
                }
            }
            bettingStorage[index + j] = betting;
            emit BettingEnd(index + j, endRate, betting.result, betting.winBet);
        }
    }

    function createBet(uint index, uint direction) public {

        Betting memory betting = bettingStorage[index];
        require(betting.rate != 0);
        require(betting.ended == false);
        require(direction == DIRECTORY_UP || direction == DIRECTORY_DOWN);

        uint commission = betting.bet.mul(COMMISSION).div(100);
        uint bet = betting.bet - commission;

        require(token.transferFrom(msg.sender, address(this), bet));
        require(token.transferFrom(msg.sender, commissionRecipient, commission));

        bettingStorage[index].sum = betting.sum.add(bet);
        if (direction == DIRECTORY_UP) {
            bettingStorage[index].addressUp.push(msg.sender);
        } else {
            bettingStorage[index].addressDown.push(msg.sender);
        }

        emit Bet(index, direction, msg.sender, bet);
    }

}
