pragma solidity ^0.4.24;


library strings {
    struct slice {
        uint _len;
        uint _ptr;
    }

    function memcpy(uint dest, uint src, uint len) private pure {
        // Copy word-length chunks while possible
        for(; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }

    function toSlice(string memory self) internal pure returns (slice memory) {
        uint ptr;
        assembly {
            ptr := add(self, 0x20)
        }
        return slice(bytes(self).length, ptr);
    }

    function join(slice memory self, slice[] memory parts) internal pure returns (string memory) {
        if (parts.length == 0)
            return "";

        uint length = self._len * (parts.length - 1);
        for(uint i = 0; i < parts.length; i++)
            length += parts[i]._len;

        string memory ret = new string(length);
        uint retptr;
        assembly { retptr := add(ret, 32) }

        for(i = 0; i < parts.length; i++) {
            memcpy(retptr, parts[i]._ptr, parts[i]._len);
            retptr += parts[i]._len;
            if (i < parts.length - 1) {
                memcpy(retptr, self._ptr, self._len);
                retptr += self._len;
            }
        }

        return ret;
    }

    function _stringToBytes(string memory source) internal pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function _stringEq(string a, string b) internal pure returns (bool) {
        if((bytes(a).length == 0 && bytes(b).length == 0)) {
            return true;
        }
        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return _stringToBytes(a) == _stringToBytes(b);
        }
    }

}

library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }
}

library Utils {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a < b) {
            return a;
        }
        return b;
    }

    function sameDay(uint256 day1, uint256 day2) internal pure returns (bool){
        return day1 / 24 / 3600 == day2 / 24 / 3600;
    }

    function bytes32Eq(bytes32 a, bytes32 b) internal pure returns (bool) {
        for (uint i = 0; i < 32; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    function bytes32ToString(bytes32 x) internal pure returns (string) {
        uint charCount = 0;
        bytes memory bytesString = new bytes(32);
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            } else if (charCount != 0) {
                break;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];

        }
        return string(bytesStringTrimmed);
    }

    function _stringToBytes(string memory source) internal pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function _stringEq(string a, string b) internal pure returns (bool) {
        if ((bytes(a).length == 0 && bytes(b).length == 0)) {
            return true;
        }

        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return _stringToBytes(a) == _stringToBytes(b);
        }
    }


    function isContract(address addr) internal view returns (bool) {
        uint size;
        assembly {size := extcodesize(addr)}
        return size > 0;

    }
}

contract SeroInterface {

    bytes32 private topic_sero_issueToken = 0x3be6bf24d822bcd6f6348f6f5a5c2d3108f04991ee63e80cde49a8c4746a0ef3;
    bytes32 private topic_sero_balanceOf = 0xcf19eb4256453a4e30b6a06d651f1970c223fb6bd1826a28ed861f0e602db9b8;
    bytes32 private topic_sero_send = 0x868bd6629e7c2e3d2ccf7b9968fad79b448e7a2bfb3ee20ed1acbc695c3c8b23;
    bytes32 private topic_sero_currency = 0x7c98e64bd943448b4e24ef8c2cdec7b8b1275970cfe10daf2a9bfa4b04dce905;

    function sero_msg_currency() internal returns (string) {
        bytes memory tmp = new bytes(32);
        bytes32 b32;
        assembly {
            log1(tmp, 0x20, sload(topic_sero_currency_slot))
            b32 := mload(tmp)
        }
        return Utils.bytes32ToString(b32);
    }

    function sero_issueToken(uint256 _total, string memory _currency) internal returns (bool success){
        bytes memory temp = new bytes(64);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _total)
            log1(temp, 0x40, sload(topic_sero_issueToken_slot))
            success := mload(add(temp, 0x20))
        }
        return;
    }

    function sero_balanceOf(string memory _currency) internal view returns (uint256 amount){
        bytes memory temp = new bytes(32);
        assembly {
            mstore(temp, _currency)
            log1(temp, 0x20, sload(topic_sero_balanceOf_slot))
            amount := mload(temp)
        }
        return;
    }

    function sero_send_token(address _receiver, string memory _currency, uint256 _amount) internal returns (bool success){
        return sero_send(_receiver, _currency, _amount, "", 0);
    }

    function sero_send(address _receiver, string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal returns (bool success){
        bytes memory temp = new bytes(160);
        assembly {
            mstore(temp, _receiver)
            mstore(add(temp, 0x20), _currency)
            mstore(add(temp, 0x40), _amount)
            mstore(add(temp, 0x60), _category)
            mstore(add(temp, 0x80), _ticket)
            log1(temp, 0xa0, sload(topic_sero_send_slot))
            success := mload(add(temp, 0x80))
        }
        return;
    }

}


