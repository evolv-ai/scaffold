const Base64 = require('base-64');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { URL } = require('url');
const { generateFolders } = require('./folderStructure.js'); 

const fullPath = path.resolve();
const currentFolder = fullPath.match(/([^\/]*)\/*$/)[0];
const yamlName = path.resolve(`../${currentFolder}.yml`);

const Default = {
    condition: '<path regex>',
    baseUrl: 'https://<domain>/',
    referenceUrl: 'https://<domain>/<path>',
    projectName: 'Change this name',
    projectId: 'change_this_id',
    pageName: 'Page 1'
};

processConfig('./legacy.yml', yamlName)

//update evolv config with legacy 
function processConfig(yaml, json){
  try {
    var legacy = loadYaml(yaml); 
    var config = loadConfig(absolutePath(json));
    var extraction = extractFromYaml(legacy, config);
    var newConfig = extraction.config;
    updateConfig(newConfig, json);
    generateFolders(newConfig, extraction.legacyContent);
    console.info('merge completed');
  } catch (e) {
    console.info('error:', e)
  }
}


//support functions
function absolutePath(path) {
  return path;
}

function loadConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

function updateConfig(config, configPath) {
  var json = JSON.stringify(config);
  fs.writeFileSync(configPath, json, 'utf8');
}

function loadYaml(yamlPath){
  var ymlData = fs.readFileSync(yamlPath, 'utf-8')
  return yaml.load(ymlData);
} 

function genId(prefix, items){
    function extractIndex(id){
        var match = id.match(new RegExp(`${prefix}-([0-9]*)`))
        return match ?parseInt(match[1]) :0;
    }
    var lastIndex = items.reduce((a,item)=> Math.max(a, extractIndex(item.id)),0)
    return lastIndex+1;
}

function extractFromYaml(legacy, config){
    //I don't think we need to do anything with the project id
    // if (config.id === Default.projectId){
    // } 
    console.info('extracting from yaml')
    if (config.name === Default.projectName || config.name.length === 0){
        config.name = legacy._name;
    }
    if (!config.baseUrl || config.baseUrl === Default.baseUrl){
        config.baseUrl = legacy._metadata.base_url;
    }
    var yamlContexts = legacy.web;
    var contextIds = Object.keys(legacy.web).filter(id=>!id.startsWith('_'))
    var legacyContent = {};

    contextIds.forEach(cid=>{
        var lc = yamlContexts[cid];
        var match = config.contexts.find(c=>c.legacyId === cid)
        if (!match){
            match = {legacyId: cid, id: `import-${genId('import',config.contexts)}`};
            config.contexts.push(match);
            legacyContent[match.legacyId] = {
                javascript: lc._metadata.script 
                         || null,
                css: lc._metadata.preprocessors?.css?.source 
                  || lc._metadata.styles
                  || null
            }
        }
        if (!match.display_name){
            match.display_name = lc._display_name;
        }
        var pageDef = lc._metadata.page_def;
        if (!match.referenceUrls){
            match.referenceUrls = pageDef.reference_urls;
        }
        if (!match.condition){
            match.condition = extractConditions(pageDef)
        }
        match.variables = match.variables || []
        extractVariables(lc, match.variables, legacyContent)
    })

    return {config, legacyContent};
}

function extractConditions(pageDef){
    return {'web.url': pageDef._pattern}
}

function extractVariables(legacyContext, variables, legacyContent){
    var variableIds = Object.keys(legacyContext).filter(id=>!id.startsWith('_'));

    variableIds.forEach(lvid=>{
        var lv = legacyContext[lvid];
        var match = variables.find(v=>v.legacyId === lvid)
        if (!match){
            match = {legacyId: lv._id, id: `var-${genId('var', variables)}`};
            variables.push(match);
        }
        if (!match.display_name){
            match.display_name = lv._display_name;
        }
        if (lv._disable){
            match.disable = lv._disable;
        }
        if (!match.description && lv._description){
            match.description = lv._description;
        }
        extractVariants(lv._values, match, legacyContent)
    })
}

function extractVariants(legacyValues, variable, legacyContent){
    var controlValue = legacyValues[0];
    if (controlValue?._value?.id){
        variable.controlId = controlValue._value.id;
    }
    
    var variants = variable.variants;
    if (!variants){
        variants = [];
        variable.variants = variants;
    }
    legacyValues.slice(1).forEach(lv=>{
        var match = variants.find(v=> v.legacyId===lv._value.id);
        if (!match){
            match = {legacyId: lv._value.id, id: `v-${genId('v', variants)}`}
            variants.push(match);
            legacyContent[match.legacyId] = {
                javascript: lv._value.script || null,
                css: lv._value.styles || null
            }
        }
        match.display_name = match.display_name || lv._display_name;
        if (lv._value.type !== 'compound'){
            match.type = match.type || lv._value.type;
        }
        if (lv._value.type !== 'immediate'){
            match.timing = match.timing || lv._value.timing;
        }
        if (lv._disable){
            match.disable = lv._disable;
        }
    })
}
