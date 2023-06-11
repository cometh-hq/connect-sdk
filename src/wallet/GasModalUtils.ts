import { GasModal } from '../ui/GasModal'

const showGasModal = async (
  balance: string,
  totalFees: string
): Promise<boolean> => {
  return await new GasModal().initModal(
    (+balance).toFixed(3),
    (+totalFees).toFixed(3)
  )
}

export default {
  showGasModal
}
