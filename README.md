# PassProve — klientský portál a integrační varianta

Varianta klientského portálu v Next.js a Supabase spojující správu účtu, e-shopů a ověřovací rozhraní.

**Stav:** Starší nebo souběžná varianta PassProve uchovaná jako reference; nejde o označení hlavní produkční verze.

## Co projekt obsahuje

- Přehled, e-shopy, účet, přizpůsobení a podpora.
- Zdrojové kódy API pro ověřování a faktury.
- Rozhraní a modelové soubory pro práci s obličejem a OCR.

## Technologie

Next.js, React, TypeScript, Tailwind CSS, Supabase.

## Architektura a struktura

- `app/` — hlavní stránky a API Next.js
- `api/` — souběžná struktura zdrojů API
- `components/` — komponenty portálu
- `lib/` — aplikační pomocné funkce

## Lokální vývoj

Potřebujete Node.js a npm. V kořenové složce repozitáře spusťte:

```sh
npm install
npm run dev
```

Příkaz pro sestavení uvedený v projektu: `npm run build`.

Jde o příkazy deklarované v repozitáři, nikoli o potvrzení úspěšného sestavení. Instalace závislostí, sestavení ani napojení na živé služby nebyly při úpravě dokumentace spuštěny.

## Konfigurace a omezení

Přítomné jsou souběžné kopie cest a generovaný obsah v `client/.next/`. Soubory mimo adresáře cest frameworku se automaticky nestávají aktivními API. Před sjednocením ověřte používanou implementaci. Přihlašovací údaje poskytovatelů, databázové politiky a reálné výsledky ověřování nebyly prověřeny.

## Co doplnit do dokumentace

Snímky obrazovky s fiktivními daty, opakovatelný postup ověření a přehled skutečně otestovaných integrací. Přihlašovací údaje a konfigurace konkrétního nasazení patří mimo Git.
