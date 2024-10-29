import { glob } from "glob";
import { readFileSync, writeFileSync } from "fs";


const output = {};
const paths = await glob('./*.json');
for( const path of paths ) {
  const lang = path.match(/^([a-z\-]+)\.json/i)?.[1];
  if( !lang )
    continue;
  
  const dat = JSON.parse( readFileSync(path, 'utf8') );
  output[lang] = dat.lang; 
}

const outputPath = 'langlist.json';
writeFileSync( outputPath, JSON.stringify(output, null, '\t') );
