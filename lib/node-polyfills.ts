// lib/node-polyfills.ts
// Tento soubor poskytuje polyfilly pro Node.js moduly, které nejsou dostupné v prohlížeči,
// ale jsou vyžadovány knihovnou face-api.js

// Polyfill pro fs modul
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore
    window.fs = {
      promises: {
        readFile: async () => { return Buffer.from([]); }
      },
      readFileSync: () => Buffer.from([]),
      existsSync: () => false,
      writeFileSync: () => {},
      mkdirSync: () => {}
    };

    // @ts-ignore
    window.path = {
      join: (...args: string[]) => args.join('/'),
      resolve: (...args: string[]) => args.join('/'),
      dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
      extname: (path: string) => {
        const parts = path.split('.');
        return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
      },
      basename: (path: string, ext?: string) => {
        let base = path.split('/').pop() || '';
        if (ext && base.endsWith(ext)) {
          base = base.slice(0, -ext.length);
        }
        return base;
      }
    };

    // @ts-ignore
    window.Buffer = window.Buffer || {
      from: (data: any) => ({ data }),
      isBuffer: () => false
    };

    console.log('Node.js polyfills initialized successfully');
  } catch (e) {
    console.error('Error initializing Node.js polyfills:', e);
  }
}

export default function setupNodePolyfills() {
  // Funkce je prázdná, slouží pouze k zajištění importu tohoto souboru
  console.log('Node.js polyfills setup complete');
} 