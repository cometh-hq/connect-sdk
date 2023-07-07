import Bowser from 'bowser'

import { DeviceData } from '../wallet'

const getDeviceData = (): DeviceData => {
  const userAgentDataBrands = (navigator as any).userAgentData
    ? (navigator as any).userAgentData.brands
    : undefined

  const result: any = Bowser.getParser(window.navigator.userAgent)
  const browser = userAgentDataBrands
    ? userAgentDataBrands[userAgentDataBrands.length - 1].brand
    : result.parsedResult.browser.name
  const os = result.parsedResult.os.name
  const platform = result.parsedResult.platform.type

  return { browser, os, platform }
}

export default {
  getDeviceData
}
