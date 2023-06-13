import { API } from '../services'

const getApi = (apiKey: string, chainId: number): API => {
  return new API(apiKey, chainId)
}

export default {
  getApi
}
