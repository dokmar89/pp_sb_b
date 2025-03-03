'use client'

import { useState } from "react"
import { CreditCard, RotateCw, Scan, Monitor, FileText, QrCode } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FaceScanStep } from "./face-scan-step"
import { IDScanStep } from "./id-scan-step"
import { RepeatedVerificationStep } from "./repeated-verification-step"
import { OtherDeviceStep } from "./other-device-step"
import { BankIDStep } from "./bank-id-step"
import { MojeIDStep } from "./moje-id-step"

/**
 * Props pro PreviewModal komponentu
 */
interface PreviewModalProps {
  shopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  customization: {
    font: string
    primaryColor: string
    secondaryColor: string
    buttonStyle: string
    verificationMethods: string[]
    logo?: string
    failureAction: string
    failureRedirect?: string
  }
}

/**
 * Pomocná funkce pro zesvětlení barvy
 */
const lightenColor = (hex: string, percent: number): string => {
  let R = parseInt(hex.substring(1, 3), 16)
  let G = parseInt(hex.substring(3, 5), 16)
  let B = parseInt(hex.substring(5, 7), 16)

  R = Math.min(255, R + (R * percent / 100))
  G = Math.min(255, G + (G * percent / 100))
  B = Math.min(255, B + (B * percent / 100))

  const RR = R.toString(16).padStart(2, '0')
  const GG = G.toString(16).padStart(2, '0')
  const BB = B.toString(16).padStart(2, '0')

  return `#${RR}${GG}${BB}`
}

/**
 * PreviewModal komponenta - zobrazuje náhled verifikačních metod
 */
