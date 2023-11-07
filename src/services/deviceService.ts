import Bowser from 'bowser'

import { DeviceData } from '../wallet'

const getDeviceData = (): DeviceData => {
  const result: any = Bowser.getParser(window.navigator.userAgent)

  const browser = result.parsedResult.browser.name
  const os = result.parsedResult.os.name
  const platform = result.parsedResult.platform.type

  return { browser, os, platform }
}

export default {
  getDeviceData
}
