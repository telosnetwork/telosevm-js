# Telos EVM JS SDK

### Installation

Requires nodejs and npm installed

```bash
npm install @telosnetwork/telosevm-js
```

### How to setup EVM and deploy ERC-20 Token on EOSIO in 5 minutes

```js
const { TelosEvmApi } = require('telosevm-js')
const fetch = require('node-fetch') // only for node
const evmContractAccount = 'evmcontract2'
const evmNormalAccount = 'evmaccount11'
const SYSTEM_SYMBOL = 'TLOS'

const api = new TelosEvmApi({
  // Ensure the API has console printing enabled
  endpoint: 'https://api.telos-test.eostribe.io',

  // Must match the chain ID the contract is compiled with (1 by default)
  chainId: 41,

  // Enter your own private keys if you wish to sign transaction (examples provided)
  ethPrivateKeys: [
    // Public Key: 0xf79b834a37f3143f4a73fc3934edac67fd3a01cd
    '0x8dd3ec4846cecac347a830b758bf7e438c4d9b36a396b189610c90b57a70163d',
  ],

  // Enter Telos account that EVM is at / will be deployed to
  telosContract: evmContractAccount,

  fetch: fetch,
  // Enter your own private keys (examples provided)
  telosPrivateKeys: [
    // evmcontract2 (EOS7DJzWuEr1Zu36ZX8GXwGsvNNqdGqx8QRs7KPkqCMTxG6MBT1Eu)
    '5JACk8gJ98x3AkypbicNQviXzkqAM2wbbE3FtA79icT2Ks4bWws',
    // evmaccount11 (EOS8Z9y2b1GfAkFUQxBTsiu9DJSLebVoU8cpwLAfXcgWDRWg9aM2Q)
    '5JhwbcHTVk16Pv7fCgitNSHgwGwjAPEgEJbiaCcXaza1PKrbCns'
  ]
})

// Import contract compiled with solc (check telosevm-js/src/eth-contracts/compile.ts to compile your own)
// We provide compiled ERC20 and ERC721 contracts
// NOTE: this may not be included in the NPM, possibly download from github
const compiledErc20AndErc721 = require('@telosnetwork/telosevm-js/dist/eth-contracts/compiled.json')

// Load ETH contracts with abi and bytecode, plus the TX sending Telos account
api.loadContractFromAbi({
  account: evmNormalAccount, // Example Telos account
  abi: compiledErc20AndErc721.contracts.ERC20.Token.abi,
  bytecodeObject: compiledErc20AndErc721.contracts.ERC20.Token.evm.bytecode.object
})

async function main () {
  // For development (if TESTING is enabled in contract), clears all data in contract
  await api.telos.clearAll()

  // Creates new address based on RLP(eosaccount, arbitrarydata)
  await api.telos.create({ account: evmNormalAccount, data: 'test' })

  // Transfer Telos to contract to deposit to address
  await api.telos.deposit({ from: evmNormalAccount, quantity: `0.0002 ${SYSTEM_SYMBOL}` })

  // Get all data for new address (address, account, nonce, balance, code)
  const sender = await api.telos.getEthAccountByTelosAccount(evmNormalAccount)
  console.log(`${sender.address} (${evmNormalAccount}) Balance:`, sender.balance) // 0.0001 TLOS
  console.log(`${sender.address} (${evmNormalAccount}) Nonce:`, sender.nonce) // 0

  // Deploy ERC20 contract (Name, Symbol, Decimals, Total Supply)
  // The returned response "eth" is the EVM transaction receipt, and "tlos" is the Telos transaction receipt
  const { eth, tlos } = await api.eth.deploy('FIRE Token', 'FIRE', 4, 1000000, { sender: sender.address })

  // Set the created address as the EVM contract to interact with
  api.setEthereumContract(eth.createdAddress)

  // Query ERC20 balance using "view" function calls
  console.log(`${sender.address} FIRE Balance: `, +(await api.eth.balanceOf(sender.address)).toString(10)) // 1,000,000

  // New receiver address to send tokens to
  const receiver = '0xf79b834a37f3143f4a73fc3934edac67fd3a01cd'

  // Transfer system tokens to address to create it
  await api.transfer({ account: evmNormalAccount, sender: sender.address, to: receiver, quantity: `0.0001 ${SYSTEM_SYMBOL}` })

  // Transfer 1000 FIRE ERC20 tokens
  await api.eth.transfer(receiver, 1000, { sender: sender.address })

  // Query ERC20 FIRE balance using "view" function calls
  console.log(`${sender.address} Balance:`, +(await api.eth.balanceOf(sender.address)).toString(10), 'FIRE') // 999,000
  console.log(`${receiver} Balance:`,       +(await api.eth.balanceOf(receiver)).toString(10), 'FIRE'), //   1,000

  // Set allowance, and modify it
  await api.eth.approve(receiver, 100, { sender: sender.address })
  await api.eth.increaseAllowance(receiver, 1000, { sender: sender.address })
  await api.eth.decreaseAllowance(receiver, 600, { sender: sender.address })

  // Query allowance (another example of using non-state modifying calls)
  const allowance = await api.eth.allowance(sender.address, receiver, { sender: receiver })
  console.log(`Allowance for ${sender.address}->${receiver}:`, +allowance.toString(10), 'FIRE') // 500

  // Use the allowance to transfer
  // rawSign uses ethereum private key to sign instead of EOSIO account permissions
  await api.eth.transferFrom(sender.address, receiver, 500, { sender: receiver, rawSign: true })

  // Withdraw tokens
  await api.telos.withdraw({ account: evmNormalAccount, quantity: `0.0001 ${SYSTEM_SYMBOL}` })

  // Other available functions, check docs
  // await getStorageAt(address, key)
  // await createEthTx({ sender, data, gasLimit, value, to, rawSign = false })
  // async getNonce(address)
  // async getEthAccount(address)
}

main()
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents
