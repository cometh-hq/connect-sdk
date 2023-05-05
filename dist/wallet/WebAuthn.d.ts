declare const _default: {
  createCredentials: (userId: string) => Promise<any>
  getWebAuthnSignature: (
    safeTxHash: string,
    publicKey_Id: string
  ) => Promise<string>
}
export default _default
