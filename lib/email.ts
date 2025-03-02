"use server"

interface InvitationEmailParams {
  email: string
  firstName: string
  invitationToken: string
  companyName: string
}

export async function sendInvitationEmail({
  email,
  firstName,
  invitationToken,
  companyName
}: InvitationEmailParams) {
  try {
    // Zde by byla integrace s emailovým poskytovatelem (SendGrid, Mailgun, atd.)
    // Pro účely demonstrace pouze logujeme
    
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation?token=${invitationToken}`
    
    console.log(`
      Sending invitation email to: ${email}
      Subject: Pozvánka do systému ověření věku
      Body:
      Dobrý den ${firstName},
      
      byli jste pozváni do systému ověření věku společnosti ${companyName}.
      Pro dokončení registrace klikněte na následující odkaz:
      
      ${invitationUrl}
      
      Odkaz je platný 7 dní.
    `)
    
    // V produkci by zde bylo volání API pro odeslání emailu
    
    return { success: true }
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return { success: false, error: "Nepodařilo se odeslat pozvánkový email" }
  }
} 