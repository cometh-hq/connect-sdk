import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

class StubProvider extends JsonRpcProvider {
  async estimateGas(): Promise<BigNumber> {
    return BigNumber.from(123)
  }
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
  async signMessage(): Promise<string> {
    return '0x_signature'
  }
}

export default StubProvider
