/*  eth_getTransactionByHash
Object - A transaction object, or null when no transaction was found:

blockHash: DATA, 32 Bytes - hash of the block where this transaction was in. null when its pending.
blockNumber: QUANTITY - block number where this transaction was in. null when its pending.
from: DATA, 20 Bytes - address of the sender.
gas: QUANTITY - gas provided by the sender.
gasPrice: QUANTITY - gas price provided by the sender in Wei.
hash: DATA, 32 Bytes - hash of the transaction.
input: DATA - the data send along with the transaction.
nonce: QUANTITY - the number of transactions made by the sender prior to this one.
to: DATA, 20 Bytes - address of the receiver. null when its a contract creation transaction.
transactionIndex: QUANTITY - integer of the transactions index position in the block. null when its pending.
value: QUANTITY - value transferred in Wei.
v: QUANTITY - ECDSA recovery id
r: DATA, 32 Bytes - ECDSA signature r
s: DATA, 32 Bytes - ECDSA signature s
*/

import { AxiosInstance } from "axios"
import { JsonRpc } from "eosjs"

/* eth_getTransactionReceipt
Object - A transaction receipt object, or null when no receipt was found:

transactionHash : DATA, 32 Bytes - hash of the transaction.
transactionIndex: QUANTITY - integer of the transactions index position in the block.
blockHash: DATA, 32 Bytes - hash of the block where this transaction was in.
blockNumber: QUANTITY - block number where this transaction was in.
from: DATA, 20 Bytes - address of the sender.
to: DATA, 20 Bytes - address of the receiver. null when its a contract creation transaction.
cumulativeGasUsed : QUANTITY  - The total amount of gas used when this transaction was executed in the block.
gasUsed : QUANTITY  - The amount of gas used by this specific transaction alone.
contractAddress : DATA, 20 Bytes - The contract address created, if the transaction was a contract creation, otherwise null.
logs: Array - Array of log objects, which this transaction generated.
logsBloom: DATA, 256 Bytes - Bloom filter for light clients to quickly retrieve related logs.
It also returns either :

root : DATA 32 bytes of post-transaction stateroot (pre Byzantium)
status: QUANTITY either 1 (success) or 0 (failure)
*/

/*
Object - A block object, or null when no block was found:

number: QUANTITY - the block number. null when its pending block.
hash: DATA, 32 Bytes - hash of the block. null when its pending block.
parentHash: DATA, 32 Bytes - hash of the parent block.
nonce: DATA, 8 Bytes - hash of the generated proof-of-work. null when its pending block.
sha3Uncles: DATA, 32 Bytes - SHA3 of the uncles data in the block.
logsBloom: DATA, 256 Bytes - the bloom filter for the logs of the block. null when its pending block.
transactionsRoot: DATA, 32 Bytes - the root of the transaction trie of the block.
stateRoot: DATA, 32 Bytes - the root of the final state trie of the block.
receiptsRoot: DATA, 32 Bytes - the root of the receipts trie of the block.
miner: DATA, 20 Bytes - the address of the beneficiary to whom the mining rewards were given.
difficulty: QUANTITY - integer of the difficulty for this block.
totalDifficulty: QUANTITY - integer of the total difficulty of the chain until this block.
extraData: DATA - the “extra data” field of this block.
size: QUANTITY - integer the size of this block in bytes.
gasLimit: QUANTITY - the maximum gas allowed in this block.
gasUsed: QUANTITY - the total used gas by all transactions in this block.
timestamp: QUANTITY - the unix timestamp for when the block was collated.
transactions: Array - Array of transaction objects, or 32 Bytes transaction hashes depending on the last given parameter.
uncles: Array - Array of uncle hashes.
*/

import { Transaction } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'
import { keccak256 } from 'ethereumjs-util'
const LOGS_BLOOM_EMPTY =
  '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
import { ETH_CHAIN, FORK } from './constants'

export class EVMTransaction {
  receiptRow: any
  actionData: any
  chainConfig: any
  transaction: Transaction

  constructor(receiptRow: any, actionData: any, chainId: any) {
    this.receiptRow = receiptRow
    this.actionData = actionData
    this.chainConfig = Common.forCustomChain(ETH_CHAIN, { chainId }, FORK)
    this.transaction = Transaction.fromSerializedTx(Buffer.from(`0x${actionData.tx.toLowerCase()}`),  { common: this.chainConfig })
  }

