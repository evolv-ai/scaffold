import fs from 'fs';
import PromptSync from 'prompt-sync';
import evolvConfig from '../evolv.config.js';

function prompt(string) {
  const p = PromptSync();
  const result = p(`\x1b[32m[scaffold]\x1b[0m ${string}`);
  return result;
}

const contextsPath = './src/contexts';
const scriptTemplatePath = './scripts/templates';

function log(...args) {
  console.log('\x1b[32m[scaffold]\x1b[0m', ...args);
}

function replaceText(filePath, tag, newText) {
  // log('replacing text', filePath, tag, newText);
  const fileString = fs.readFileSync(filePath, 'utf8');
  const matchTag = new RegExp(tag, 'g');
  if (!fileString.match(matchTag)) {
    log(`tag '${tag}' not found in`, filePath);
  }
  const result = fileString.replace(matchTag, newText);

  fs.writeFileSync(filePath, result, 'utf8');
}

function getContextFiles(contextPath, context) {
  return [
    {
      file: `${contextPath}/context.js`,
      template: `${scriptTemplatePath}/context.js`,
      postProcess: () => {
        const importStatements = [];
        const variantDeclarations = [];
        context.variables?.forEach((variable) => {
          const cid = variable.id;
          variable.variants.forEach((variant) => {
            const vid = variant.id;
            importStatements.push(
              `import ${cid}${vid} from './_imports/_${cid}/_${cid}${vid}.js';`,
            );
            variantDeclarations.push(`rule.app.${cid}${vid} = ${cid}${vid};`);
          });
        });
        replaceText(
          `${contextPath}/context.js`,
          '__variantImports__',
          importStatements.join('\n'),
        );
        replaceText(`${contextPath}/context.js`, '__contextId__', context.id);
        replaceText(
          `${contextPath}/context.js`,
          '__variantDeclarations__',
          variantDeclarations.join('\n'),
        );
      },
    },
    {
      file: `${contextPath}/context.scss`,
      template: `${scriptTemplatePath}/context.scss`,
      postProcess: () => {
        const importStatements = [];
        context.variables?.forEach((variable) => {
          const cid = variable.id;
          importStatements.push(`@use '_imports/_${cid}/${cid}';`);
          variable.variants.forEach((variant) => {
            const vid = variant.id;
            importStatements.push(`@use '_imports/_${cid}/${cid}${vid}';`);
          });
        });
        replaceText(
          `${contextPath}/context.scss`,
          '__variantImports__',
          importStatements.join('\n'),
        );
      },
    },
  ];
}

function getImportFiles(importPath, contextId) {
  return [
    {
      file: `${importPath}/_setup.js`,
      template: `${scriptTemplatePath}/_setup.js`,
      postProcess: () =>
        replaceText(`${importPath}/_setup.js`, '__contextId__', contextId),
    },
    {
      file: `${importPath}/_instrument.js`,
      template: `${scriptTemplatePath}/_instrument.js`,
    },
    {
      file: `${importPath}/_utils.js`,
      template: `${scriptTemplatePath}/_utils.js`,
    },
    {
      file: `${importPath}/_utils.scss`,
      template: `${scriptTemplatePath}/_utils.scss`,
    },
  ];
}

function getVariableImportFiles(variableImportPath, contextId, variableId) {
  return [
    {
      file: `${variableImportPath}/_${variableId}.js`,
      template: `${scriptTemplatePath}/_variable-import.js`,
      postProcess: () =>
        replaceText(
          `${variableImportPath}/_${variableId}.js`,
          '__variableId__',
          variableId,
        ),
    },
    {
      file: `${variableImportPath}/_${variableId}.scss`,
      template: `${scriptTemplatePath}/_variable-import.scss`,
      postProcess: () => {
        replaceText(
          `${variableImportPath}/_${variableId}.scss`,
          '__contextId__',
          contextId,
        );
        replaceText(
          `${variableImportPath}/_${variableId}.scss`,
          '__variableId__',
          variableId,
        );
      },
    },
  ];
}

function getVariantFiles(variantPath, variantTag) {
  return [
    {
      file: `${variantPath}.js`,
      template: `${scriptTemplatePath}/variant.js`,
      postProcess: () =>
        replaceText(`${variantPath}.js`, '__variantTag__', variantTag),
    },
    {
      file: `${variantPath}.scss`,
      template: null,
    },
  ];
}

function getVariantImportFiles(
  variantImportPath,
  contextId,
  variableId,
  variantId,
) {
  return [
    {
      file: `${variantImportPath}.js`,
      template: `${scriptTemplatePath}/_variant-import.js`,
      postProcess: () => {
        replaceText(`${variantImportPath}.js`, '__variableId__', variableId);
        replaceText(`${variantImportPath}.js`, '__variantId__', variantId);
      },
    },
    {
      file: `${variantImportPath}.scss`,
      template: `${scriptTemplatePath}/_variant-import.scss`,
      postProcess: () => {
        replaceText(`${variantImportPath}.scss`, '__contextId__', contextId);
        replaceText(`${variantImportPath}.scss`, '__variableId__', variableId);
        replaceText(`${variantImportPath}.scss`, '__variantId__', variantId);
      },
    },
  ];
}

function makeFolder(folderPath) {
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
    fs.mkdirSync(folderPath);
  }
}

function makeFile(fileObj) {
  log('create', fileObj.file);
  if (!fs.existsSync(fileObj.file)) {
    if (fileObj.template) {
      fs.copyFileSync(fileObj.template, fileObj.file);
      if (fileObj.postProcess) {
        fileObj.postProcess();
      }
    } else {
      fs.closeSync(fs.openSync(fileObj.file, 'w'));
    }
  }
}

