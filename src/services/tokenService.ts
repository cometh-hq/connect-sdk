import { decode, Jwt } from 'jsonwebtoken'

const decodeToken = (token: any): Jwt | null => {
  return decode(token, { complete: true })
}

export default {
  decodeToken
}
