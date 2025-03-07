const fs = require('fs');
const path = require('path');
const https = require('https');

// Cesta k adresáři s modely
const modelsDir = path.join(process.cwd(), 'public', 'models');

// URL pro stažení modelů
const modelBaseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Seznam potřebných souborů modelů
const requiredFiles = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1.bin',
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1.bin'
];

// Funkce pro stažení souboru
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Funkce pro kontrolu a přejmenování souborů
async function fixModelFiles() {
  console.log('Opravuji soubory modelů pro detekci obličeje...');
  
  try {
    // Kontrola, zda adresář existuje
    if (!fs.existsSync(modelsDir)) {
      console.log(`Adresář ${modelsDir} neexistuje, vytvářím...`);
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // Získání seznamu souborů v adresáři
    const files = fs.readdirSync(modelsDir);
    console.log('Nalezené soubory:', files);

    // Kontrola a přejmenování souborů
    for (const requiredFile of requiredFiles) {
      const filePath = path.join(modelsDir, requiredFile);
      
      // Kontrola, zda soubor existuje
      if (!files.includes(requiredFile)) {
        console.log(`Soubor ${requiredFile} chybí, stahuji...`);
        
        // Kontrola, zda existuje soubor bez přípony .bin
        const fileWithoutBin = requiredFile.replace('.bin', '');
        if (requiredFile.endsWith('.bin') && files.includes(fileWithoutBin)) {
          console.log(`Přejmenovávám ${fileWithoutBin} na ${requiredFile}`);
          fs.copyFileSync(
            path.join(modelsDir, fileWithoutBin),
            filePath
          );
        } else {
          // Stažení souboru
          try {
            await downloadFile(`${modelBaseUrl}/${requiredFile}`, filePath);
          } catch (error) {
            console.error(`Chyba při stahování souboru ${requiredFile}:`, error);
          }
        }
      }
    }

    // Vytvoření manifestu pro modely
    const manifestPath = path.join(modelsDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log('Vytvářím manifest.json...');
      const manifest = {
        models: requiredFiles.map(file => file.replace('.bin', ''))
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    // Kontrola, zda byly soubory úspěšně vytvořeny
    const updatedFiles = fs.readdirSync(modelsDir);
    console.log('Aktualizované soubory:', updatedFiles);

    // Kontrola, zda existují všechny potřebné soubory
    const missingFiles = requiredFiles.filter(file => !updatedFiles.includes(file));
    if (missingFiles.length > 0) {
      console.log('Chybějící soubory:', missingFiles);
    } else {
      console.log('Všechny potřebné soubory jsou k dispozici!');
    }

    console.log('Oprava souborů modelů dokončena!');
  } catch (error) {
    console.error('Chyba při opravě souborů modelů:', error);
  }
}

// Spuštění funkce
fixModelFiles(); 