export const hexArrayStr = (array): string =>
  new Uint8Array(array).reduce(
    (acc, v) => acc + v.toString(16).padStart(2, '0'),
    '0x'
  )

export const parseHex = (str): Uint8Array =>
  new Uint8Array(str.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)))

export const derToRS = (der): any[] => {
  let offset = 3
  let dataOffset

  if (der[offset] === 0x21) {
    dataOffset = offset + 2
  } else {
    dataOffset = offset + 1
  }
  const r = der.slice(dataOffset, dataOffset + 32)
  offset = offset + der[offset] + 1 + 1
  if (der[offset] === 0x21) {
    dataOffset = offset + 2
  } else {
    dataOffset = offset + 1
  }

  const s = der.slice(dataOffset, dataOffset + 32)
  return [r, s]
}

export const findSequence = (arr, seq): number => {
  for (let i = 0; i < arr.length; ++i) {
    for (let j = 0; j < seq.length; j++) {
      if (arr[i + j] !== seq[j]) {
        break
      }
      if (j === seq.length - 1) {
        return i
      }
    }
  }
  return -1
}
