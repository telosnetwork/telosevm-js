import * as ethTx from '@ethereumjs/tx'
const { Transaction } = ethTx
import Common from '@ethereumjs/common'
import { privateToAddress } from 'ethereumjs-util'
import { TelosApi } from './telos'
export { EVMTransaction } from './transaction'
export { TransactionVars } from './telos'
import {
  ETH_CHAIN,
  FORK,
  TLOS_TO_WEI_CONVERSION,
  DEFAULT_GAS_LIMIT,
  DEFAULT_CHAIN_ID,
  DEFAULT_VALUE,
  DEFAULT_SYMBOL
} from './constants'
import abiEncoder from 'ethereumjs-abi'

export class TelosEvmApi {
  ethPrivateKeys: any
  chainId: any
  chainConfig: any
  abi: any
  eth: any
  ethContract: string | undefined
  telos: TelosApi
  debug: boolean

  constructor({
    ethPrivateKeys,
    telosPrivateKeys,
    signingPermission,
    endpoint,
    telosContract,
    ethContract,
    chainId = DEFAULT_CHAIN_ID,
    fetch
  }: {
    ethPrivateKeys?: any
    telosPrivateKeys: string[]
    signingPermission?: string
    endpoint: string
    telosContract: string
    ethContract?: string
    chainId: number
    fetch: any
  }) {
    this.telos = new TelosApi({
      telosPrivateKeys,
      signingPermission,
      endpoint,
      telosContract,
      fetch,
      chainId
    })
    this.chainId = chainId
    this.ethContract = ethContract
    this.chainConfig = Common.forCustomChain(ETH_CHAIN, { chainId }, FORK)
    this.debug = false

    this.ethPrivateKeys = ethPrivateKeys.reduce(
      (acc: any, privateKey: string) => {
        if (privateKey.substr(0, 2) === '0x') {
          privateKey = privateKey.substring(2)
        }
        const privateBuffer = Buffer.from(privateKey, 'hex')
        const address = `0x${privateToAddress(privateBuffer).toString('hex')}`
        acc[address] = privateBuffer
        return acc
      },
      {}
    )
  }

  setDebug(b: boolean) {
    this.debug = b
    this.telos.setDebug(b)
  }

  /**
   * Sets the address for ethereum contract
   *
   * @param contract ethereum contract address
   */
  async setEthereumContract(contract: string) {
    if (contract.substr(0, 2) !== '0x') contract = `0x${contract}`
    this.ethContract = contract
  }

  /**
   * Initializes Web3 like interface to send actions to EVM
   *
   * @param {object} [args={}] Arguments
   * @param {string} [args.account]  Telos account to interact with EVM
   * @param {object} [args.abi]  ABI object
   * @param {string} [args.bytecodeObject]  Bytecode object
   */
  async loadContractFromAbi({
    account,
    abi,
    bytecodeObject
  }: {
    account: string
    abi: any
    bytecodeObject: string
  }) {
    // Load interface
    let abiInterface: any = {
      function: [],
      event: [],
      constructor: []
    }
    for (const item of abi) {
      abiInterface[item.type].push(item)
    }
    this.abi = abi

    const that = this
    let eth: any = {}

    // Populate functions
    for (const action of abiInterface.function) {
      eth[action.name] = async function(...args: any[]) {
        const types = action.inputs.map((i: any) => i.type)
        const names = action.inputs.map((i: any) => i.name)
        const outputTypes = action.outputs.map((i: any) => i.type)

        // Default
        let overrides: any = {}

        // Validation
        if (
          args.length === types.length + 1 &&
          typeof args[args.length - 1] === 'object'
        ) {
          overrides = args[args.length - 1]
          args.pop()
        }
        if (args.length !== types.length) {
          throw new Error(
            `${types.length} arguments expected for function ${action.name}: ${names}`
          )
        }
        if (!that.ethContract) {
          throw new Error(
            'Please initialize loadContractFromAbi with ethContract or deploy() to insert automatically'
          )
        }

        // Encode
        const methodID = abiEncoder.methodID(action.name, types).toString('hex')
        const params = abiEncoder.rawEncode(types, args).toString('hex')
        const input = `0x${methodID}${params}`

        // If call (non state modifying)
        if (action.stateMutability && action.stateMutability === 'view') {
          // Create call object
          const txParams = Object.assign(
            { data: input, to: that.ethContract },
            overrides
          )
          const encodedTx = await that.createEthTx(txParams)

          // Get output from call and parse it
          const output = await that.telos.call({
            account,
            tx: encodedTx,
            sender: txParams.sender
          })
          const parsed = abiEncoder.rawDecode(
            outputTypes,
            Buffer.from(output, 'hex')
          )
          return parsed
        }
        // If transaction (standard transaction)
        else {
          if (!overrides.sender) {
            throw new Error(
              'Must provide sender to function like { sender: ADDRESS } as last argument'
            )
          }

          // Create transaction object
          const txParams = Object.assign(
            { data: input, to: that.ethContract },
            overrides
          )
          const encodedTx = await that.createEthTx(txParams)

          // Send transaction
          return that.telos.raw({
            account,
            tx: encodedTx,
            sender: txParams.sender
          })
        }
      }
    }

    eth['deploy'] = async function(...args: any[]) {
      const types = abiInterface.constructor[0].inputs.map((i: any) => i.type)
      const names = abiInterface.constructor[0].inputs.map((i: any) => i.name)

      // Default
      let overrides: any = {}

      // Validation
      if (
        args.length === types.length + 1 &&
        typeof args[args.length - 1] === 'object'
      ) {
        overrides = args[args.length - 1]
        args.pop()
      }
      if (args.length != types.length) {
        throw new Error(
          `${types.length} arguments expected for deploy: ${names}`
        )
      }
      if (!overrides.sender) {
        throw new Error(
          'Must provide sender to function like { sender: ADDRESS } as last argument'
        )
      }

      // Encode params
      const params = abiEncoder.rawEncode(types, args).toString('hex')
      const data = `0x${bytecodeObject}${params}`

      // Create transaction and send it
      const txParams = Object.assign({ data, to: undefined }, overrides)
      const encodedTx = await that.createEthTx(txParams)
      const result = await that.telos.raw({
        account,
        tx: encodedTx,
        sender: txParams.sender
      })

      return result
    }

    this.eth = eth
  }

