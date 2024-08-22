import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, constants } from 'ethers'
import { getAddress } from 'ethers/lib/utils'

import { networks } from '../constants'
import { AddressNotOwnerError } from '../wallet/errors'
import safeService from './safeService'

const WALLET_ADDRESS = '0x5B76Bb156C4E9Aa322143d0061AFBd856482648D'
const CHAIN_ID = 137
const COUNTER_TEST_ADDRESS = '0x84ADD3fa2c2463C8cF2C95aD70e4b5F602332160'

describe('safeService', () => {
  describe('getSafeTransactionHash', () => {
    const SAFE_TX_HASH =
      '0x684e524decf23a8540aa689f9c745b7579bf906f528e60a31b6123e1a7b94ed8'

    const transactionData = {
      to: COUNTER_TEST_ADDRESS,
      value: '0x0',
      data: '0x06661abd',
      operation: 0,
      safeTxGas: BigNumber.from(0).toString(),
      baseGas: BigNumber.from(0).toString(),
      gasPrice: BigNumber.from(0).toString(),
      gasToken: constants.AddressZero,
      refundReceiver: constants.AddressZero,
      nonce: BigNumber.from(128).toString()
    }
    it('Given a walletAddress with transactionData, when predicting transaction Hash, then return the correct safe txHash', async () => {
      const predictedSafeTxHash = safeService.getSafeTransactionHash(
        WALLET_ADDRESS,
        transactionData,
        CHAIN_ID
      )

      expect(predictedSafeTxHash).toEqual(SAFE_TX_HASH)
    })
  })

  describe('formatToSafeContractSignature', () => {
    const SIGNER_ADDRESS = '0xc7a397eB9C91FAeB303cE286Cbd5c85eB8773Be5'
    const WEBAUTHN_SIGNATURE =
      '0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000244e541c13182bfef85ff8f9ea2d0939ecb8b1b106921e24a9088715f2086beb94d3b1ff0ff95e263da59b75b61d46531daecc504960c39efb06d93558b72c29f0000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000867b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2253472d56495f466f48397552414e565f6c50684b43716f696832437579576c42645034774b562d53335555222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000'
    const FORMATTED_WEBAUTHN_SIGNATURE =
      '0x000000000000000000000000c7a397eb9c91faeb303ce286cbd5c85eb8773be500000000000000000000000000000000000000000000000000000000000000410000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000244e541c13182bfef85ff8f9ea2d0939ecb8b1b106921e24a9088715f2086beb94d3b1ff0ff95e263da59b75b61d46531daecc504960c39efb06d93558b72c29f0000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000867b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2253472d56495f466f48397552414e565f6c50684b43716f696832437579576c42645034774b562d53335555222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303030222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000'

    it('Given a signerAddress and a webAuthn signature, when formatting the signature to the safe standard, then return the formatted signature', async () => {
      const signature = safeService.formatToSafeContractSignature(
        SIGNER_ADDRESS,
        WEBAUTHN_SIGNATURE
      )

      expect(signature).toEqual(FORMATTED_WEBAUTHN_SIGNATURE)
    })
  })

  describe('getTransactionsTotalValue', () => {
    const to = WALLET_ADDRESS
    const value = '123456'
    const data = '0x'

    const transactionDataMultisend = [
      { to, value, data },
      { to, value, data },
      { to, value, data }
    ]

    it('Given a multisend array, when getting the total value of the transaction, then return the sum of the transactions value', async () => {
      const totalValue = await safeService.getTransactionsTotalValue(
        transactionDataMultisend
      )

      expect(totalValue).toEqual((parseInt(value) * 3).toString())
    })
  })

  describe('getSafePreviousOwner', () => {
    const provider = new StaticJsonRpcProvider(networks[137].RPCUrl)

    it('Given a walletAddress and owner to delete, when getting the previous owner, then return the right previous owner', async () => {
      const walletAddress = '0x2702129f7a54d934Bd17C339332262CA648B81E6'

      const owners = [
        '0x7F76A0Db112E0609fD7a51C57227C2a0579e9E2F',
        '0xe92899b2f663BA710Cc3bBc4552e248985fD8B85',
        '0x858dacceb13da460e7a2e54171345C22A7F65aa8',
        '0x65245F19c92ac5Adce53244406Ad126398EF203A'
      ]

      const ownerToDelete = owners[1]

      const expectedPreviousOwner = getAddress(
        '0x7f76a0db112e0609fd7a51c57227c2a0579e9e2f'
      )

      const prevOwner = await safeService.getSafePreviousOwner(
        walletAddress,
        ownerToDelete,
        provider
      )

      expect(prevOwner).toEqual(expectedPreviousOwner)
    })

    it('Given a walletAddress and owner to delete, when getting the previous owner, then return the safe sentinel owner', async () => {
      const walletAddress = '0x7760306C27AFbc4068bDfD4464ce54De5B7f62bc'

      const owners = ['0x9Fe6efA832BbBcd7b4F23bDaC0032ba20CC40174']

      const ownerToDelete = owners[0]

      const expectedPreviousOwner = getAddress(
        '0x0000000000000000000000000000000000000001'
      )

      const prevOwner = await safeService.getSafePreviousOwner(
        walletAddress,
        ownerToDelete,
        provider
      )

      expect(prevOwner).toEqual(expectedPreviousOwner)
    })

    it('Given a walletAddress and owner to delete, when getting the previous owner from an invalid owner address, then throw the appropriate error', async () => {
      const walletAddress = '0x7760306C27AFbc4068bDfD4464ce54De5B7f62bc'

      const ownerToDelete = '0x0000000000000000000000000000000000000001'

      await expect(
        safeService.getSafePreviousOwner(walletAddress, ownerToDelete, provider)
      ).rejects.toThrow(new AddressNotOwnerError())
    })
  })
})
