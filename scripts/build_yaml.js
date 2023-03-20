const Base64 = require('base-64');
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml');
const { URL } = require('url');

processConfig('./evolv-config.json', './dist/exp.yml')

//update yml with config updates
function processConfig(input, output){
  try {
    var config = loadConfig(absolutePath(input));
    var newModel = mergeToYaml(config)
    saveYaml(newModel, config.output || output)
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

// function loadYaml(yamlPath){
//   var ymlData = fs.readFileSync(yamlPath, 'utf-8')
//   return yaml.load(ymlData);
// } 

function saveYaml(yamlModel, yamlPath) {
  const newYmlContent = yaml.dump(yamlModel)
  fs.writeFileSync(yamlPath, newYmlContent)
}

function generatePreviewLinks(config) {
  var context = config.contexts[0];
  return [
    {
      "uri": "evolv-web://view/{account_id}/{metamodel_id}/{metamodel_version}?project_name={project_name}&combination={combination}",
      "display_name": "Preview in Web Editor"
    },
    {
      "uri": `${context.referenceUrls[0]}#evolvCandidateToken={candidate_token}`,
      "display_name": "Preview in Browser"
    }
  ];
}

function mergeToYaml(config) {
  var newYaml = {};

  newYaml._version = '3';
  newYaml._name = config.name || '';
  newYaml._metadata = {
    base_url: config.baseUrl || config.contexts[0].reference_urls,
    controlsEditable: false,
    treeShakeDependencies: false,
    enableSass: false,
    enableVisualEditor: false,
    dependencies: [],
  };

  newYaml.web = {}
  newYaml.web._metadata = {};
  newYaml.web._config = { dependencies: '' };

  config.contexts.forEach(context => {
    var contextId = context.legacyId  || `${config.id}_${context.id}`
    var newContext = mergeContext(context, contextId, config.baseUrl || '');
    context.variables.forEach(variable => {
      var variableId = `${contextId}_${variable.id}`
      var basePath = `./dist/${context.id}/${variable.id}`;
      variable.variants.forEach(v => v.source = `${basePath}/${v.id}`)
      var variants = [generateControl(variable), ...variable.variants.map(variant =>
        mergeVariant(variant, variant.legacyId || `${variableId}_${variant.id}`)
      )];
      newContext[variable.legacyId || variableId] = mergeVariable(variable, variable.legacyId || variableId, variants);;
    })

    newContext._expanded = true;
    newContext._description = context.description || '';
    newYaml.web[contextId] = newContext
  });

  newYaml.web._combination_previews = generatePreviewLinks(config);

  return newYaml;
}

function getUrlCond(context) {
  var condition = context.condition;

  return condition['web.url'] || condition['and']['web.url'];
}

function buildPredicates(context, baseUrl) {
  var url = new URL(baseUrl);
  var protocol = url.protocol.slice(0, -1);
  var baseUrlValue = `${protocol}?://${url.host}/`;  var condition = context.condition;

  function buildRule(key, value, operator) {
    operator = operator || 'regex64_match';
    return {
      field: key,
      operator,
      value: Base64.encode(new RegExp(
        ('web.url' === key
          ? `${baseUrlValue}${value}`
          : value),
        'i'
      ))
    }
  }
  return {
    combinator: 'and',
    rules: Object.keys(condition).map(key => buildRule(key, condition[key])),
    id: `${context.id}-${Object.keys(condition).length}` //kind of arbitrary
  }
}

function mergeContext(context, contextId, baseUrl) {
  var closingLength = 7;
  var contextPath = `./dist/${context.id}/context`;

  var jsAsset = fs.readFileSync(absolutePath(`${contextPath}.js`), 'utf8')
  var cssPath = absolutePath(`${contextPath}.css`);
  var assets = {
    javascript: jsAsset.slice(0, -closingLength) + jsAsset.slice(-closingLength),
    css: (fs.existsSync(cssPath)) ? fs.readFileSync(cssPath, 'utf8') : ''
  }

  var newContext = {};

  newContext._id = contextId;
  newContext._display_name = context.display_name || '';

  newContext._metadata = {
    script: assets.javascript,
    styles: assets.css,
    components: [],
    page_def: {
      domain_match_type: 'full',
      path_match_type: 'regex',
      reference_urls: context.referenceUrls,
      _pattern: getUrlCond(context),
      is_entry_context: true
    },
    timing: 'immediate',
    timingSelectors: []
  }

  newContext._disable = false;

  newContext._config = {
    _id: contextId,
    _type: 'url',
    _is_entry_point: true,
    _predicate: buildPredicates(context, baseUrl),
    _initializers: [
      { type: 'css', code: assets['css'] },
      { type: 'javascript', code: assets['javascript'] }
    ]
  };


  return newContext;
}


function mergeVariable(variable, variableId, values) {
  var newVariable = {};
  newVariable._id = variableId;
  newVariable._display_name = variable.display_name || '';
  newVariable._metadata = {
    script: "",
    styles: "",
    components: [],
    idea: null
  };
  newVariable._disable = variable.disable || false;
  newVariable._values = values;
  newVariable._description = variable.description || '';
  newVariable._config = {
    _id: variableId,
    _type: 'manual',
    _is_entry_point: variable.is_entry_point || false,
    _predicate: variable.predicate || null,
    _initializers: []
  };

  return newVariable;
}

function generateControl(variable) {
  var yamlValue = {};
  console.info('merging control', yamlValue)
  yamlValue._reference_id = '';
  yamlValue._display_name = 'Control';
  yamlValue._metadata = {
    script: '',
    styles: '',
    components: '',
    idea: '',
    generated_control: true 
  }
  yamlValue._value = {
    id: variable.controlId || '',
    type: 'compound',
    _metadata: {},
    script: "",
    styles: "",
    timing: 'immediate',
    timingSelectors: []
  };
  yamlValue._disable = false;
  yamlValue._screenshots = [];
  return yamlValue
}

function legacyScript(script){
  return script.slice(0,-1);
}

function mergeVariant(variant, variantId) {
  var yamlValue = {}
  console.info('processing variant', variant.display_name, yamlValue)
  // if (!yamlValue || !(yamlValue._value)) return generateControl(yamlValue)

  yamlValue._reference_id = variantId;
  yamlValue._display_name = variant.display_name || '';
  yamlValue._metadata = {},
  yamlValue._value = { 
    id: variantId
  };

  if (variant.source) {
    var jsPath = absolutePath(`${variant.source}.js`);
    var cssPath = absolutePath(`${variant.source}.css`);
    var script = fs.readFileSync(jsPath, 'utf8');

    yamlValue._value.type = variant.type || 'compound';
    yamlValue._value._metadata = variant.metadata || {};
    yamlValue._value.script = !variant.prune ? script : legacyScript(script);
    yamlValue._value.styles = (fs.existsSync(cssPath)) ? fs.readFileSync(cssPath, 'utf8') : '';
    yamlValue._value.timing = 'immediate';
    yamlValue._value.timingSelectors = [];
  }

  yamlValue._screenshots = [];
  yamlValue._disable = variant.disable || false;

  return yamlValue;
}

