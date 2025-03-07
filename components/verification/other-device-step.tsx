"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Smartphone } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { VerificationResult } from "./verification-result"
import { toast } from "sonner"

interface Props {
  onBack: () => void
  apiKey: string | null
  customization?: {
    primary_color: string
    secondary_color: string
    button_style: string
  }
  sessionId?: string
  onComplete?: (result: any) => void
  onError?: (error: Error) => void
}

export function OtherDeviceStep({ onBack, apiKey, customization, sessionId: initialSessionId, onComplete, onError }: Props) {
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Funkce pro vytvoření nové session
  const createSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Zrušení předchozích požadavků
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Vytvoření nového abort controlleru
      abortControllerRef.current = new AbortController();
      
      console.log("Creating new verification session with apiKey:", apiKey);
      
      // Kontrola, zda máme apiKey
      if (!apiKey) {
        throw new Error("Chybí API klíč obchodu");
      }
      
      // Příprava dat pro požadavek
      const requestData = {
        api_key: apiKey, // Změna z shop_id na api_key podle očekávaného formátu API
      };
      
      console.log("Sending request with data:", requestData);
      
      const response = await fetch("/api/verify/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal
      });

      // Logování odpovědi pro debugging
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      // Pokus o parsování JSON odpovědi
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error(`Neplatná odpověď ze serveru: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`Nepodařilo se vytvořit session (${response.status}: ${response.statusText}): ${data.error || responseText}`);
      }
      
      console.log("Session created:", data);
      
      if (!data.session_id) {
        throw new Error("Server nevrátil ID session");
      }
      
      setSessionId(data.session_id);
      
      // Vytvoření URL pro QR kód
      const baseUrl = window.location.origin;
      const verificationUrl = `${baseUrl}/verify/mobile?session=${data.session_id}&shop=${apiKey}`;
      console.log("Verification URL:", verificationUrl);
      
      setQrCodeData(verificationUrl);
      setIsLoading(false);
      
      // Spuštění pollingu pro kontrolu stavu ověření
      startPolling(data.session_id);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("Request aborted");
        return;
      }
      
      console.error("Error creating session:", err);
      setError(err instanceof Error ? err.message : "Nepodařilo se vytvořit session");
      setIsLoading(false);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error("Nepodařilo se vytvořit session"));
      }
    }
  };

  // Funkce pro kontrolu stavu ověření
  const checkVerificationStatus = async (sessionId: string) => {
    try {
      if (!abortControllerRef.current) {
        abortControllerRef.current = new AbortController();
      }
      
      const response = await fetch(`/api/verify/session-status?session_id=${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Nepodařilo se zkontrolovat stav ověření (${response.status}: ${response.statusText})`);
      }

      const data = await response.json();
      console.log("Verification status:", data);
      
      // Aktualizace stavu podle odpovědi ze serveru
      if (data.status === "completed") {
        // Ověření bylo dokončeno
        stopPolling();
        setVerificationComplete(true);
        setIsVerified(data.verified === true);
        
        // Volání callback funkce s výsledkem
        if (onComplete) {
          onComplete({
            verified: data.verified === true,
            method: "other_device",
            session_id: sessionId,
            timestamp: new Date().toISOString(),
            details: data
          });
        }
      } else if (data.status === "in_progress") {
        // Ověření probíhá - aktualizace progress baru
        setProgress(data.progress || 50);
      } else if (data.status === "error") {
        // Došlo k chybě
        stopPolling();
        setError(data.message || "Došlo k chybě při ověřování");
        
        if (onError) {
          onError(new Error(data.message || "Došlo k chybě při ověřování"));
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("Request aborted");
        return;
      }
      
      console.error("Error checking verification status:", err);
      
      // Nezastavujeme polling při dočasných chybách, aby se mohl zotavit
      // Pouze zobrazíme toast s chybou
      toast.error("Nepodařilo se zkontrolovat stav ověření. Zkouším to znovu...");
    }
  };

  // Funkce pro spuštění pollingu
  const startPolling = (sid: string) => {
    // Nejprve zastavíme případný běžící polling
    stopPolling();
    
    // Spustíme nový polling
    pollingIntervalRef.current = setInterval(() => {
      checkVerificationStatus(sid);
    }, 3000); // Kontrola každé 3 sekundy
    
    console.log("Polling started for session:", sid);
  };

  // Funkce pro zastavení pollingu
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("Polling stopped");
    }
  };

  // Efekt pro inicializaci při načtení komponenty
  useEffect(() => {
    // Pokud máme sessionId z props, použijeme ho
    if (initialSessionId) {
      console.log("Using provided session ID:", initialSessionId);
      setSessionId(initialSessionId);
      
      // Vytvoření URL pro QR kód
      const baseUrl = window.location.origin;
      const verificationUrl = `${baseUrl}/verify/mobile?session=${initialSessionId}&shop=${apiKey}`;
      setQrCodeData(verificationUrl);
      setIsLoading(false);
      
      // Spuštění pollingu
      startPolling(initialSessionId);
    } else {
      // Jinak vytvoříme novou session
      createSession();
    }
    
    // Cleanup při unmount
    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialSessionId, apiKey]);

  // Pokud je ověření dokončeno, zobrazíme výsledek
  if (verificationComplete) {
    return <VerificationResult isVerified={isVerified} method="other_device" apiKey={apiKey} customization={customization} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => {
          stopPolling();
          onBack();
        }}
        style={{ color: customization?.primary_color }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Zpět na výběr metody
      </Button>

      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: customization?.primary_color }}>
            Ověření na jiném zařízení
          </h2>

          {error ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button
                onClick={createSession}
                className="w-full"
                style={{
                  backgroundColor: customization?.primary_color,
                  color: customization?.secondary_color,
                  borderRadius: customization?.button_style === "pill" ? "9999px" : "0.375rem",
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Zkusit znovu
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
                style={{ borderColor: `${customization?.primary_color} transparent transparent transparent` }}
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
                      fgColor={customization?.primary_color || "#000000"}
                      level={"H"}
                      includeMargin={false}
                    />
                  </div>
                )}
              </div>

              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Ověření probíhá...</span>
                    <span className="text-sm font-medium" style={{ color: customization?.primary_color }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: customization?.primary_color,
                      }}
                    />
                  </div>
                </div>
              )}

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
}

