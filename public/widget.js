(function() {
  // Konfigurace
  const config = {
    shopId: document.currentScript.getAttribute('data-shop-id'),
    apiKey: document.currentScript.getAttribute('data-api-key'),
    baseUrl: 'APP_URL', // Bude nahrazeno při buildu
  };

  // Kontrola kreditu a customizace
  async function initialize() {
    try {
      const response = await fetch(`${config.baseUrl}/api/verify/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ shopId: config.shopId }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Age verification initialization failed:', data.error);
        return;
      }

      if (!data.hasCredit) {
        console.error('Insufficient credit for age verification');
        return;
      }

      // Přidání tlačítka pro ověření
      createVerificationButton(data.customization);
    } catch (error) {
      console.error('Failed to initialize age verification:', error);
    }
  }

  // Vytvoření tlačítka
  function createVerificationButton(customization) {
    const button = document.createElement('button');
    button.id = 'age-verify-button';
    button.innerHTML = 'Ověřit věk';
    button.style.backgroundColor = customization.primaryColor;
    button.style.color = customization.secondaryColor;
    button.style.borderRadius = customization.buttonStyle === 'pill' ? '9999px' : '0.375rem';
    button.style.padding = '0.5rem 1rem';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.fontFamily = customization.font;

    button.onclick = () => openVerificationDialog(customization);
    
    // Vložení tlačítka do stránky
    document.body.appendChild(button);
  }

  // Otevření dialogu pro ověření
  function openVerificationDialog(customization) {
    const width = 500;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const verificationWindow = window.open(
      `${config.baseUrl}/verify/${config.shopId}?apiKey=${config.apiKey}`,
      'AgeVerification',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Naslouchání na výsledek ověření
    window.addEventListener('message', function(event) {
      if (event.origin !== config.baseUrl) return;
      
      if (event.data.type === 'verification-complete') {
        if (event.data.success) {
          // Uložení výsledku do localStorage
          localStorage.setItem('age-verified', 'true');
          localStorage.setItem('age-verified-until', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        }
        verificationWindow?.close();
      }
    });
  }

  // Spuštění inicializace
  initialize();
})(); 