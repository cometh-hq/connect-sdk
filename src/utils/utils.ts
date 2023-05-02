export const hexArrayStr = (array): any =>
  new Uint8Array(array).reduce(
    (acc, v) => acc + v.toString(16).padStart(2, '0'),
    '0x'
  )
