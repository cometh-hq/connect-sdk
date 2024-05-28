import { ethers } from 'ethers'

const getTokenName = async (
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<string> => {
  const ERC20_ABI = ['function name() view returns (string)']
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

  try {
    return await tokenContract.name()
  } catch (error) {
    console.log(`Error fetching token name for ${tokenAddress}:`, error)
    return 'Units'
  }
}

export default {
  getTokenName
}