contract Config {
    uint256 constant star1_little_total = 1e23;
    uint256 constant star2_little_total = 5e23;
    uint256 constant star3_little_total = 1e24;
    uint256 constant star4_little_total = 3e24;
    uint256 constant star5_little_total = 9e24;
}

contract InvestorRelationship is Config, SeroInterface {

    uint256 constant private MAXHEIGHT = 300;

    struct Investor {
        uint256 refereeId;
        uint256 largeAreaId;

        uint256 amount;
        uint256 totalAmount;
        uint256 returnAmount;
        uint256 achievement;
        uint256 recommendAmount;
        uint256 profitLevel;
        uint256 value;
        uint256 otherAchievement;

        uint256 dayRecommendAmount;
        uint256 updateTimestamp;

        address addr;
        uint8 star;
    }

    struct ReturnReward {
        uint256 staticReward;
        uint256 recommendReward;
        uint256 starReward;
        uint256 vipReward;
        uint256 currentStaticReward;
        uint256 currentIncome;
        uint256 staticTimestamp;
        uint256 updateTimestamp;
    }

    uint256 preTotalShare;
    uint256 preRewardAmount;

    uint256 totalShare;
    uint256 lastUpdated;

    uint256 public winnerPool;
    uint256 public preWinnerPool;
    uint256 public preWinnersLen;
    uint256 private cash;

    mapping(address => uint256) indexs;
    Investor[] investors;
    ReturnReward[] returnRewards;

    uint256 public winnersLen;
    uint256[] public winners = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    uint256[] public topSixList = [0,0,0,0,0,0,0];
    uint256[] winnerRates = [50, 20, 15, 6, 5, 4];

    using SafeMath for uint256;

    constructor() public {
        investors.push(Investor({refereeId : 0, largeAreaId : 0, amount : 0, totalAmount : 0, returnAmount : 0, achievement : 0, otherAchievement : 0, recommendAmount : 0, profitLevel : 0, addr : 0, star : 0, value : 0,dayRecommendAmount:0, updateTimestamp:0}));
        returnRewards.push(ReturnReward({staticReward : 0, recommendReward : 0, starReward : 0, vipReward : 0, currentStaticReward : 0, currentIncome : 0, staticTimestamp : now, updateTimestamp : 0}));
    }

    function findByAddr(address addr) internal view returns (Investor) {
        return investors[indexs[addr]];
    }

    function findById(uint256 id) internal view returns (Investor) {
        return investors[id];
    }

    function getIndexByAddr(address addr) internal view returns (uint256) {
        return indexs[addr];
    }

    function _withdrawBalance(address addr) internal returns (uint256 amount) {
        uint256 index = getIndexByAddr(addr);
        require(index != 0);
        amount = investors[index].value;
        investors[index].value = 0;
        cash = SafeMath.sub(cash, amount);
        return;
    }

    function payStaticProfit(uint256 id, uint256 num) internal {
        _beforeUpdate();

        if (preTotalShare == 0 || preRewardAmount == 0) {
            return;
        }

        uint256 allProfit;
        for (uint256 i = id; i < Utils.min(investors.length, id + num); i++) {
            if (!Utils.sameDay(returnRewards[i].staticTimestamp, now) && investors[i].amount != 0) {
                allProfit += _payStaticProfit(i);
            }
        }
        cash = cash.add(allProfit);
        totalShare = totalShare.sub(allProfit);
    }

    function insert(uint256 refereeId, uint256 amount, address addr) internal {
        _beforeUpdate();

        indexs[addr] = investors.length;
        investors.push(Investor({refereeId : refereeId, largeAreaId : 0, amount : amount, totalAmount : amount, returnAmount : 0, achievement : 0, otherAchievement : 0, recommendAmount : 0, profitLevel : 0, addr : addr, star : 0, value : 0,dayRecommendAmount:0, updateTimestamp:0}));
        returnRewards.push(ReturnReward({staticReward : 0, recommendReward : 0, starReward : 0, vipReward : 0, currentStaticReward : 0, currentIncome : 0, staticTimestamp : now, updateTimestamp : 0}));

        if (amount > 0) {
            _update(indexs[addr], amount);
        }
    }

    function update(uint id, uint256 amount) internal {
        _beforeUpdate();

        if (!Utils.sameDay(returnRewards[id].staticTimestamp, now) && investors[id].amount > 0 && preTotalShare != 0 && preRewardAmount != 0) {
            uint256 profit = _payStaticProfit(id);
            cash = cash.add(profit);
            totalShare = totalShare.sub(profit);
        }

        investors[id].amount = investors[id].amount.add(amount);
        investors[id].totalAmount = investors[id].totalAmount.add(amount);

        if (amount > 0) {
            _update(id, amount);
        }
    }

    function topSix(uint256 id) internal {
        if(winnersLen == 0) {
            winnersLen=1;
            topSixList[0] = id;
        } else {
            uint256 index = 7;
            for(uint256 i=0;i<winnersLen;i++) {
                if(id == topSixList[i]) {
                    index = i;
                }
            }

            if(index == 7) {
                topSixList[winnersLen] = id;
                index = winnersLen;

                if(winnersLen < 6) {
                    winnersLen++;
                }
            }

            for(i= index;i>0;i--) {
                if(investors[topSixList[i]].dayRecommendAmount > investors[topSixList[i-1]].dayRecommendAmount) {
                    uint256 temp = topSixList[i];
                    topSixList[i] = topSixList[i-1];
                    topSixList[i-1] = temp;
                } else {
                    break;
                }
            }
        }
    }

    function _update(uint256 id, uint256 amount) internal {

        winnerPool += amount/20;

        uint256 currentId = investors[id].refereeId;

        if (currentId != 0 ) {
            investors[currentId].recommendAmount = investors[currentId].recommendAmount.add(amount);

            if (!Utils.sameDay(now, investors[currentId].updateTimestamp)) {
                investors[currentId].dayRecommendAmount = amount;
                investors[currentId].updateTimestamp = now;
            } else {
                investors[currentId].dayRecommendAmount = investors[currentId].dayRecommendAmount.add(amount);
            }
            if(investors[currentId].amount !=0) {
                topSix(currentId);
            }
        }

        if (investors[id].profitLevel == 0) {
            investors[id].profitLevel = _profitLevel(amount);
        }

        uint256 childId = id;
        uint256 height;
        uint256 otherAmount = amount;
        while (currentId != uint256(0)) {

            if (investors[childId].otherAchievement != 0) {
                otherAmount = otherAmount.add(investors[childId].otherAchievement);
                investors[childId].otherAchievement = 0;
            }

            if (height == MAXHEIGHT && investors[currentId].refereeId != 0) {
                investors[currentId].otherAchievement = investors[currentId].otherAchievement.add(otherAmount);
                break;
            } else {
                investors[currentId].achievement = investors[currentId].achievement.add(otherAmount);
            }

            if (investors[currentId].largeAreaId == 0) {
                investors[currentId].largeAreaId = childId;
            } else {

                uint256 largeAreaId = investors[currentId].largeAreaId;
                uint256 largeAchievement = investors[largeAreaId].achievement.add(investors[largeAreaId].totalAmount);
                uint256 childAchievement = investors[childId].achievement.add(investors[childId].totalAmount);

                if (investors[currentId].largeAreaId != childId && childAchievement > largeAchievement) {
                    investors[currentId].largeAreaId = childId;
                    largeAchievement = childAchievement;
                }

                uint256 littleAchievement = (investors[currentId].achievement.add(investors[currentId].otherAchievement)).sub(largeAchievement);

                uint8 star;
                if (littleAchievement >= star5_little_total) {
                    star = 5;
                } else if (littleAchievement >= star4_little_total) {
                    star = 4;
                } else if (littleAchievement >= star3_little_total) {
                    star = 3;
                } else if (littleAchievement >= star2_little_total) {
                    star = 2;
                } else if (littleAchievement >= star1_little_total) {
                    star = 1;
                } else {
                    star = 0;
                }

                if (star > investors[currentId].star) {
                    investors[currentId].star = star;
                }

            }
            height++;
            (childId, currentId) = (currentId, investors[currentId].refereeId);
        }

        uint256 allProfit;
        allProfit += _recommendProfit(investors[id].refereeId, amount);
        allProfit += _starProfit(investors[id].refereeId, amount);

        cash = cash.add(allProfit);
        uint256 addShare = amount.mul(investors[id].profitLevel);
        addShare = addShare.sub(allProfit);
        totalShare = totalShare.add(addShare);
    }

    function _payStaticProfit(uint256 id) internal returns (uint256) {

        uint256 allShare = investors[id].amount.mul(investors[id].profitLevel);
        uint256 currentShare = allShare.sub(investors[id].returnAmount);
        uint256 profit = preRewardAmount.mul(currentShare) / preTotalShare;
        uint256 maxprofit = allShare/ 500;
        if (profit > maxprofit) {
            profit = maxprofit;
        }
        profit = _payProfit(id, profit);

        returnRewards[id].staticTimestamp = now;
        returnRewards[id].staticReward = returnRewards[id].staticReward.add(profit);
        returnRewards[id].currentStaticReward = profit;
        return profit;
    }

    function _starProfit0(uint256 id, uint256 amount) internal returns (uint256 allProfit) {
        uint256 height;
        uint256 rate;

        while (id != 0 && height < MAXHEIGHT && rate < 10) {
            if (investors[id].star == 0 || investors[id].amount == 0) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            uint currentRate = 2 * investors[id].star;
            if (currentRate <= rate) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            (rate, currentRate) = (currentRate, currentRate - rate);
            uint256 profit = amount.mul(currentRate) / 100;

            profit = _payProfit(id, profit);
            returnRewards[id].starReward = returnRewards[id].starReward.add(profit);
            allProfit += profit;

            id = investors[id].refereeId;
            height++;
        }
    }

    function _starProfit1(uint256 id, uint256 amount) internal returns (uint256 allProfit) {
        uint256 height;
        uint256 rate;
        uint256 star1;
        uint256 star2;
        uint256 star3;
        uint256 star4;
        uint256 star5;
        while (id != 0 && rate<5 && height < MAXHEIGHT) {
            uint256 value;
            if (investors[id].star == 1 && star1 < 2 && rate < 1 && investors[id].amount != 0) {
                star1++;
                if (star1 == 2) {
                    value = _payProfit(id, amount.mul(1) / 100);
                    allProfit = allProfit.add(value);
                    returnRewards[id].starReward = returnRewards[id].starReward.add(value);
                    rate =1;
                }
            } else if (investors[id].star == 2 && star2 < 2 && rate < 2  && investors[id].amount != 0) {
                star2++;
                if (star2 == 2) {
                    value = _payProfit(id, amount.mul(2-rate) / 100);
                    allProfit = allProfit.add(value);
                    returnRewards[id].starReward = returnRewards[id].starReward.add(value);
                    rate =2;
                }
            } else if (investors[id].star == 3 && star3 < 2 && rate < 3  && investors[id].amount != 0) {
                star3++;
                if (star3 == 2) {
                    value = _payProfit(id, amount.mul(3-rate) / 100);
                    allProfit = allProfit.add(value);
                    returnRewards[id].starReward = returnRewards[id].starReward.add(value);
                    rate =3;
                }
            } else if (investors[id].star == 4 && star4 < 2 && rate < 4  && investors[id].amount != 0) {
                star4++;
                if (star4 == 2) {
                    value = _payProfit(id, amount.mul(4-rate) / 100);
                    allProfit = allProfit.add(value);
                    returnRewards[id].starReward = returnRewards[id].starReward.add(value);
                    rate =4;
                }
            } else if (investors[id].star == 5 && star5 < 2 && rate < 5  && investors[id].amount != 0) {
                star5++;
                if (star5 == 2) {
                    value = _payProfit(id, amount.mul(5-rate) / 100);
                    allProfit = allProfit.add(value);
                    returnRewards[id].starReward = returnRewards[id].starReward.add(value);
                    rate =5;
                }
            }
            id = investors[id].refereeId;
            height++;
        }
    }

    function _starProfit(uint256 id, uint256 amount) internal returns (uint256 allProfit) {
        if (id == 0) {
            return;
        }
        allProfit = allProfit.add(_starProfit0(id, amount));
        allProfit = allProfit.add(_starProfit1(id, amount));

        return;
    }

    function _recommendProfit(uint256 firstId, uint256 amount) internal returns (uint256) {
        if (firstId == 0) {
            return;
        }

        uint256 allProfit;
        allProfit += _caleRecommendProfit(firstId, amount, 10);
        uint256 secondId = investors[firstId].refereeId;

        if (secondId != uint256(0)) {
            allProfit += _caleRecommendProfit(secondId, amount, 7);

            uint256 layer = 3;
            uint256 id = investors[secondId].refereeId;
            while (id != uint256(0) && layer <= 12) {
                if (SafeMath.div(investors[id].recommendAmount, 1e22) >= layer || investors[id].totalAmount >= 1e23) {
                    allProfit += _caleRecommendProfit(id, amount, 1);
                }
                id = investors[id].refereeId;
                layer += 1;
            }
        }
        return allProfit;
    }

    function _caleRecommendProfit(uint256 id, uint256 amount, uint256 rate) internal returns (uint256) {
        if (investors[id].amount == 0) {
            return;
        }

        uint256 profile = amount.mul(rate) / 100;
        profile = _payProfit(id, profile);
        returnRewards[id].recommendReward = returnRewards[id].recommendReward.add(profile);
        return profile;
    }

    function _beforeUpdate() internal {
        if (!Utils.sameDay(now, lastUpdated)) {
            preRewardAmount = _balanceOfSero() / 30;
            preTotalShare = totalShare;

            preWinnersLen = winnersLen;
            preWinnerPool = winnerPool;
            if(winnersLen > 0) {
                uint256 winnerProfit = winnerPool/10;

                uint256 allProfit;
                for(uint256 i=0;i<winnersLen;i++) {
                    uint256 profit = _payProfit(topSixList[i], winnerProfit.mul(winnerRates[i])/100);
                    returnRewards[topSixList[i]].vipReward += profit;
                    allProfit += profit;
                    winners[i*2] = topSixList[i];
                    winners[i*2+1] = profit;
                }

                winnerPool = winnerPool- allProfit;
                winnersLen = 0;
                cash = SafeMath.add(cash, allProfit);
            }

            lastUpdated = now;
        }
    }

    function _balanceOfSero() internal view returns (uint256){
        return sero_balanceOf("SERO").sub(cash).sub(winnerPool);
    }

    function _payProfit(uint id, uint256 amount) internal returns (uint256) {
        if (amount == 0 || investors[id].amount == 0) {
            return;
        }

        uint256 totalProfit = investors[id].amount.mul(investors[id].profitLevel);
        if (amount.add(investors[id].returnAmount) > totalProfit) {
            amount = totalProfit.sub(investors[id].returnAmount);
        }

        investors[id].returnAmount = investors[id].returnAmount.add(amount);
        if (investors[id].returnAmount >= totalProfit) {
            investors[id].amount = 0;
            investors[id].returnAmount = 0;

            //add
            returnRewards[id].staticReward = 0;
            returnRewards[id].recommendReward = 0;
            returnRewards[id].starReward = 0;
            returnRewards[id].vipReward = 0;
        }

        if (!Utils.sameDay(now, returnRewards[id].updateTimestamp)) {
            returnRewards[id].currentIncome = amount;
            returnRewards[id].updateTimestamp = now;
        } else {
            returnRewards[id].currentIncome = returnRewards[id].currentIncome.add(amount);
        }

        investors[id].value = investors[id].value.add(amount);
        return amount;
    }

    function _profitLevel(uint256 amount) internal pure returns (uint256) {
        if (amount < 5e20) {
            return 3;
        } else if (amount < 5e21) {
            return 4;
        } else {
            return 5;
        }
    }
}


