import React from 'react'
import { createRoot } from 'react-dom/client'
import { GasModal as GasModalComponent } from '@alembic/ui'

interface GasModalConfig {
  zIndex?: string
}

export class GasModal {
  readonly modalConfig: GasModalConfig

  constructor(modalConfig?: GasModalConfig) {
    this.modalConfig = modalConfig || {}
  }

  private createModalWrapper(): HTMLElement {
    const existingWrapper: HTMLElement | null = document.getElementById(
      'alembic-gas-modal-wrapper'
    )
    if (existingWrapper) {
      existingWrapper.remove()
    }

    const wrapper: HTMLElement = document.createElement('section')
    wrapper.setAttribute('id', 'alembic-gas-modal-wrapper')
    document.body.appendChild(wrapper)
    return wrapper
  }

  closeModal() {
    const existingWrapper: HTMLElement | null = document.getElementById(
      'alembic-gas-modal-wrapper'
    )
    if (existingWrapper) {
      existingWrapper.remove()
    }
  }

  async initModal(balance: string, txGasFees: string): Promise<boolean> {
    const modalWrapper = this.createModalWrapper()
    const root = createRoot(modalWrapper)
    const self = this

    return new Promise((resolve) => {
      function accept() {
        self.closeModal()
        resolve(true)
      }

      function deny() {
        self.closeModal()
        resolve(false)
      }

      root.render(
        <div
          style={{
            position: 'relative',
            zIndex: self.modalConfig.zIndex || 9999
          }}
        >
          <GasModalComponent
            onDeny={deny}
            onAccept={accept}
            balance={+balance}
            txGasFees={+txGasFees}
            isOpen
            withBackdrop
          />
        </div>
      )
    })
  }
}
