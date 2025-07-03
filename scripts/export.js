
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏗️  Construction du site pour l\'exportation...');

// Build du projet
execSync('npm run build', { stdio: 'inherit' });

console.log('✅ Construction terminée');
console.log('📦 Le site est prêt pour l\'exportation dans le dossier dist/');
console.log('');
console.log('Pour déployer :');
console.log('1. Copiez le contenu du dossier dist/ sur votre serveur web');
console.log('2. Ou utilisez un serveur local : npx serve dist');
console.log('');
console.log('Le site fonctionnera hors ligne grâce au service worker intégré.');
