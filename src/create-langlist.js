import { globSync } from "glob";
import { readFileSync, writeFileSync } from "fs";

const dir = import.meta.dirname.replace(/\\/g, '/');
//let currentWorkingDirectory = process.cwd();
//console.log(currentWorkingDirectory);

const output = {};
const paths = globSync(dir + '/locales/*.json');
paths.sort();
for( const path of paths ) {
  const lang = path.match(/([a-z\-]+)\.json$/i)?.[1];
  if( !lang )
    continue;
  
  const dat = JSON.parse( readFileSync(path, 'utf8') );
  output[lang] = dat.lang; 
}


const outputPath = dir + '/langlist.json';
writeFileSync( outputPath, JSON.stringify(output, null, '\t') );

console.log(`output:`, outputPath);

