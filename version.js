import { readFile, writeFile } from 'fs/promises';
const path = './src/components/version.json';

const txt = await readFile(path);
const Ver = JSON.parse( txt );
Ver.build++;

await writeFile(path, JSON.stringify(Ver));
//console.log(Ver);
