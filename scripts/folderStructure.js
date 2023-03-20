const fs = require('fs');

const sourcePath = `./src`;
const templatesPath = `${sourcePath}/templates`;
const scriptTemplatePath = `./scripts/templates`;

var config;
function generateFolders(configuration, legacyContent){
  legacyContent = legacyContent || {};

  config = configuration;
  // console.info('top level', config.contexts[0].variables)
  //do we need a guard?
  validateTopFolders();
  config.contexts.forEach(context => {
    // console.info('checking for context', context.variables)

    var contextPath = `${sourcePath}/${context.id}`;
    validateContextFiles(contextPath, getContent(legacyContent, context.legacyId));
    context.variables.forEach(variable => {
      var variablePath = `${contextPath}/${variable.id}`;
      validateVariableFiles(variablePath, legacyContent);
      // console.info('checking for variable', variable)
      variable.variants.forEach(variant => {
        // console.info('checking for variant', variant)

        var variantPath = `${variablePath}/${variant.id}`;
        validateVariantFiles(variantPath, variant, getContent(legacyContent, variant.legacyId))
      });
    })
  });
}

function replaceText(filePath, tag, newText){
  fs.readFile(filePath, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    // console.info('replacing text', filePath, tag, newText);
    var matchTag = new RegExp(tag, 'g')
    var result = data.replace(matchTag, newText);
  
    fs.writeFile(filePath, result, 'utf8', function (err) {
       if (err) return console.log(err);
    });
  });
  
}
function getTopFiles(){
  return [
    // {
    //   file: `${templatesPath}/html.js`,
    //   template: `${scriptTemplatePath}/html.js`
    // }
  ]
};

function getContextFiles(contextPath, legacyContent){
  return [
    {
      file: `${contextPath}/context.js`,
      template: `${scriptTemplatePath}/context.js`,
      content: legacyContent?.javascript
    },
    {
      file: `${contextPath}/context.scss`,
      content: legacyContent?.css,
      template: null
    },
    {
      file: `${contextPath}/setup.js`,
      template: `${scriptTemplatePath}/setup.js`,
      postProcess: ()=> replaceText(`${contextPath}/setup.js`, '__sandbox__', config.id)
    }
  ];
}

function getVariableFiles(variablePath){
  return [
    {
      file: `${variablePath}/common.js`,
      template: `${scriptTemplatePath}/common.js`
    }
  ];
}

function getVariantFiles(variantPath, variantTag, legacyContent){
  return [
    {
      file: `${variantPath}.js`,
      template: `${scriptTemplatePath}/variant.js`,
      content: legacyContent?.javascript,
      postProcess: ()=> replaceText(`${variantPath}.js`, '__variant__', variantTag)
    },
    {
      file: `${variantPath}.scss`,
      content: legacyContent?.css,
      template: null
    }
  ];
}


function initializeFolder(folderPath){
  console.info('initialization of folder', folderPath)
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()){
    fs.mkdirSync(folderPath);
  }
}

function initializeFile(fileObj){
  console.info('initializing file', fileObj)
  if (!fs.existsSync(fileObj.file)){
    if (fileObj.content){
      fs.writeFile(fileObj.file, fileObj.content, 'utf8', function (err) {
        if (err) return console.log(err);
      });
    } else if (fileObj.template){
      fs.copyFileSync(fileObj.template, fileObj.file);
      if (fileObj.postProcess){
        console.info('postProcessing')
        fileObj.postProcess();
      }
    } else {
      fs.closeSync(fs.openSync(fileObj.file, 'w'));
    }
  }
}

function getContent(legacyContent, key){
  return (key && legacyContent[key]) || {
    javascript: null,
    css: null
  }
}
function validateTopFolders(){
  initializeFolder(sourcePath)
  initializeFolder(templatesPath);
  getTopFiles().forEach(initializeFile);
}

function validateContextFiles(contextPath, legacyContent){
  initializeFolder(contextPath)
  getContextFiles(contextPath, legacyContent).forEach(initializeFile);
}

function validateVariableFiles(variablePath){
  initializeFolder(variablePath)
  getVariableFiles(variablePath).forEach(initializeFile);
}

function validateVariantFiles(variantPath, variant, legacyContent){
  getVariantFiles(variantPath, variant.id, legacyContent).forEach(initializeFile);
}

module.exports = {generateFolders};