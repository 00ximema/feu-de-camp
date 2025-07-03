
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Création d\'un export portable...');

// 1. Build du projet
console.log('📦 Construction du projet...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erreur lors du build:', error.message);
  process.exit(1);
}

// 2. Créer le dossier d'export
const exportDir = path.join(process.cwd(), 'export-portable');
if (fs.existsSync(exportDir)) {
  fs.rmSync(exportDir, { recursive: true, force: true });
}
fs.mkdirSync(exportDir, { recursive: true });

// 3. Copier les fichiers build
const distDir = path.join(process.cwd(), 'dist');
const targetDir = path.join(exportDir, 'app');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, targetDir);

// 4. Créer un serveur HTTP simple intégré
const serverCode = `
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  
  // Servir index.html pour toutes les routes SPA
  if (pathname === '/' || !path.extname(pathname)) {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, 'app', pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Si le fichier n'existe pas, servir index.html (pour le routing SPA)
      const indexPath = path.join(__dirname, 'app', 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404);
          res.end('Fichier non trouvé');
          return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(indexData);
      });
      return;
    }
    
    const ext = path.extname(pathname);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(\`🌐 Serveur démarré sur http://localhost:\${PORT}\`);
  console.log('📱 Votre application est maintenant accessible !');
  console.log('🛑 Appuyez sur Ctrl+C pour arrêter le serveur');
  
  // Ouvrir le navigateur automatiquement
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').exec(\`\${start} http://localhost:\${PORT}\`);
});
`;

fs.writeFileSync(path.join(exportDir, 'server.js'), serverCode);

// 5. Créer les scripts de démarrage
const windowsScript = `@echo off
echo ========================================
echo    GESTIONNAIRE DE SEJOUR - DEMARRAGE
echo ========================================
echo.
echo Demarrage du serveur...
echo Votre navigateur va s'ouvrir automatiquement
echo.
echo Pour arreter le serveur, fermez cette fenetre
echo ou appuyez sur Ctrl+C
echo.
node server.js
pause
`;

const unixScript = `#!/bin/bash
echo "========================================"
echo "   GESTIONNAIRE DE SEJOUR - DEMARRAGE"
echo "========================================"
echo ""
echo "Démarrage du serveur..."
echo "Votre navigateur va s'ouvrir automatiquement"
echo ""
echo "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""
node server.js
`;

fs.writeFileSync(path.join(exportDir, 'DEMARRER.bat'), windowsScript);
fs.writeFileSync(path.join(exportDir, 'demarrer.sh'), unixScript);

// Rendre le script Unix exécutable
try {
  fs.chmodSync(path.join(exportDir, 'demarrer.sh'), '755');
} catch (error) {
  console.warn('⚠️  Impossible de rendre le script Unix exécutable');
}

// 6. Créer un README
const readme = `# Gestionnaire de Séjour - Version Portable

## Comment utiliser cette application

### Sur Windows :
Double-cliquez sur \`DEMARRER.bat\`

### Sur Mac/Linux :
Double-cliquez sur \`demarrer.sh\` ou ouvrez un terminal et tapez :
\`\`\`
./demarrer.sh
\`\`\`

## Que se passe-t-il ?

1. Un serveur web local se lance sur votre ordinateur
2. Votre navigateur s'ouvre automatiquement sur http://localhost:8080
3. L'application fonctionne complètement hors ligne
4. Toutes vos données sont sauvegardées localement

## Arrêter l'application

- Fermez la fenêtre du terminal/invite de commande
- Ou appuyez sur Ctrl+C dans le terminal

## Prérequis

- Node.js doit être installé sur votre ordinateur
- Si Node.js n'est pas installé, téléchargez-le sur : https://nodejs.org

## Partage

Vous pouvez copier ce dossier \`export-portable\` sur d'autres ordinateurs.
Il suffit de copier tout le dossier et de lancer le script de démarrage.

## Support

Cette application fonctionne sur :
- Windows 10/11
- macOS
- Linux (Ubuntu, Debian, etc.)

Navigateurs supportés :
- Chrome, Firefox, Safari, Edge (versions récentes)
`;

fs.writeFileSync(path.join(exportDir, 'README.md'), readme);

console.log('✅ Export portable créé avec succès !');
console.log(`📁 Dossier : ${exportDir}`);
console.log('');
console.log('🎯 Instructions :');
console.log('1. Naviguez vers le dossier export-portable');
console.log('2. Sur Windows : double-cliquez sur DEMARRER.bat');
console.log('3. Sur Mac/Linux : double-cliquez sur demarrer.sh');
console.log('');
console.log('📦 Vous pouvez maintenant copier ce dossier sur d\'autres ordinateurs !');
