import { GasModal } from '../../ui'

class StubGasModal extends GasModal {
  async initModal(): Promise<boolean> {
    return true
  }
}

export default StubGasModal
