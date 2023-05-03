import React from 'react'
import { createRoot } from 'react-dom/client'
import { Modal } from './components/Modal'

interface GasModalConfig {
  zIndex?: string
}

export class GasModal {
  readonly modalConfig: GasModalConfig

  constructor({ modalConfig = {} }: { modalConfig?: GasModalConfig }) {
    this.modalConfig = modalConfig
  }

  private createModalWrapper(): HTMLElement {
    const root: HTMLElement | null = document.querySelector(':root')
    root?.style.setProperty(
      '--z-index-modal',
      this.modalConfig.zIndex || '1000'
    )

    const existingWrapper: HTMLElement | null = document.getElementById(
      'alembic-gas-modal-wrapper'
    )
    if (existingWrapper) {
      existingWrapper.remove()
    }

    const wrapper: HTMLElement = document.createElement('section')
    wrapper.classList.add('modalWrapper')
    wrapper.setAttribute('id', 'alembic-gas-modal-wrapper')
    document.body.appendChild(wrapper)
    return wrapper
  }

  closeModal(): void {
    const existingWrapper: HTMLElement | null = document.getElementById(
      'alembic-gas-modal-wrapper'
    )
    if (existingWrapper) {
      existingWrapper.remove()
    }
  }

  initModal(): void {
    const modalWrapper = this.createModalWrapper()
    const root = createRoot(modalWrapper)

    root.render(
      <>
        <Modal onClose={this.closeModal} />
      </>
    )
  }
}
