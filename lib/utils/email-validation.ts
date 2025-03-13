const BLOCKED_DOMAINS = [
  'gmail.com',
  'seznam.cz',
  'email.cz',
  'centrum.cz',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  // přidat další domény podle potřeby
]

export function isCompanyEmail(email: string): boolean {
  const domain = email.split('@')[1].toLowerCase()
  return !BLOCKED_DOMAINS.includes(domain)
} 