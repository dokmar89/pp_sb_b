export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          ico: string
          dic: string
          address: string
          email: string
          phone: string
          contact_person: string
          wallet_balance: number
          status: "pending" | "approved" | "rejected"
          created_at: string
        }
        Insert: Omit<Companies["Row"], "id" | "created_at" | "status">
        Update: Partial<Companies["Row"]>
      }
      shops: {
        Row: {
          id: string
          company_id: string
          name: string
          url: string
          sector: string
          verification_methods: string[]
          integration_type: string
          pricing_plan: string
          api_key: string
          status: "active" | "inactive"
          created_at: string
        }
        Insert: Omit<Shops["Row"], "id" | "created_at" | "api_key">
        Update: Partial<Shops["Row"]>
      }
      wallet_transactions: {
        Row: {
          id: string
          company_id: string
          type: "credit" | "debit"
          amount: number
          description: string
          status: "pending" | "completed" | "failed"
          created_at: string
        }
        Insert: Omit<WalletTransactions["Row"], "id" | "created_at">
        Update: Partial<WalletTransactions["Row"]>
      }
      verifications: {
        Row: {
          id: string
          shop_id: string
          method: "bankid" | "mojeid" | "ocr" | "facescan"
          result: "success" | "failure"
          price: number
          created_at: string
        }
        Insert: Omit<Verifications["Row"], "id" | "created_at">
        Update: Partial<Verifications["Row"]>
      }
      customizations: {
        Row: {
          id: string
          shop_id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          font: string
          button_style: string
          verification_methods: string[]
          failure_action: "redirect" | "block"
          failure_redirect: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Customizations["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Customizations["Row"]>
      }
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

type Companies = Database["public"]["Tables"]["companies"]
type Shops = Database["public"]["Tables"]["shops"]
type WalletTransactions = Database["public"]["Tables"]["wallet_transactions"]
type Verifications = Database["public"]["Tables"]["verifications"]
type Customizations = Database["public"]["Tables"]["customizations"]

