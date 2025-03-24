const Base64 = require('base-64');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { URL } = require('url');

const fullPath = path.resolve();
const currentFolder = fullPath.match(/([^\/]*)\/*$/)[0];
const inputName = path.resolve(`../${currentFolder}.yml`);
const outputName = path.resolve(`../${currentFolder}.out.yml`);
const startRegion = '//#region Variant Name'
const endRegion = '//#endregion'



processYaml(
  process.argv[2] || inputName, 
  process.argv[3] || outputName
);

//update evolv config with legacy 
function processYaml(inputYamlFile, outputYamlFile){
  try {
    const parentId = 'web';

    console.info('reading yml', inputYamlFile)
    var yaml = loadYaml(inputYamlFile); 
    console.info('writing yml', outputYamlFile)

    Object.keys(yaml.web)
      .filter(isChildKey)
      .forEach(cKey=> processContext(yaml.web[cKey], `${parentId}.${cKey}`))

    saveYaml(yaml, outputYamlFile)
  } catch (e) {
    console.info('error:', e)
  }
}

function processContext(context, id){
    Object.keys(context)
        .filter(isChildKey)
        .forEach(cKey=> processVariable(context[cKey], `${id}.${cKey}`))
}

function processVariable(variable, id){
  variable._values.forEach((variant,i)=> 
    processVariant(
        variant, 
        (vid=>(vid ? `${id}.${vid}` : id))(variant._value?.id),
        i
    )
  )
}

function processVariant(variant, id, index){ 
    if (!variant._value.script) {
      if (index === 0) return;
      variant._value.script = `
      `
    }

    const name = variant._display_name;

    variant._value.script = injectVariantName(variant._value.script, id, name)
}


function injectVariantName(script, id, name){
    let insertPosition = 0;
    if (script.includes(startRegion)){
        insertPosition = script.indexOf(startRegion);
        let endPosition = script.indexOf(endRegion, insertPosition);
        script = `${c.slice(0,insertPosition)}${c.slice(endPosition+endRegion.length)}`        
    }
    return `
      ${script.slice(0,insertPosition)}
      ${startRegion}
        client.addDisplayName?.('variants', '${id}', '${name}');
      ${endRegion}
      ${script.slice(insertPosition)}
    `;
}

function loadYaml(yamlPath){
    var ymlData = fs.readFileSync(yamlPath, 'utf-8')
    return yaml.load(ymlData);
} 

function saveYaml(yamlModel, yamlPath) {
    const newYmlContent = yaml.dump(yamlModel)
    fs.writeFileSync(yamlPath, newYmlContent)
}

function isChildKey(cKey){
    return !/^_/.test(cKey)
}