import Bowser from 'bowser'

import { DeviceData } from '../wallet'

const getDeviceData = (): DeviceData => {
  const parser = Bowser.getParser(window.navigator.userAgent)
  const result = parser.getResult()

  const browser = result.browser.name as string
  const os = result.os.name as string
  const platform = result.platform.type as string

  return { browser, os, platform }
}

export default {
  getDeviceData
}
