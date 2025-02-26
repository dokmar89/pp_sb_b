-- Přidání sloupce invoice_number do tabulky wallet_transactions
ALTER TABLE wallet_transactions
ADD COLUMN invoice_number TEXT;

-- Vytvoření funkce pro generování čísla faktury
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    sequence INT;
    new_invoice_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Získání posledního čísla sekvence pro aktuální rok
    SELECT COALESCE(MAX(CAST(SUBSTRING(wt.invoice_number FROM 6) AS INTEGER)), 0)
    INTO sequence
    FROM wallet_transactions wt
    WHERE wt.invoice_number IS NOT NULL
    AND wt.invoice_number LIKE current_year || '/%';
    
    -- Vytvoření nového čísla faktury
    new_invoice_number := current_year || '/' || LPAD((sequence + 1)::TEXT, 5, '0');
    
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger pro automatické generování čísla faktury při změně statusu na 'completed'
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.type = 'credit' AND NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_invoice_number
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

