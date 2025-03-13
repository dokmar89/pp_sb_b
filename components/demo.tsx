'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CreditCard, RotateCw, Scan, Monitor, FileText, QrCode, ArrowLeft, Camera, Upload, CheckCircle, XCircle, Phone, Mail, Apple, Chrome, User, AlertTriangle, Smartphone, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { QRCodeSVG } from "qrcode.react";

function lightenColor(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);
  R = Math.min(255, R + (R * percent / 100));
  G = Math.min(255, G + (G * percent / 100));
  B = Math.min(255, B + (B * percent / 100));
  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');
  return `#${RR}${GG}${BB}`;
}

interface CustomizationType {
  primaryColor: string
  secondaryColor: string
  buttonStyle: string
  logo?: string
  verificationMethods: string[]
}

const customization: CustomizationType = {
    primaryColor: "#007AFF",
    secondaryColor: "#FFFFFF",
    buttonStyle: "rounded",
    verificationMethods: ["facescan", "ocr", "bankid", "mojeid"]
  }

  const verificationMethods = [
    { id: "facescan", icon: <Scan className="w-8 h-8" />, title: "FaceScan", description: "Sken obličeje." },
    { id: "bankid", icon: <CreditCard className="w-8 h-8" />, title: "BankID", description: "Bankovní identita." },
    { id: "mojeid", icon: <FileText className="w-8 h-8" />, title: "MojeID", description: "MojeID." },
    { id: "ocr", icon: <Monitor className="w-8 h-8" />, title: "Sken dokladu", description: "Občanský průkaz." },
    { id: "revalidate", icon: <RotateCw className="w-8 h-8" />, title: "Opakované ověření", description: "Znovu-ověření." },
    { id: "other_device", icon: <QrCode className="w-8 h-8" />, title: "Jiné zařízení", description: "Ověření jinde." },
  ];

  export function Demo() {
  const [open, setOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const styles = {
    root: {
      "--primary-color": customization.primaryColor,
      "--secondary-color": customization.secondaryColor,
      "--primary-light-color": lightenColor(customization.primaryColor, 85),
      "--font-family": customization.font,
      "--button-radius": customization.buttonStyle === "pill" ? "9999px" : "6px",
    } as React.CSSProperties,
    outerContainer: {
      minHeight: '600px',
      backgroundColor: 'var(--primary-light-color)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-family)',
    },
    innerContainer: {
      maxWidth: '1280px',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '3rem',
      alignItems: 'start',
      width: '100%',
    },
    leftColumn: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '2rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
    },
    rightColumn: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
    },
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
    buttonText: {
      display: 'inline',
      marginLeft: '0.5rem',
      transition: 'transform 0.2s ease',
    },
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

  const FaceScanStep = ({ onBack }: { onBack: () => void }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanningProgress, setScanningProgress] = useState(0);
    const [verificationResult, setVerificationResult] = useState<"approved" | "rejected" | "uncertain" | null>(null);
    const [showUncertainDialog, setShowUncertainDialog] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const handleCameraPermission = async () => {
      setCameraError(null);
      setIsCameraActive(true);
      setIsScanning(true);
      const interval = setInterval(() => {
        setScanningProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            const randomResult = Math.random();
            if (randomResult < 0.7) {
              setVerificationResult("approved");
            } else if (randomResult < 0.85) {
              setVerificationResult("rejected");
            } else {
              setShowUncertainDialog(true);
            }
            return 100;
          }
          return newProgress;
        });
      }, 200);
    };

    const handleRetryScan = () => {
      setShowUncertainDialog(false);
      setVerificationResult(null);
      setScanningProgress(0);
      setIsScanning(true);
      handleCameraPermission();
    };

    if (verificationResult === "approved") {
      return <VerificationResult isVerified={true} method="facescan" />;
    }
    if (verificationResult === "rejected") {
      return <VerificationResult isVerified={false} method="facescan" />;
    }

    return (
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization.primaryColor }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>

        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              FaceScan
            </h2>
            {cameraError ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">
                    {cameraError}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Tipy pro řešení problémů:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Ujistěte se, že váš prohlížeč má povolení pro přístup ke kameře</li>
                    <li>Zkontrolujte, zda vaše kamera funguje v jiných aplikacích</li>
                    <li>Zkuste použít jiný prohlížeč (Chrome, Firefox, Edge)</li>
                    <li>Restartujte prohlížeč a/nebo počítač</li>
                  </ul>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => onBack()}
                    style={{
                      backgroundColor: customization.primaryColor,
                      color: customization.secondaryColor,
                      borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                    }}
                  >
                    Zvolit jinou metodu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCameraError(null);
                      handleCameraPermission();
                    }}
                  >
                    Zkusit znovu
                  </Button>
                </div>
              </div>
            ) : showUncertainDialog ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm text-yellow-700">
                    Věk nelze s jistotou určit (18-24 let). Prosím, použijte jinou metodu ověření.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => onBack()}
                    style={{
                      backgroundColor: customization.primaryColor,
                      color: customization.secondaryColor,
                      borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                    }}
                  >
                    Zvolit jinou metodu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRetryScan}
                  >
                    Zkusit znovu
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Pro ověření věku prosím umístěte obličej do vyznačeného oválu a držte hlavu rovně.
                </p>

                <div className="relative aspect-video mb-4">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                  {isScanning && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${scanningProgress}%`,
                            backgroundColor: customization.primaryColor,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCameraPermission}
                  disabled={isScanning}
                  className="w-full"
                  style={{
                    backgroundColor: customization.primaryColor,
                    color: customization.secondaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  {isScanning
                    ? "Probíhá skenování obličeje..."
                    : isCameraActive
                      ? "Spustit nové skenování"
                      : "Povolit kameru a spustit skenování"}
                  <Camera className="ml-2 h-4 w-4" />
                </Button>

                {isCameraActive && !isScanning && (
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Umístěte obličej do vyznačeného oválu a držte hlavu rovně.
                  </p>
                )}
                {isScanning && (
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Držte hlavu rovně a nehýbejte se, dokud nebude skenování dokončeno.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const IDScanStep = ({ onBack }: { onBack: () => void }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<"success" | "failure" | null>(null);

    const handleImageCapture = () => {
      setIsScanning(true);
      setPreviewUrl("/placeholder.svg");
      setTimeout(() => {
        setIsScanning(false);
        setScanResult(Math.random() > 0.5 ? "success" : "failure");
      }, 2000);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
          setTimeout(() => {
            setIsScanning(false);
            setScanResult(Math.random() > 0.5 ? 'success' : 'failure');
          }, 2000);
        };
        reader.readAsDataURL(file);
      }
    };

    if (scanResult === "success") {
      return <VerificationResult isVerified={true} method="ocr" />;
    }

    return (
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={onBack}
          style={{ color: customization.primaryColor }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Sken dokladu
            </h2>
            <p className="text-gray-600 mb-6">
              Pro ověření věku prosím naskenujte nebo vyfoťte svůj doklad totožnosti.
            </p>
            <div className="relative aspect-[3/2] mb-4 bg-gray-100 rounded-lg overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Camera className="w-12 h-12" />
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                  <div
                    className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4"
                    style={{ borderColor: `${customization.primaryColor} transparent transparent transparent` }}
                  />
                  <p className="text-white text-center px-4">Zpracování dokladu...</p>
                </div>
              )}
              {scanResult && !isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  {scanResult === 'success' ? (
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => { document.querySelector('input[type="file"]').click(); }}
                disabled={isScanning}
                style={{
                  backgroundColor: customization.primaryColor,
                  color: customization.secondaryColor,
                  borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Nahrát soubor <Upload className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={handleImageCapture}
                disabled={isScanning}
                style={{
                  backgroundColor: customization.primaryColor,
                  color: customization.secondaryColor,
                  borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                }}
              >
                Vyfotit <Camera className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const RepeatedVerificationStep = ({ onBack }: { onBack: () => void }) => {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [phoneOrEmail, setPhoneOrEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);

    const handleMethodSelect = (method: string) => {
      setSelectedMethod(method);
    };

    const handleSendCode = async () => {
      setIsSendingCode(true);
      setTimeout(() => {
        setIsSendingCode(false);
        setCodeSent(true);
      }, 2000);
    };

    const handleVerify = async () => {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
      }, 2000);
    };

    if (isVerified) {
      return <VerificationResult isVerified={true} method="revalidate" />;
    }

    return (
      <div className="max-w-md mx-auto">
        {!selectedMethod && (
          <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization.primaryColor }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
          </Button>
        )}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            {selectedMethod && (
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setSelectedMethod(null)}
                style={{ color: customization.primaryColor }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Zpět
              </Button>
            )}
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Opakované ověření
            </h2>

            {!selectedMethod ? (
              <div className="space-y-4">
                {["phone", "email", "apple", "google"].map((method) => (
                  <Button
                    key={method}
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMethodSelect(method)}
                    style={{
                      borderColor: customization.primaryColor,
                      color: customization.primaryColor,
                      borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                    }}
                  >
                    {method === "phone" && <Phone className="mr-2 h-4 w-4" />}
                    {method === "email" && <Mail className="mr-2 h-4 w-4" />}
                    {method === "apple" && <Apple className="mr-2 h-4 w-4" />}
                    {method === "google" && <Chrome className="mr-2 h-4 w-4" />}
                    {method === "phone" && "Telefon"}
                    {method === "email" && "Email"}
                    {method === "apple" && "Apple"}
                    {method === "google" && "Google"}
                  </Button>
                ))}
              </div>
            ) : selectedMethod === "phone" || selectedMethod === "email" ? (
              <div className="space-y-4">
                <Input
                  type={selectedMethod === "phone" ? "tel" : "email"}
                  placeholder={selectedMethod === "phone" ? "Zadejte telefonní číslo" : "Zadejte email"}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  disabled={isSendingCode}
                />
                <Button
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={!phoneOrEmail || codeSent || isSendingCode}
                  style={{
                    backgroundColor: customization.primaryColor,
                    color: customization.secondaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  {isSendingCode ? "Odesílání..." : codeSent ? "Ověřovací kód byl odeslán" : "Odeslat ověřovací kód"}
                </Button>
                {codeSent && (
                  <>
                    <Input
                      type="text"
                      placeholder="Zadejte ověřovací kód"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isVerifying}
                    />
                    <Button
                      className="w-full"
                      onClick={handleVerify}
                      disabled={!verificationCode || isVerifying}
                      style={{
                        backgroundColor: customization.primaryColor,
                        color: customization.secondaryColor,
                        borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                      }}
                    >
                      {isVerifying ? "Ověřování..." : "Potvrdit věk"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-gray-600">
                  Klikněte pro přihlášení a ověření pomocí vašeho {selectedMethod === "apple" ? "Apple" : "Google"} účtu.
                </p>
                <Button
                  className="w-full"
                  onClick={handleVerify}
                  style={{
                    backgroundColor: customization.primaryColor,
                    color: customization.secondaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  Ověřit pomocí {selectedMethod === "apple" ? "Apple" : "Google"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const BankIDStep = ({ onBack }: { onBack: () => void }) => {
    const [bankName, setBankName] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = (e: React.FormEvent) => {
      e.preventDefault();
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
      }, 2000);
    };

    if (isVerified) {
      return <VerificationResult isVerified={true} method="bankid" />;
    }

    if (!isVerified && isVerifying) {
      return (
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Ověřování...
            </h2>
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: `${customization.primaryColor} transparent transparent transparent` }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization.primaryColor }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              BankID
            </h2>
            <p className="text-gray-600 mb-6">Pro ověření věku pomocí BankID zadejte název vaší banky.</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="bankName">Název banky</Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="Např. Česká spořitelna"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying}
                style={{
                  backgroundColor: customization.primaryColor,
                  color: customization.secondaryColor,
                  borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {isVerifying ? "Ověřování..." : "Pokračovat k bance"}
                <CreditCard className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  const MojeIDStep = ({ onBack }: { onBack: () => void }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
      }, 3000);
    };

    if (isVerified) {
      return <VerificationResult isVerified={true} method="mojeid" />;
    }

    if (!isVerified && isVerifying) {
      return (
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Ověřování...
            </h2>
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: `${customization.primaryColor} transparent transparent transparent` }}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-6" onClick={onBack} style={{ color: customization.primaryColor }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              MojeID
            </h2>
            <p className="text-gray-600 mb-6">Pro ověření věku pomocí MojeID zadejte své přihlašovací údaje.</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="username">Uživatelské jméno</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying}
                style={{
                  backgroundColor: customization.primaryColor,
                  color: customization.secondaryColor,
                  borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                }}
              >
                {isVerifying ? "Ověřování..." : "Přihlásit se"}
                <User className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  const OtherDeviceStep = ({ onBack }: { onBack: () => void }) => {
    const [verificationComplete, setVerificationComplete] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const createSession = () => {
      setIsLoading(true);
      setTimeout(() => {
        const baseUrl = window.location.origin;
        const verificationUrl = `${baseUrl}/verify/mobile?session=demo-session-id&shop=demo-api-key`; // Fiktivní URL
        setQrCodeData(verificationUrl);
        setIsLoading(false);
        setTimeout(() => {
          setVerificationComplete(true);
          setIsVerified(true); // Nebo false
        }, 10000);
      }, 1500);
    };

    useEffect(() => {
      createSession();
    }, []);

    if (verificationComplete) {
      return <VerificationResult isVerified={isVerified} method="other_device" />;
    }

    return (
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={onBack}
          style={{ color: customization.primaryColor }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
        </Button>

        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Ověření na jiném zařízení
            </h2>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
                  style={{ borderColor: `${customization.primaryColor} transparent transparent transparent` }}
                />
                <p className="text-gray-600">Připravuji QR kód...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-600 mb-4">
                  Naskenujte tento QR kód svým mobilním telefonem a dokončete ověření věku na druhém zařízení.
                </p>

                <div className="flex justify-center">
                  {qrCodeData && (
                    <div className="p-4 bg-white border rounded-lg">
                      <QRCodeSVG
                        value={qrCodeData}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={customization.primaryColor || "#000000"}
                        level={"H"}
                        includeMargin={false}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Instrukce:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Otevřete fotoaparát na svém telefonu</li>
                        <li>Naskenujte QR kód</li>
                        <li>Dokončete ověření věku na svém telefonu</li>
                        <li>Tato stránka se automaticky aktualizuje po dokončení ověření</li>
                      </ol>
                    </div>
                  </div>

                  <Button
                    onClick={createSession}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Vygenerovat nový QR kód
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const VerificationResult = ({ isVerified, method }: { isVerified: boolean; method?: string }) => {
    const [saveResult, setSaveResult] = useState(false);
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [selectedSaveMethod, setSelectedSaveMethod] = useState<string | null>(null);
    const [phoneOrEmail, setPhoneOrEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [pairingComplete, setPairingComplete] = useState(false);

    const handleSaveResultChange = (checked: boolean) => {
      setSaveResult(checked);
      setShowSaveOptions(checked);
      if (!checked) {
        setSelectedSaveMethod(null);
        setPhoneOrEmail("");
        setVerificationCode("");
        setCodeSent(false);
      }
    };

    const handleSaveMethodSelect = (method: string) => {
      setSelectedSaveMethod(method);
    };

    const handleSendCode = () => {
      setCodeSent(true);
    };

    const handlePair = () => {
      setPairingComplete(true);
    };

    const handleCookieSave = () => {
      setPairingComplete(true);
    };

    if (!isVerified) {
      return (
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
                Nepodařilo se ověřit váš věk
              </h2>
              <p className="text-gray-600 mb-6 text-center">Zkuste to, až vám bude 18, do té doby nashledanou.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (method === "revalidate") {
      return (
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
                Věk byl ověřen
              </h2>
              <p className="text-gray-600 mb-6 text-center">Děkujeme za ověření.</p>
              <Button
                className="w-full"
                style={{
                  backgroundColor: customization.primaryColor,
                  color: customization.secondaryColor,
                  borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                }}
                onClick={() => setOpen(false)}
              >
                Zavřít
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-md mx-auto bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4" style={{ color: customization.primaryColor }}>
              Věk byl ověřen
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Děkujeme za trpělivost. Chcete si uložit výsledek pro příští ověření?
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="saveResult" checked={saveResult} onCheckedChange={handleSaveResultChange} />
              <Label htmlFor="saveResult">Uložit výsledek</Label>
            </div>
            {showSaveOptions && (
              <div className="w-full space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveMethodSelect("phone")}
                  style={{
                    borderColor: customization.primaryColor,
                    color: customization.primaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" /> Telefon
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveMethodSelect("email")}
                  style={{
                    borderColor: customization.primaryColor,
                    color: customization.primaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" /> Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveMethodSelect("apple")}
                  style={{
                    borderColor: customization.primaryColor,
                    color: customization.primaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  <Apple className="mr-2 h-4 w-4" /> Propojit AppleID
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveMethodSelect("google")}
                  style={{
                    borderColor: customization.primaryColor,
                    color: customization.primaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  <Chrome className="mr-2 h-4 w-4" /> Propojit Google účet
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCookieSave}
                  style={{
                    borderColor: customization.primaryColor,
                    color: customization.primaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  Uložit do prohlížeče
                </Button>
              </div>
            )}
            {(selectedSaveMethod === "phone" || selectedSaveMethod === "email") && (
              <div className="w-full mt-4 space-y-4">
                <Input
                  type={selectedSaveMethod === "phone" ? "tel" : "email"}
                  placeholder={selectedSaveMethod === "phone" ? "Zadejte telefonní číslo" : "Zadejte email"}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={!phoneOrEmail || codeSent}
                  style={{
                    backgroundColor: customization.primaryColor,
                    color: customization.secondaryColor,
                    borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                  }}
                >
                  {codeSent ? "Ověřovací kód byl odeslán" : "Odeslat ověřovací kód"}
                </Button>
                {codeSent && (
                  <>
                    <Input
                      type="text"
                      placeholder="Zadejte ověřovací kód"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={handlePair}
                      disabled={!verificationCode || pairingComplete}
                      style={{
                        backgroundColor: customization.primaryColor,
                        color: customization.secondaryColor,
                        borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
                      }}
                    >
                      {pairingComplete ? "Spárováno" : "Spárovat"}
                    </Button>
                  </>
                )}
              </div>
            )}
            {pairingComplete && (
              <p className="mt-4 text-center text-green-600 font-semibold">Účet byl úspěšně propojen.</p>
            )}
            <Button
              className="w-full mt-6"
              onClick={() => setOpen(false)}
              style={{
                backgroundColor: customization.primaryColor,
                color: customization.secondaryColor,
                borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
              }}
            >
              Zavřít
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSelectedMethod = () => {
    const commonProps = {
      onBack: handleBack,
    };

    switch (selectedMethod) {
      case "facescan":
        return <FaceScanStep {...commonProps} />;
      case "ocr":
        return <IDScanStep {...commonProps} />;
      case "revalidate":
        return <RepeatedVerificationStep {...commonProps} />;
      case "bankid":
        return <BankIDStep {...commonProps} />;
      case "mojeid":
        return <MojeIDStep {...commonProps} />;
      case "other_device":
        return <OtherDeviceStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        size="lg"
        style={{ 
          backgroundColor: customization.primaryColor,
          color: customization.secondaryColor,
          borderRadius: customization.buttonStyle === "pill" ? "9999px" : "0.375rem",
        }}
      >
        Vyzkoušet Demo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
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
            style={{ ...styles.root, ...styles.outerContainer }}
            className="verification-preview"
          >
            {!selectedMethod ? (
              <div style={styles.innerContainer}>
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
                      Vyberte si z několika způsobů ověření věku.
                    </p>
                  </div>
                  <button style={styles.primaryButton}>
                    Více informací
                  </button>
                </div>
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
    </>
  );
}