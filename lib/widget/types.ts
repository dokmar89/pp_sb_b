export interface WidgetConfig {
  apiKey: string
  container?: string
  mode?: "modal" | "inline"
  onVerified?: (result: VerificationResult) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export interface VerificationResult {
  success: boolean
  verificationId: string
  method: string
  timestamp: string
}

export interface CustomizationConfig {
  logo?: string
  primaryColor: string
  secondaryColor: string
  font: string
  buttonStyle: string
  verificationMethods: string[]
  texts: {
    title: string
    subtitle: string
    successMessage: string
    failureMessage: string
    buttonLabels: {
      bankid: string
      mojeid: string
      facescan: string
      ocr: string
      revalidate: string
      otherDevice: string
    }
  }
  images?: {
    background?: string
    successIcon?: string
    failureIcon?: string
  }
}

