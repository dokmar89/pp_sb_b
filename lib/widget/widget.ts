import type { WidgetConfig, CustomizationConfig } from "./types"

class AgeVerificationWidget {
  private config: WidgetConfig
  private customization: CustomizationConfig | null = null
  private container: HTMLElement | null = null
  private iframe: HTMLIFrameElement | null = null
  private isInitialized = false

  constructor(config: WidgetConfig) {
    this.config = {
      mode: "modal",
      ...config,
    }
  }

  public async init() {
    if (this.isInitialized) {
      console.warn("Widget is already initialized")
      return
    }

    try {
      // Fetch customization settings using API key
      await this.fetchCustomization()

      // Create container if needed
      if (this.config.mode === "inline") {
        const containerElement = document.querySelector(this.config.container || "#age-verification")
        if (!containerElement) {
          throw new Error("Container element not found")
        }
        this.container = containerElement as HTMLElement
      }

      // Create and inject styles
      this.injectStyles()

      // Initialize message listeners
      this.initMessageListeners()

      this.isInitialized = true
    } catch (error) {
      console.error("Failed to initialize widget:", error)
      this.handleError(error as Error)
    }
  }

  public open() {
    if (!this.isInitialized) {
      console.warn("Widget must be initialized before opening")
      return
    }

    try {
      if (this.config.mode === "modal") {
        this.createModal()
      } else {
        this.createInlineFrame()
      }
    } catch (error) {
      console.error("Failed to open widget:", error)
      this.handleError(error as Error)
    }
  }

  public close() {
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }

    if (this.config.mode === "modal") {
      const modal = document.querySelector(".age-verification-modal")
      if (modal) {
        modal.remove()
      }
    }

    if (this.config.onClose) {
      this.config.onClose()
    }
  }

  private async fetchCustomization() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/widget/customization`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch customization")
      }

      this.customization = await response.json()
    } catch (error) {
      console.error("Failed to fetch customization:", error)
      throw error
    }
  }

  private createModal() {
    // Create modal container
    const modal = document.createElement("div")
    modal.className = "age-verification-modal"

    // Create modal content
    const modalContent = document.createElement("div")
    modalContent.className = "age-verification-modal-content"

    // Create iframe
    this.iframe = document.createElement("iframe")
    this.iframe.src = this.getWidgetUrl()
    this.iframe.className = "age-verification-iframe"
    this.iframe.style.border = "none"
    this.iframe.style.width = "100%"
    this.iframe.style.height = "100%"

    modalContent.appendChild(this.iframe)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)
  }

  private createInlineFrame() {
    if (!this.container) return

    this.iframe = document.createElement("iframe")
    this.iframe.src = this.getWidgetUrl()
    this.iframe.className = "age-verification-iframe"
    this.iframe.style.border = "none"
    this.iframe.style.width = "100%"
    this.iframe.style.height = "500px" // Default height for inline mode

    this.container.appendChild(this.iframe)
  }

  private getWidgetUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const params = new URLSearchParams({
      apiKey: this.config.apiKey,
      mode: this.config.mode || "modal",
    })

    return `${baseUrl}/widget?${params.toString()}`
  }

  private initMessageListeners() {
    window.addEventListener("message", (event) => {
      // Verify origin
      if (event.origin !== process.env.NEXT_PUBLIC_APP_URL) return

      const { type, data } = event.data

      switch (type) {
        case "VERIFICATION_COMPLETE":
          this.handleVerificationComplete(data)
          break
        case "VERIFICATION_ERROR":
          this.handleError(new Error(data.message))
          break
        case "CLOSE_WIDGET":
          this.close()
          break
      }
    })
  }

  private handleVerificationComplete(result: any) {
    if (this.config.onVerified) {
      this.config.onVerified(result)
    }

    // Auto-close modal after verification
    if (this.config.mode === "modal") {
      this.close()
    }
  }

  private handleError(error: Error) {
    if (this.config.onError) {
      this.config.onError(error)
    }
  }

  private injectStyles() {
    const styles = `
      .age-verification-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      .age-verification-modal-content {
        background-color: white;
        border-radius: 8px;
        width: 100%;
        max-width: 500px;
        height: 600px;
        position: relative;
        overflow: hidden;
      }

      .age-verification-iframe {
        border: none;
        width: 100%;
        height: 100%;
      }

      @media (max-width: 640px) {
        .age-verification-modal-content {
          width: 100%;
          height: 100%;
          max-width: none;
          border-radius: 0;
        }
      }
    `

    const styleElement = document.createElement("style")
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }
}

// Create global instance
declare global {
  interface Window {
    AgeVerification: typeof AgeVerificationWidget
  }
}

window.AgeVerification = AgeVerificationWidget

export default AgeVerificationWidget

