export const bridgeJson = {
  "abi": [
    {
      "inputs": [{ "internalType": "contract ITeraBlockToken", "name": "_token", "type": "address" }],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "userAddress", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "indexed": true, "internalType": "string", "name": "burntTxHash", "type": "string" }
      ],
      "name": "Deposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "address", "name": "ownerAddress", "type": "address" },
        { "indexed": false, "internalType": "address", "name": "relayerAddress", "type": "address" },
        { "indexed": false, "internalType": "bytes", "name": "functionSignature", "type": "bytes" },
        { "indexed": false, "internalType": "bytes", "name": "returnData", "type": "bytes" }
      ],
      "name": "MetaTransactionExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "inputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "name": "burntTxHashes",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "user", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "string", "name": "burntTxHash", "type": "string" }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "bytes", "name": "functionSignature", "type": "bytes" },
        { "internalType": "bytes32", "name": "sigR", "type": "bytes32" },
        { "internalType": "bytes32", "name": "sigS", "type": "bytes32" },
        { "internalType": "uint8", "name": "sigV", "type": "uint8" }
      ],
      "name": "executeMetaTransaction",
      "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getChainId",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getDomainSeperator",
      "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
      "name": "getNonce",
      "outputs": [{ "internalType": "uint256", "name": "nonce", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    },
    { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token",
      "outputs": [{ "internalType": "contract ITeraBlockToken", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
  ]
}
