import { readFile, writeFile } from 'fs/promises';

// update version
const path = './src/version.json';
const publicPath = './public/version.txt';
let txt = await readFile(path);
const Ver = JSON.parse(txt);
let vtxt = `v${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;

// count up
Ver.build++;
vtxt = `v${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;

await writeFile( path, JSON.stringify(Ver, null, '  ') );
// place version file in ./public
await writeFile(publicPath, vtxt);

/*
// edit package.json
path = './package.json';
txt = await readFile(path);
const Package = JSON.parse(txt);
//Package.version = `${Ver.major}.${Ver.minor}.${String(Ver.build).padStart(3, '0')}${Ver.tag}`;
Package.version = vtxt;
await writeFile( path, JSON.stringify(Package, null, '  ') );
*/

console.log(vtxt);