  getBlockNumber() {
    return this.receiptRow.block.toString(16)
  }

  getTransactionIndex() {
    return this.receiptRow.trx
  }

  getTransactionHash() {
    return this.receiptRow.hash
  }

  toTransaction() {
    return formatTransaction({
      blockHash: EVMTransaction.blockNumberToHash(this.receiptRow.block),
      blockNumber: this.receiptRow.block.toString(16),
      from: this.actionData.sender,
      gas: this.transaction.gasLimit.toString('hex'),
      gasPrice: this.transaction.gasPrice.toString('hex'),
      hash: this.receiptRow.hash,
      input: this.transaction.data.toString('hex'),
      nonce: this.transaction.nonce.toString('hex'),
      to: this.transaction.to?.toBuffer().toString('hex'),
      transactionIndex: this.receiptRow.trx_index.toString(16),
      value: this.transaction.value.toString('hex'),
      v: this.transaction.v?.toString('hex'),
      r: this.transaction.r?.toString('hex'),
      s: this.transaction.s?.toString('hex')
    })
  }

  toTransactionReceipt() {
    return formatTransaction({
      transactionHash: this.receiptRow.hash,
      transactionIndex: this.receiptRow.trx_index.toString(16),
      blockHash: EVMTransaction.blockNumberToHash(this.receiptRow.block),
      blockNumber: this.receiptRow.block.toString(16),
      from: this.actionData.sender,
      to: this.transaction.to?.toBuffer().toString('hex'),
      cumulativeGasUsed: this.receiptRow.gasused,
      gasUsed: this.receiptRow.gasused,
      contractAddress: this.receiptRow.createdaddr
        ? this.receiptRow.createdaddr
        : null,
      logs: JSON.parse(this.receiptRow.logs || []),
      logsBloom: LOGS_BLOOM_EMPTY,
      status: this.receiptRow.status.toString(16)
    })
  }

  static blockNumberToHash(num: number) {
    return keccak256(num.toString(16)).toString('hex')
  }

  static async fromHash(
    rpc: JsonRpc,
    chainId: any,
    hyperionAxios: AxiosInstance,
    telosContract: any,
    hash: any,
    from: any,
    transactionData: any
  ) {
    let receiptRows = await rpc.get_table_rows({
      code: telosContract,
      scope: telosContract,
      table: 'receipt',
      key_type: 'sha256',
      index_position: 2,
      lower_bound: hash,
      upper_bound: hash,
      limit: 1
    })

    if (receiptRows.rows.length && receiptRows.rows[0].hash == hash) {
      let receiptRow = receiptRows.rows[0]
      let actionData
      if (!transactionData || !from) {
        let transactionResult = await hyperionAxios.get(
          `/v2/history/get_transaction?id=${receiptRow.trxid}`
        )
        let action = transactionResult.data.actions.find(
          (action: any) =>
            action.act.account == telosContract && action.act.name == 'raw'
        )
        actionData = action.act.data
      } else {
        actionData = { tx: transactionData, sender: from }
      }
      return new EVMTransaction(receiptRow, actionData, chainId)
    } else {
      return null
    }
  }
}

function formatTransaction(trx: any) {
  let clone = Object.assign({}, trx)
  let prefixedKeys = [
    'blockHash',
    'blockNumber',
    'from',
    'cumulativeGasUsed',
    'gasUsed',
    'gas',
    'gasPrice',
    'hash',
    'transactionHash',
    'ramBytesUsed',
    'contractAddress',
    'createdAddress',
    'output',
    'input',
    'nonce',
    'to',
    'transactionIndex',
    'value',
    'v',
    'r',
    's'
  ]
  prefixedKeys.forEach(key => {
    if (
      clone.hasOwnProperty(key) &&
      typeof clone[key] == 'string' &&
      !clone[key].startsWith('0x')
    )
      clone[key] = `0x${
        shouldUpperCaseReturn(key) ? clone[key] : clone[key].toUpperCase()
      }`
  })
  return clone
}

function shouldUpperCaseReturn(keyName: string) {
  let upperCaseProps = ['to', 'from', 'contractAddress']
  return upperCaseProps.includes(keyName)
}