/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */

import Base64 from 'base-64';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { URL } from 'url';
import evolvConfig from '../evolv.config.js';

function escapeRegEx(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function getUrlCond(context) {
  const { condition } = context;

  return condition['web.url'] || condition.and['web.url'];
}

function buildPredicates(context, baseUrl) {
  const url = new URL(baseUrl);
  const protocol = url.protocol.slice(0, -1);
  const baseUrlValue = `${protocol}?:\\/\\/${escapeRegEx(url.host)}\\/`;
  const { condition } = context;

  function buildRule(key, value, operator) {
    return {
      field: key,
      operator: operator || 'regex64_match',
      value: Base64.encode(
        new RegExp(key === 'web.url' ? `${baseUrlValue}${value}` : value, 'i'),
      ),
    };
  }
  return {
    combinator: 'and',
    rules: Object.keys(condition).map((key) => buildRule(key, condition[key])),
    id: `${context.id}-${Object.keys(condition).length}`, // kind of arbitrary
  };
}

function saveYaml(yamlModel, yamlPath) {
  const newYmlContent = yaml.dump(yamlModel);
  const yamlDir = path.dirname(yamlPath);

  if (!fs.existsSync(yamlDir)) {
    fs.mkdirSync(yamlDir, { recursive: true });
  }

  fs.writeFileSync(yamlPath, newYmlContent);
}

function generatePreviewLinks(config) {
  const context = config.contexts[0];
  return [
    {
      uri: 'evolv-web://view/{account_id}/{metamodel_id}/{metamodel_version}?project_name={project_name}&combination={combination}',
      display_name: 'Preview in Web Editor',
    },
    {
      uri: `${context.referenceUrls[0]}#evolvCandidateToken={candidate_token}`,
      display_name: 'Preview in Browser',
    },
  ];
}

function mergeContext(context, contextId, baseUrl) {
  const assets = {
    javascript: '',
    css: '',
  };

  const newContext = {};

  newContext._id = contextId;
  newContext._display_name = context.display_name || '';

  newContext._metadata = {
    page_def: {
      domain_match_type: 'full',
      path_match_type: 'regex',
      reference_urls: context.referenceUrls,
      _pattern: getUrlCond(context),
      is_entry_context: true,
    },
    script: assets.javascript,
    styles: assets.css,
  };

  newContext._disable = false;

  newContext._config = {
    _id: contextId,
    _type: 'url',
    _is_entry_point: Object.prototype.hasOwnProperty.call(
      context,
      'is_entry_point',
    )
      ? context.is_entry_point
      : true,
    _predicate: buildPredicates(context, baseUrl),
    _initializers: [
      { type: 'css', code: assets.css },
      { type: 'javascript', code: assets.javascript },
    ],
  };

  return newContext;
}

function mergeVariable(variable, variableId, values) {
  const newVariable = {};
  newVariable._values = values;

  newVariable._id = variableId;
  newVariable._display_name = variable.display_name || '';
  newVariable._metadata = {};
  newVariable._disable = variable.disable || false;
  newVariable._description = variable.description || '';
  newVariable._expanded = true;
  newVariable._config = {
    _id: variableId,
    _type: 'manual',
    _is_entry_point: variable.is_entry_point || false,
    _predicate: variable.predicate || null,
    _initializers: [],
  };

  return newVariable;
}

function generateControl() {
  const yamlValue = {};
  yamlValue._display_name = 'Noop';

  yamlValue._metadata = { uses_noop: true, generated_control: true };
  yamlValue._value = { type: 'noop' };
  yamlValue._disable = false;
  yamlValue._screenshots = [];
  return yamlValue;
}

function mergeVariant(variant, variantId) {
  const yamlValue = {};

  yamlValue._display_name = variant.display_name || '';

  yamlValue._value = { id: variantId };

  if (variant.source) {
    yamlValue._value.script = '';
    yamlValue._value.styles = '';
    yamlValue._value.type = variant.type || 'compound';
    yamlValue._value._metadata = variant.metadata || {};
  }

  yamlValue._disable = variant.disable || false;
  yamlValue._metadata = variant.metadata || {};
  yamlValue._screenshots = [];

  return yamlValue;
}

function mergeToYaml(config) {
  const newYaml = {};

  newYaml._version = '3';
  newYaml._name = config.name || '';
  newYaml._metadata = {
    base_url: config.baseUrl || config.contexts[0].reference_urls,
    controlsEditable: false,
    treeShakeDependencies: false,
    enableSass: false,
    dependencies: [],
  };

  newYaml.web = {};
  newYaml.web._metadata = {};
  newYaml.web._config = { dependencies: '' };

  config.contexts.forEach((context) => {
    const contextId = `${context.id}${config.version || ''}`;
    const newContext = mergeContext(context, contextId, config.baseUrl || '');
    if (context.variables) {
      context.variables.forEach((variable, variableIndex) => {
        const variableId = `${contextId}${variable.id}`;
        const basePath = `./export/.build/${context.id}/${variable.id}`;

        if (variableIndex > 0) variable.disable = true;
        if (variable.variants) {
          variable.variants.forEach((v, variantIndex) => {
            v.source = `${basePath}/${v.id}`;
            if (variableIndex > 0) return;
            if (variantIndex > 0) v.disable = true;
          });
          const variants = [
            generateControl(),
            ...variable.variants.map((variant) =>
              mergeVariant(variant, `${variableId}${variant.id}`),
            ),
          ];
          newContext[variableId] = mergeVariable(
            variable,
            variableId,
            variants,
          );
        }
      });
    }

    newContext._expanded = true;
    newContext._description = context.description || '';
    newYaml.web[contextId] = newContext;
  });

  newYaml.web._combination_previews = generatePreviewLinks(config);

  return newYaml;
}

// update yml with config updates
try {
  const newModel = mergeToYaml(evolvConfig);
  const aaPath = `${path.dirname(evolvConfig.export)}/${path.basename(
    evolvConfig.export,
    '.yml',
  )}-aa.yml`;
  console.log('export', aaPath);

  saveYaml(newModel, aaPath || 'export/exp-aa.yml');
} catch (e) {
  console.log(e);
}
