import React from 'react'
import { createRoot } from 'react-dom/client'
import { Modal } from './components/Modal'

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
    wrapper.setAttribute(
      'style',
      ` position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: ${this.modalConfig.zIndex || '9999'};
        background-color: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        animation: alembic-gas-modal-fade-in 0.3s ease-out forwards;

        @keyframes alembic-gas-modal-fade-in {
          from {
            opactiy: 0;
          }
          to {
            opacity: 1;
          }
        }
      `
    )
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

  async initModal(txGasFees: string): Promise<boolean> {
    const modalWrapper = this.createModalWrapper()
    const root = createRoot(modalWrapper)
    const self = this

    return new Promise((resolve) => {
      console.log('ici')
      function accept() {
        self.closeModal()
        resolve(true)
      }

      function deny() {
        self.closeModal()
        resolve(false)
      }

      root.render(
        <>
          <Modal onDeny={deny} onAccept={accept} txGasFees={txGasFees} />
        </>
      )
    })
  }
}