contract Ownable {

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

interface CodeService {

    function encode(uint64 n) external view returns (string);

    function decode(string code) external view returns (uint);
}

contract Urcv is InvestorRelationship, Ownable {
    using SafeMath for uint256;
    string private constant SERO_CURRENCY = "SERO";

    uint256 private triggerStaticNum = 40;

    CodeService private codeService;

    address[] marketAddrs;

    constructor(address[] _marketAddrs, address _codeServiceAddr) public {
        codeService = CodeService(_codeServiceAddr);
        marketAddrs = _marketAddrs;
    }

    function setTriggerStaticNum(uint256 _triggerStaticNum) public onlyOwner {
        triggerStaticNum = _triggerStaticNum;
    }

    function balanceOfSero() public view returns (uint256 amount) {
        return _balanceOfSero();
    }

    function id() public view returns (string) {
        uint256 index = getIndexByAddr(msg.sender);
        return codeService.encode(uint64(index));
    }

    function codeExist(string memory code) public view returns (bool) {
        uint256 index = codeService.decode(code);
        return index != 0 && index < investors.length;
    }

    function winnerList() public view returns(string, uint256[], uint256, uint256) {
        strings.slice[] memory parts = new strings.slice[](preWinnersLen);
        uint256[] memory vlues = new uint256[](preWinnersLen);
        for(uint256 i=0;i<preWinnersLen;i++) {
            parts[i] =strings.toSlice(codeService.encode(uint64(winners[i*2])));
            vlues[i] = winners[i*2+1];
        }
        return(strings.join(strings.toSlice(","), parts), vlues, preWinnerPool, winnerPool);
    }


    function details() public view
    returns (string, string, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint8, bool, uint256)  {
        Investor memory i = findByAddr(msg.sender);
        uint256 largeAchievement;
        if (i.largeAreaId != 0) {
            largeAchievement = investors[i.largeAreaId].achievement.add(investors[i.largeAreaId].totalAmount);
        }

        return (codeService.encode(uint64(i.refereeId)), codeService.encode(uint64(i.largeAreaId)), largeAchievement, i.amount, i.returnAmount, i.achievement, i.recommendAmount, i.profitLevel, i.value, i.star, false, i.totalAmount);
    }

    function detailsOfIncome() public view returns (uint256, uint256, uint256, uint256, uint256, uint256){
        uint256 index = getIndexByAddr(msg.sender);
        uint256 currentIncome;
        if (Utils.sameDay(returnRewards[index].updateTimestamp, now)) {
            currentIncome = returnRewards[index].currentIncome;
        }

        return (returnRewards[index].staticReward, returnRewards[index].recommendReward, returnRewards[index].starReward, returnRewards[index].vipReward, currentIncome, returnRewards[index].staticTimestamp);
    }

    function withdrawBalance() public {
        uint value = _withdrawBalance(msg.sender);
        if (value > 0) {
            require(sero_send_token(msg.sender, SERO_CURRENCY, value));
        }
    }

    function registerNode(address addr) public onlyOwner {
        require(!Utils.isContract(addr));
        insert(0, 0, addr);
    }

    function triggerStaticProfit() public {
        uint256 index = getIndexByAddr(msg.sender);
        require(index != 0);
        payStaticProfit(index, triggerStaticNum);
    }

    function calcuStaticProfit() public view returns (uint256) {
        uint256 index = getIndexByAddr(msg.sender);
        require(index != 0);
        _beforeUpdate();

        if (Utils.sameDay(now, returnRewards[index].staticTimestamp)) {
            return returnRewards[index].currentStaticReward;
        }

        return _payStaticProfit(index);
    }

    function invest(string memory refereeCode) public payable returns (bool){
        require(Utils._stringEq(SERO_CURRENCY, sero_msg_currency()));
        require(!Utils.isContract(msg.sender));

        require(msg.value >= 1e19);


        uint256 index = getIndexByAddr(msg.sender);
        if (index == 0) {
            uint256 refereeId = codeService.decode(refereeCode);
            require(refereeId != 0 && refereeId < investors.length);
            insert(refereeId, msg.value, msg.sender);
        } else {
            update(index, msg.value);
        }

        for(uint256 i=0;i<marketAddrs.length;i++) {
            require(sero_send_token(marketAddrs[i],"SERO",msg.value/100));
        }
        return true;
    }
}