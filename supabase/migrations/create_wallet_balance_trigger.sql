-- Vytvoření funkce pro aktualizaci wallet balance
CREATE OR REPLACE FUNCTION update_company_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE companies
    SET "walletBalance" = "walletBalance" + NEW.amount
    WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vytvoření triggeru
CREATE OR REPLACE TRIGGER wallet_transaction_confirmed
  AFTER UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_wallet_balance(); 