export function PreviewModal({ shopId, open, onOpenChange, customization }: PreviewModalProps) {
  // State pro sledování vybrané metody verifikace
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  // Handler pro návrat zpět na výběr metody
  const handleBack = () => setSelectedMethod(null)

  // Definice dostupných verifikačních metod
  const verificationMethods = [
    {
      id: "facescan",
      icon: <Scan className="w-8 h-8" />,
      title: "FaceScan",
      description: "Rychlé a bezpečné ověření pomocí skenování obličeje. Není potřeba žádný doklad, stačí pouze váš obličej.",
    },
    {
      id: "bankid",
      icon: <CreditCard className="w-8 h-8" />,
      title: "BankID",
      description: "Ověření pomocí vaší bankovní identity. Bezpečný způsob s využitím vašeho internetového bankovnictví.",
    },
    {
      id: "mojeid",
      icon: <FileText className="w-8 h-8" />,
      title: "MojeID",
      description: "Využijte svou státem garantovanou identitu MojeID pro rychlé a spolehlivé ověření věku.",
    },
    {
      id: "ocr",
      icon: <Monitor className="w-8 h-8" />,
      title: "Sken dokladu",
      description: "Naskenujte svůj občanský průkaz nebo cestovní pas. Podporujeme všechny typy oficiálních dokladů.",
    },
    {
      id: "revalidate",
      icon: <RotateCw className="w-8 h-8" />,
      title: "Opakované ověření",
      description: "Již ověření uživatelé mohou využít rychlé znovu-ověření bez nutnosti dodatečných dokumentů.",
    },
    {
      id: "other_device",
      icon: <QrCode className="w-8 h-8" />,
      title: "Jiné zařízení",
      description: "Pokračujte v ověření na jiném zařízení. Stačí naskenovat QR kód a dokončit proces kde vám to vyhovuje.",
    },
  ]

  // Inline styly - vylepšená struktura a přehlednost
  const styles = {
    // CSS proměnné pro styling
    root: {
      "--primary-color": customization.primaryColor,
      "--secondary-color": customization.secondaryColor,
      "--primary-light-color": lightenColor(customization.primaryColor, 85),
      "--font-family": customization.font,
      "--button-radius": customization.buttonStyle === "pill" ? "9999px" : "6px",
    } as React.CSSProperties,
    
    // Kontejner pro celou modal komponentu
    outerContainer: {
      minHeight: '600px',
      backgroundColor: 'var(--primary-light-color)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-family)',
    },
    
    // Grid kontejner pro obsah
    innerContainer: {
      maxWidth: '1280px',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '3rem',
      alignItems: 'start',
      width: '100%',
    },
    
    // Levý sloupec s hlavním nadpisem
    leftColumn: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '2rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
    },
    
    // Pravý sloupec s metodami
    rightColumn: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
    },
    
    // Karta pro metodu ověření
    card: {
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      border: '1px solid var(--primary-light-color)',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
    },
    
    // Styl tlačítka
    button: {
      backgroundColor: 'transparent',
      padding: 0,
      height: 'auto',
      fontFamily: 'inherit',
      fontWeight: 'normal',
      color: 'var(--primary-color)',
      textDecoration: 'none',
      cursor: 'pointer',
      display: 'inline-block',
      marginTop: '0.5rem',
      transition: 'all 0.2s ease',
    },
    
    // Styl textu tlačítka
    buttonText: {
      display: 'inline',
      marginLeft: '0.5rem',
      transition: 'transform 0.2s ease',
    },
    
    // Styl hlavního tlačítka
    primaryButton: {
      backgroundColor: 'white',
      color: 'var(--primary-color)',
      padding: '0.75rem 1.5rem',
      borderRadius: 'var(--button-radius)',
      width: '100%',
      display: 'block',
      fontWeight: '600',
      textAlign: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
      },
    }
  }

  // Funkce pro vykreslení aktivní metody ověření
  const renderSelectedMethod = () => {
    const commonProps = {
      onBack: handleBack,
      apiKey: null,
      customization: customization,
      buttonStyles: {},
    }

    switch (selectedMethod) {
      case "facescan":
        return <FaceScanStep {...commonProps} />
      case "ocr":
        return <IDScanStep {...commonProps} verificationId="preview" />
      case "revalidate":
        return <RepeatedVerificationStep {...commonProps} />
      case "bankid":
        return <BankIDStep {...commonProps} />
      case "mojeid":
        return <MojeIDStep {...commonProps} />
      case "other_device":
        return <OtherDeviceStep {...commonProps} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-none p-0" 
        style={{ 
          maxWidth: '900px', 
          width: '900px', 
          height: '600px',
          overflow: 'hidden',
          borderRadius: '8px'
        }}
      >
        <div 
          style={{...styles.root, ...styles.outerContainer}} 
          className="verification-preview"
        >
          {!selectedMethod ? (
            <div style={styles.innerContainer}>
              {/* Levý sloupec */}
              <div style={styles.leftColumn}>
                {customization.logo && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={customization.logo}
                      alt="Logo e-shopu"
                      className="h-12 object-contain"
                    />
                  </div>
                )}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h1 className="text-4xl font-bold tracking-tight mb-4">
                    Ověření věku
                    <br />
                    jednoduše a bezpečně
                  </h1>
                  <p className="text-lg" style={{ opacity: 0.9 }}>
                    Vyberte si z několika způsobů ověření věku. Všechny metody jsou plně
                    automatizované, bezpečné a šifrované. Proces zabere jen pár minut.
                  </p>
                </div>
                <button style={styles.primaryButton}>
                  Více informací
                </button>
              </div>
              
              {/* Pravý sloupec */}
              <div style={styles.rightColumn}>
                {verificationMethods
                  .filter((method) => customization.verificationMethods?.includes(method.id))
                  .map((method) => (
                    <div 
                      key={method.id} 
                      style={styles.card}
                      onClick={() => setSelectedMethod(method.id)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div className="mb-4" style={{ color: 'var(--primary-color)' }}>
                        {method.icon}
                      </div>
                      <h2 
                        className="font-semibold mb-2 text-xl" 
                        style={{ color: 'var(--primary-color)' }}
                      >
                        {method.title}
                      </h2>
                      <p className="text-sm mb-4" style={{ color: '#71717a' }}>
                        {method.description}
                      </p>
                      <button
                        style={styles.button}
                        onMouseOver={(e) => {
                          const span = e.currentTarget.querySelector('span');
                          if (span) span.style.transform = 'translateX(3px)';
                        }}
                        onMouseOut={(e) => {
                          const span = e.currentTarget.querySelector('span');
                          if (span) span.style.transform = 'translateX(0)';
                        }}
                      >
                        Vybrat metodu <span style={styles.buttonText}>→</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            renderSelectedMethod()
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}