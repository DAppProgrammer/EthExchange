pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/safeMath.sol";

contract Token {
  using SafeMath for uint;

  //variables
  string public name = 'Dapp Token';
  string public symbol = 'DAPP';
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  constructor() public {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }
  /* Events */
  event Transfer(address indexed from, address indexed to, uint256 value);
  /* Send tokens */
  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(_to != address(0),'Invalid recipient address');
    require(balanceOf[msg.sender] >= _value,'Do not have enough balance to transfer');

    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }
}
