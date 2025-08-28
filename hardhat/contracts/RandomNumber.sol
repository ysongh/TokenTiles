// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { RandomnessReceiverBase } from "randomness-solidity/src/RandomnessReceiverBase.sol";

contract RandomNumber is RandomnessReceiverBase {
  /// @notice Stores the latest received randomness value
  bytes32 public randomness;

  /// @notice Stores the request ID of the latest randomness request
  uint256 public requestId;

  constructor(address _randomnessSender) RandomnessReceiverBase(_randomnessSender, msg.sender){}

  /// @notice Requests randomness using the direct funding option
  /// @dev Calls `_requestRandomnessPayInNative` to get a random value, updating `requestId` with the request ID
  function generateWithDirectFunding(uint32 callbackGasLimit) external payable returns (uint256, uint256) {
      // create randomness request
      (uint256 requestID, uint256 requestPrice) = _requestRandomnessPayInNative(callbackGasLimit);
      // store request id
      requestId = requestID;
      return (requestID, requestPrice);
  }

  /// @notice Callback function that processes received randomness
  /// @dev Ensures the received request ID matches the stored one before updating state
  /// @param requestID The ID of the randomness request
  /// @param _randomness The random value received from the oracle
  function onRandomnessReceived(uint256 requestID, bytes32 _randomness) internal override {
      require(requestId == requestID, "Request ID mismatch");
      randomness = _randomness;
  }
}