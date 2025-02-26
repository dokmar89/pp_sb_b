export function generateEmbedCode(shopId: string, apiKey: string) {
  return `
<!-- Age Verification Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL}/widget.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-shop-id', '${shopId}');
    script.setAttribute('data-api-key', '${apiKey}');
    document.head.appendChild(script);
  })();
</script>
`
} 