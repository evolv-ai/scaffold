const fs = require('fs');
const { generateFolders } = require('./folderStructure.js'); 

try{
  var config = loadConfig(absolutePath('./evolv-config.json'));
  // console.info('top level', config.contexts[0].variables)

  generateFolders(config)
  console.info('folder generation completed');
} catch(e){
  console.info('error:', e)
}

//support functions
function absolutePath(path){
  return path;
}

function loadConfig(configPath){
  var results = fs.readFileSync(configPath, 'utf8');
  // console.info('loading', configPath, results);
 return JSON.parse(results)
}

