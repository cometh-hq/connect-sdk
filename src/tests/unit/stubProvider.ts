import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

//single count tx
const encodedResponseSingleCount =
  '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000002093000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000'
//multiple count tx
const encodedResponseMultipleCount =
  '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000035ba000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000'

class StubProvider extends JsonRpcProvider {
  async estimateGas(): Promise<BigNumber> {
    return BigNumber.from(123)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(): Promise<any> {
    const reward = BigNumber.from(10)
    const baseFeePerGas = BigNumber.from(100)
    return {
      reward: [[reward]],
      baseFeePerGas: [baseFeePerGas]
    }
  }
  async getBalance(): Promise<BigNumber> {
    return ethers.utils.parseUnits('0.12345', 'ether')
  }

  async call(): Promise<string> {
    return encodedResponseSingleCount
  }
}

class StubProviderMultiSend extends JsonRpcProvider {
  async call(): Promise<string> {
    return encodedResponseMultipleCount
  }
}

export default { StubProvider, StubProviderMultiSend }
