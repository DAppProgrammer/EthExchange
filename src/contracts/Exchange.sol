pragma solidity ^0.5.0;

import './Token.sol';
import "openzeppelin-solidity/contracts/math/safeMath.sol";

// Deposit and Withdraw funds
// Manage Orders - Make or Cancel
// Handle Trades - Charge fees

// TODO:
// [X] Set the fee account
// [X] Deposit Ether
// [] Withdraw Ether
// [X] Deposit tokens
// [] Withdraw tokens
// [X] Check balances
// [] Make order
// [] Cancel order
// [] Fill order
// [] Charge fees

contract Exchange {
  using SafeMath for uint;
  //variables
  address public feeAccount;            //the account that receives exchange fees
  uint public feePercent;               //the fee percentage
  address constant ETHER = address(0);  //store ether in tokens mapping with blank address
  /** (token-address => (user-address => balance)) */
  mapping(address => mapping(address => uint)) public tokens;

  //Events
  event Deposit(address token, address user, uint256 amount, uint256 balance);

  constructor (address _feeAccount, uint _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  //Fallback: reverts if Ether is sent to this smart contract address directily by mistake
  function() external {
    revert('revert ether');
  }

  function depositEther() public payable {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    require(_token != ETHER,'cannot deposit ether');
    require(Token(_token).transferFrom(msg.sender, address(this), _amount),'Error deposting token');
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }
}
