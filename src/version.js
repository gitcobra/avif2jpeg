import { readFile, writeFile } from 'fs/promises';


// update version
let path = 'src/version.json';
let txt = await readFile(path);
const Ver = JSON.parse(txt);
Ver.build++;
await writeFile( path, JSON.stringify(Ver, null, '  ') );

// edit package.json
path = './package.json';
txt = await readFile(path);
const Package = JSON.parse(txt);
//Package.version = `${Ver.major}.${Ver.minor}.${String(Ver.build).padStart(3, '0')}${Ver.tag}`;
Package.version = `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
await writeFile( path, JSON.stringify(Package, null, '  ') );

//console.log(Ver);
