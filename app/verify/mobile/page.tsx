import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { WidgetVerification } from "@/components/widget/widget-verification";

interface MobileVerificationPageProps {
  searchParams: {
    session: string;
    shop: string;
  };
}

export default async function MobileVerificationPage({ searchParams }: MobileVerificationPageProps) {
  const { session, shop } = searchParams;

  if (!session || !shop) {
    return (
      <div className="p-4 text-red-500">
        Chybí parametry session nebo shop. Zkontrolujte QR kód.
      </div>
    );
  }

  const supabase = createServerComponentClient({ cookies });

  // Kontrola platnosti session
  const { data: sessionData, error: sessionError } = await supabase
    .from("verification_sessions")
    .select("id, status, expires_at, shop_id")
    .eq("id", session)
    .single();

  if (sessionError || !sessionData) {
    return (
      <div className="p-4 text-red-500">
        Neplatná session. Zkuste naskenovat QR kód znovu.
      </div>
    );
  }

  if (new Date(sessionData.expires_at) < new Date()) {
    return (
      <div className="p-4 text-red-500">
        Session vypršela. Vygenerujte nový QR kód.
      </div>
    );
  }

  if (sessionData.status === "completed") {
    return (
      <div className="p-4 text-green-500">
        Ověření již bylo dokončeno. Můžete zavřít tuto stránku.
      </div>
    );
  }

  // Získání informací o obchodu
  const { data: shopData } = await supabase
    .from("shops")
    .select(`
      *,
      customizations (*)
    `)
    .eq("api_key", shop)
    .single();

  if (!shopData) {
    return <div className="p-4 text-red-500">Neplatný API klíč obchodu</div>;
  }

  if (shopData.status !== "active") {
    return <div className="p-4 text-red-500">Eshop není aktivní</div>;
  }

  // Aktualizace stavu session na "in_progress"
  await supabase
    .from("verification_sessions")
    .update({ status: "in_progress" })
    .eq("id", session);

  // Funkce pro zpracování výsledku ověření
  const handleVerificationComplete = async (result: any) => {
    // Aktualizace session s výsledkem ověření
    await supabase
      .from("verification_sessions")
      .update({
        status: "completed",
        verification_result: result.verified ? "approved" : "rejected",
        verification_details: result,
        completed_at: new Date().toISOString()
      })
      .eq("id", session);

    // Přesměrování na stránku s potvrzením
    redirect(`/verify/mobile/complete?result=${result.verified ? "success" : "failed"}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 bg-primary text-primary-foreground text-center">
        <h1 className="text-xl font-bold">Ověření věku na mobilním zařízení</h1>
        <p className="text-sm opacity-80">Session ID: {session.substring(0, 8)}...</p>
      </div>
      
      <WidgetVerification 
        shopId={shopData.id} 
        apiKey={shop} 
        mode="mobile" 
        customization={shopData.customizations}
        sessionId={session}
        onComplete={handleVerificationComplete}
      />
    </div>
  );
} 