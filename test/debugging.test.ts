import { TelosEvmApi } from '../src/telos-evm-js'
import { allowanceAddress, api, sender, ethContractAddress } from './common'

describe('Debug Test', () => {
  it(`transfer from`, async () => {
    console.log(await api.tlos.getEthAccountByEosAccount('vestvestvest'))
  })
})
