interface GasModalConfig {
  zIndex?: string
}
export declare class GasModal {
  readonly modalConfig: GasModalConfig
  constructor({ modalConfig }: { modalConfig?: GasModalConfig })
  private createModalWrapper
  closeModal(): void
  initModal(): void
}
export {}
