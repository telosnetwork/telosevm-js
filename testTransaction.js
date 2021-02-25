const { EVMTransaction } = require('./src/transaction')
const { Api, JsonRpc } = require('eosjs')
const { TextEncoder, TextDecoder } = require('text-encoding')
const fetch = require('node-fetch')
const axios = require('axios')

let rpc = new JsonRpc('https://testnet.telos.net', { fetch })

let hyperionAxios = axios.create({
    baseURL: 'https://testnet.telos.net'
})

;(async () => {
    let trx = await EVMTransaction.fromHash(rpc, hyperionAxios, 'evmcontract4', 'a8bc9b24b2a2ad1f405bda4c74d4d27b7bd36949afe71763134534f055a6a8a4')
    console.log('foo')
    console.dir(trx.toTransaction(21))
})()