import { readFile, writeFile } from 'fs/promises';
import { simpleGit } from 'simple-git';

const args = process.argv.slice(2);
const git = simpleGit();

// update version
const path = 'src/version.json';
const publicPath = './public/version.txt';
let txt = await readFile(path);
const Ver = JSON.parse(txt);
let vtxt = `v${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;

// count up
if( !/NoIncrease|NoCount/i.test(args[0]) ) {
  Ver.build++;
  vtxt = `v${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
  
  await writeFile( path, JSON.stringify(Ver, null, '  ') );
  // place version file in ./public
  await writeFile(publicPath, vtxt);
  
  await git.add(path).add(publicPath).commit(vtxt);
}



/*
// edit package.json
path = './package.json';
txt = await readFile(path);
const Package = JSON.parse(txt);
//Package.version = `${Ver.major}.${Ver.minor}.${String(Ver.build).padStart(3, '0')}${Ver.tag}`;
Package.version = vtxt;
await writeFile( path, JSON.stringify(Package, null, '  ') );
*/


// push tag
await git.addTag(vtxt);
await git.push('origin', 'main', ['--tags']);

console.log(vtxt);

