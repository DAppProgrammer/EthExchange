pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/safeMath.sol";

contract Token {
  using SafeMath for uint;

  string public name = 'DApp Token';
  string public symbol = 'DAPP';
  uint256 public decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  constructor() public {
    totalSupply = 1000000 * (10 ** decimals);
    balanceOf[msg.sender] = totalSupply;
  }

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balanceOf[msg.sender] >= _value,'Do not have enough balance to transfer');
    _transfer(msg.sender, _to, _value);
    return true;
  }

  function _transfer(address _from, address _to, uint256 _value) internal {
    require(_to != address(0),'Invalid recipient address');
    balanceOf[_from] = balanceOf[_from].sub(_value);
    balanceOf[_to] = balanceOf[_to].add(_value);
    emit Transfer(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public returns(bool success) {
    require(_spender != address(0),'Invalid spender address');
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns(bool success) {
    require(_value <= balanceOf[_from],'Insufficent balance to transfer');
    require(_value <= allowance[_from][msg.sender],'allowance less than value');
    allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
    _transfer(_from, _to, _value);
    return true;
  }

}
