const { TelosEvmApi } = require('./lib/cjs/telosevm-js')
const fetch = require('node-fetch')

let api = new TelosEvmApi({
    // Ensure the API has console printing enabled
    //endpoint: 'https://testnet.telos.net',
    //endpoint: 'https://testnet.telos.caleos.io',
    endpoint: 'https://mainnet.telos.net',
    //endpoint: 'https://test.telos.eosusa.io',

    // Must match the chain ID the contract is compiled with (1 by default)
    chainId: 40,

    // Enter your own private keys if you wish to sign transaction (examples provided)
    // address: 0xf79B834A37f3143F4a73fC3934eDac67fd3a01CD
    ethPrivateKeys: [
      '0x8dd3ec4846cecac347a830b758bf7e438c4d9b36a396b189610c90b57a70163d',
    ],

    fetch,

    // Enter Telos account that EVM contract is at / will be deployed to
    telosContract: 'eosio.evm',

    // Enter your own private keys (examples provided)
    telosPrivateKeys: [
      '5JACk8gJ98x3AkypbicNQviXzkqAM2wbbE3FtA79icT2Ks4bWws',
      '5JD8vs9sYQiijEkD29cZgV6QNwWb6rgVkaW7J9z8uKy6VqkJ7XF'
    ]
  })

console.log('Starting...')

;(async () => {
    //const address = '0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E';  // WTLOS mainnet
    //const address = '0xB007F1455d2b23929C81290845F1cdb27C1d76a8';  // TESTER token testnet
    const account = await api.telos.getEthAccount(address.toLowerCase());
    console.log(typeof account.code)
    /*
    console.log('0x' + Buffer.from(account.code).toString("hex"))  // bad
    console.log('0x' + account.code)  // good
     */
})()