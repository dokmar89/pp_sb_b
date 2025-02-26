// Kontrola přítomnosti povinných proměnných prostředí
export function checkRequiredEnvVars() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ]

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Chybí povinné environment variables: ${missing.join(", ")}`)
  }
}

// Kontrola dostupnosti BankID
export function isBankIdAvailable() {
  return !!(process.env.BANKID_API_KEY && process.env.BANKID_CLIENT_ID && process.env.BANKID_CLIENT_SECRET)
}

// Kontrola dostupnosti MojeID
export function isMojeIdAvailable() {
  return !!(process.env.MOJEID_API_KEY && process.env.MOJEID_CLIENT_ID && process.env.MOJEID_CLIENT_SECRET)
}

// Pomocná funkce pro získání URL aplikace
export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

// Kontrola, zda jsme v produkčním prostředí
export function isProduction() {
  return process.env.NODE_ENV === "production"
}

// Kontrola, zda jsme v demo režimu
export function isDemoMode(shopId: string) {
  return shopId === "demo" || !isProduction()
}

