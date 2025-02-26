import esbuild from "esbuild"
import { resolve } from "path"

async function build() {
  try {
    // Build hlavního widget skriptu
    await esbuild.build({
      entryPoints: [resolve(__dirname, "../lib/widget/widget.ts")],
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ["es2018"],
      format: "iife",
      globalName: "AgeVerification",
      outfile: resolve(__dirname, "../public/widget.js"),
      define: {
        "process.env.NEXT_PUBLIC_APP_URL": JSON.stringify(process.env.NEXT_PUBLIC_APP_URL),
      },
    })

    // Build inline verze pro iframe
    await esbuild.build({
      entryPoints: [resolve(__dirname, "../lib/widget/inline.ts")],
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ["es2018"],
      format: "iife",
      outfile: resolve(__dirname, "../public/inline.js"),
      define: {
        "process.env.NEXT_PUBLIC_APP_URL": JSON.stringify(process.env.NEXT_PUBLIC_APP_URL),
      },
    })

    console.log("✅ Widget built successfully!")
  } catch (error) {
    console.error("❌ Build failed:", error)
    process.exit(1)
  }
}

build()

