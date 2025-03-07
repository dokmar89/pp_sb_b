import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface CompletePageProps {
  searchParams: {
    result: string;
  };
}

export default function CompletePage({ searchParams }: CompletePageProps) {
  const { result } = searchParams;
  const isSuccess = result === "success";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center">
        {isSuccess ? (
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        ) : (
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        )}

        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? "Ověření úspěšně dokončeno" : "Ověření se nezdařilo"}
        </h1>

        <p className="text-muted-foreground mb-6">
          {isSuccess
            ? "Vaše ověření věku bylo úspěšně dokončeno. Můžete zavřít tuto stránku a pokračovat na původním zařízení."
            : "Bohužel se nepodařilo ověřit váš věk. Zkuste to prosím znovu nebo použijte jinou metodu ověření."}
        </p>

        <Button className="w-full" onClick={() => window.close()}>
          Zavřít tuto stránku
        </Button>
      </div>
    </div>
  );
} 