  /**
   * Transfers value inside EVM
   *
   * @param {object} [args={}] Arguments
   * @param {string} [args.account] The Telos account associated to ETH address
   * @param {string} [args.sender] The ETH address sending the TX
   * @param {string} [args.to] The ETH address receiving the transfer
   * @param {string} [args.quantity] The amount to transfer
   * @param {boolean} [args.rawSign] Whether to sign transaction with ethereum private key. False means to use Telos authorization
   * @param {boolean} [args.returnRaw] Whether to actually execute the transfer or just return the raw transfer transaction
   *
   * @returns {Promise<EvmResponse>} EVM receipt and Telos receipt
   */
  async transfer(
    {
      account,
      sender,
      to,
      quantity,
      rawSign = false,
      returnRaw = false
    }: {
      account: string
      sender: string
      to: string
      quantity: string
      rawSign?: boolean
      returnRaw?: boolean
    },
    overrides?: any
  ) {
    const [amount, symbol] = quantity.split(' ')
    if (symbol !== DEFAULT_SYMBOL)
      throw new Error(
        'Must provide asset as quantity to transfer like 0.0001 TLOS'
      )
    if (!sender) throw new Error('Must provide sender to transfer function')
    if (!amount)
        throw new Error('Amount is invalid');

    const params = Object.assign(
      {
        sender,
        to,
        value: parseFloat(amount) * Math.pow(10, TLOS_TO_WEI_CONVERSION),
        rawSign
      },
      overrides
    )
    const tx = await this.createEthTx(params)
    if (returnRaw) return tx

    return this.telos.raw({ account, tx, sender })
  }

  /**
   * Generates RLP encoded transaction sender parameters
   *
   * @param {object} [args={}] Arguments
   * @param {string} [args.sender]  The ETH address sending the transaction (nonce is fetched on-chain for this address)
   * @param {object} [args.data] The data in transaction
   * @param {string} [args.gasLimit]  The gas limit of the transaction
   * @param {string} [args.value]  The value in the transaction
   * @param {string} [args.to]  The ETH address to send transaction to
   * @param {string} [args.sign]  Whether to sign the transaction
   *
   * @returns {Promise<string>}RLP encoded transaction
   */
  async createEthTx({
    sender,
    data,
    gasLimit,
    value,
    to,
    rawSign = false
  }: {
    sender?: string
    data?: string
    gasLimit?: string | Buffer
    value?: number | Buffer
    to?: string
    rawSign?: boolean
  }) {
    const nonce = await this.telos.getNonce(sender)
    const gasPrice = await this.telos.getGasPrice()
    const txData = {
      nonce,
      gasPrice: `0x${gasPrice.toString(16)}`,
      gasLimit:
        gasLimit !== undefined
          ? `0x${(gasLimit as any).toString(16)}`
          : DEFAULT_GAS_LIMIT,
      value:
        value !== undefined
          ? `0x${(value as any).toString(16)}`
          : DEFAULT_VALUE,
      to,
      data
    }

    const tx = new Transaction(txData, { common: this.chainConfig })

    if (rawSign) {
      if (!sender)
        throw new Error(
          'Signature requested in createEthTx, but no sender provided'
        )

      sender = sender.toLowerCase()
      if (!this.ethPrivateKeys[sender]) {
        console.log(this.ethPrivateKeys)
        throw new Error('No private key provided for ETH address ' + sender)
      }
      tx.sign(this.ethPrivateKeys[sender])
    }

    return tx.serialize().toString('hex')
  }
}