function makeImportFiles(contextPath, contextId) {
  const importPath = `${contextPath}/_imports`;
  makeFolder(importPath);
  getImportFiles(importPath, contextId).forEach(makeFile);
}

function makeContextFiles(contextPath, context) {
  makeFolder(contextPath);
  getContextFiles(contextPath, context).forEach(makeFile);
  makeImportFiles(contextPath, context.id);
}

function makeVariableFiles(variablePath) {
  makeFolder(variablePath);
}

function makeVariableImportFiles(variableImportPath, contextId, variableId) {
  makeFolder(variableImportPath);
  getVariableImportFiles(variableImportPath, contextId, variableId).forEach(
    makeFile,
  );
}

function makeVariantFiles(variantPath, variantTag) {
  getVariantFiles(variantPath, variantTag).forEach(makeFile);
}

function makeVariantImportFiles(
  variantImportPath,
  contextId,
  variableId,
  variantId,
) {
  getVariantImportFiles(
    variantImportPath,
    contextId,
    variableId,
    variantId,
  ).forEach(makeFile);
}

function getIds(config) {
  const ids = {};

  config.contexts.forEach((context) => {
    const contextPath = `${contextsPath}/${context.id}`;
    ids[context.id] = {};
    ids[context.id].exists = fs.existsSync(contextPath);
    if (context.variables) ids[context.id].variables = {};

    context.variables?.forEach((variable) => {
      const variablePath = `${contextPath}/${variable.id}`;
      ids[context.id].variables[variable.id] = {};
      ids[context.id].variables[variable.id].exists =
        fs.existsSync(variablePath);
      if (variable.variants)
        ids[context.id].variables[variable.id].variants = {};

      variable.variants?.forEach((variant) => {
        const variantPath = `${variablePath}/${variant.id}.js`;
        ids[context.id].variables[variable.id].variants[variant.id] = {};
        ids[context.id].variables[variable.id].variants[variant.id].exists =
          fs.existsSync(variantPath);
      });
    });
  });

  return ids;
}

function listIds(ids, exists) {
  Object.keys(ids).forEach((contextId) => {
    if (ids[contextId].exists === exists) log('context: ', contextId);
    if (!ids[contextId].variables) return;
    Object.keys(ids[contextId].variables)?.forEach((variableId) => {
      if (ids[contextId].variables[variableId].exists === exists)
        log('variable:', contextId, variableId);
      Object.keys(ids[contextId].variables[variableId].variants)?.forEach(
        (variantId) => {
          if (
            ids[contextId].variables[variableId].variants[variantId].exists ===
            exists
          )
            log('variant: ', contextId, `${variableId}${variantId}`);
        },
      );
    });
  });
}

function processIds(ids, callback) {
  const result = [];
  Object.keys(ids).forEach((contextId) => {
    const contextResult = callback(contextId, ids[contextId]);
    if (contextResult) result.push();
    if (!ids[contextId].variables) return;

    Object.keys(ids[contextId].variables)?.forEach((variableId) => {
      const variableResult = callback(
        variableId,
        ids[contextId].variables[variableId],
      );
      if (variableResult) result.push(variableResult);

      Object.keys(ids[contextId].variables[variableId].variants)?.forEach(
        (variantId) => {
          const variantResult = callback(
            variantId,
            ids[contextId].variables[variableId].variants[variantId],
          );

          if (variantResult) result.push(variantResult);
        },
      );
    });
  });
  return result;
}

function makeProject(config) {
  const ids = getIds(config);
  const existingIds = processIds(ids, (id, node) => (node.exists ? id : null));

  if (!existingIds.length) log('no project files were found');
  else log('files for the following project ids have been found:');
  listIds(ids, true);

  const newNodes = processIds(ids, (id, node) => (!node.exists ? id : null));
  if (!newNodes.length) {
    log();
    log('there are no new project files to create');
    return;
  }

  log();
  log('scaffold will create project files for the following:');
  listIds(ids, false);
  log();
  const result = prompt('would you like to proceed Y/n? ');
  if (result.toUpperCase() === 'N') return;

  makeFolder(contextsPath);

  log();
  config.contexts.forEach((context) => {
    const contextPath = `${contextsPath}/${context.id}`;

    if (!ids[context.id].exists) {
      log('make context files:', context.id);
      makeContextFiles(contextPath, context);
    }
    context.variables?.forEach((variable) => {
      const cid = variable.id;
      const variablePath = `${contextPath}/${cid}`;
      const variableImportPath = `${contextPath}/_imports/_${cid}`;
      if (!ids[context.id].variables[variable.id].exists) {
        log('make variable files:', context.id, variable.id);
        makeVariableFiles(variablePath);
        makeVariableImportFiles(variableImportPath, context.id, cid);
      }
      variable.variants?.forEach((variant) => {
        const vid = variant.id;
        const variantPath = `${variablePath}/${vid}`;
        const variantImportPath = `${variableImportPath}/_${cid}${vid}`;

        if (
          !ids[context.id].variables[variable.id].variants[variant.id].exists
        ) {
          log('make variant files:', context.id, `${variable.id}${variant.id}`);
          makeVariantFiles(variantPath, `${cid}${vid}`);
          makeVariantImportFiles(variantImportPath, context.id, cid, vid);
        }
      });
    });
  });
}

try {
  makeProject(evolvConfig);
} catch (e) {
  log('error:', e);
}
