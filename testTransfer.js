const { TelosEvmApi } = require('./dist/telosevm-js.umd.js')
const fetch = require('node-fetch')

let api = new TelosEvmApi({
    // Ensure the API has console printing enabled
    endpoint: 'https://testnet.telos.net',

    // Must match the chain ID the contract is compiled with (1 by default)
    chainId: 41,

    // Enter your own private keys if you wish to sign transaction (examples provided)
    ethPrivateKeys: [
      '0x8dd3ec4846cecac347a830b758bf7e438c4d9b36a396b189610c90b57a70163d',
    ],

    fetch,

    // Enter Telos account that EVM contract is at / will be deployed to
    telosContract: 'evmcontract4',

    // Enter your own private keys (examples provided)
    telosPrivateKeys: [
      '5JACk8gJ98x3AkypbicNQviXzkqAM2wbbE3FtA79icT2Ks4bWws',
      '5JD8vs9sYQiijEkD29cZgV6QNwWb6rgVkaW7J9z8uKy6VqkJ7XF'
    ]
  })

console.log('Starting...')

;(async () => {
  const tlosTransfer = await api.transfer({ rawSign: true, account: 'evmcontract4', sender: '0xf79b834a37f3143f4a73fc3934edac67fd3a01cd', to: '0xf79b834a37f3143f4a73fc3934edac67fd3a01cd', quantity: `0.0100 TLOS` })
  console.dir(tlosTransfer)
})()