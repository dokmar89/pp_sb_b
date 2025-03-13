import { CheckPaymentButton } from "@/components/check-payment-button"

// V seznamu faktur nebo detailu faktury přidáme tlačítko
{transaction.status === 'pending' && (
  <CheckPaymentButton 
    transactionNumber={transaction.transaction_number}
    onPaymentConfirmed={() => {
      // Zde můžeme aktualizovat UI nebo znovu načíst data
      router.refresh()
    }}
  />
)} 