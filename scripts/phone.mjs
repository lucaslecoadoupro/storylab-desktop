// Embarque le vrai téléphone Déclic dans le studio, pour que l'enseignant teste
// son histoire exactement comme ses élèves la verront.
//
//   node scripts/phone.mjs [chemin du dépôt StoryLab]   (par défaut ../storylab)
//
// 1. construit le téléphone (vite build) depuis le dépôt StoryLab ;
// 2. le copie dans phone/ (sans les modèles, la page mail ni les histoires publiées) ;
// 3. recopie le format des scénarios et le validateur dans src/renderer/app/shared/,
//    pour que le studio vérifie les histoires avec exactement les mêmes règles.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storylab = path.resolve(process.argv[2] || process.env.STORYLAB_DIR || path.join(root, '..', 'storylab'));
if (!fs.existsSync(path.join(storylab, 'src', 'engine', 'validate.ts'))) {
  console.error(`Dépôt StoryLab introuvable : ${storylab}\nUsage : node scripts/phone.mjs <chemin du dépôt StoryLab>`);
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { cwd: storylab, stdio: 'inherit' });
if (!fs.existsSync(path.join(storylab, 'node_modules'))) run('npm ci --no-audit --no-fund');
const out = path.join(root, 'phone');
fs.rmSync(out, { recursive: true, force: true });
run(`npx vite build --outDir "${out}" --emptyOutDir`);

for (const dir of ['modeles', 'mail', 'scenarios']) fs.rmSync(path.join(out, dir), { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'scenarios'), { recursive: true });
// Aucun lanceur : dans le studio, seule l'histoire en cours de test est jouée.
fs.writeFileSync(path.join(out, 'scenarios', 'catalog.json'), JSON.stringify({ launchers: [] }));

const shared = path.join(root, 'src', 'renderer', 'app', 'shared');
for (const f of ['types.ts', 'validate.ts', 'describe.ts']) fs.copyFileSync(path.join(storylab, 'src', 'engine', f), path.join(shared, f));

// Applis connues du téléphone (identifiants), pour le validateur.
const registry = fs.readFileSync(path.join(storylab, 'src', 'apps', 'registry.ts'), 'utf8');
const ids = [...registry.matchAll(/^\s+id: '([\w-]+)'/gm)].map((m) => m[1]);
fs.writeFileSync(path.join(shared, 'apps.json'), JSON.stringify(ids));

const pkg = JSON.parse(fs.readFileSync(path.join(storylab, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'studio-phone.json'), JSON.stringify({ storylab: pkg.version, builtAt: new Date().toISOString() }));
console.log(`Téléphone Déclic embarqué dans phone/ (${ids.length} applis).`);
