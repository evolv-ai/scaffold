import fs from 'fs';
import config from '../evolv.config.js';

const contextsPath = `./src/contexts`;
const scriptTemplatePath = `./scripts/templates`;

function log() {
    console.info('[init:project]', ...arguments);
}

try {
    makeProject(config);
    // log('project created');
} catch (e) {
    log('error:', e);
}

//support functions
function absolutePath(path) {
    return path;
}

function loadConfig(configPath) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function isEmpty(directory) {
    const files = fs.readdirSync(directory);
    if (files && !files.length) return true;
    else {
        return false;
    }
}

function makeProject(config) {
    if (fs.existsSync(contextsPath) && !isEmpty(contextsPath))
        throw new Error(`directory '${contextsPath}' has contents`);

    makeFolder(contextsPath);
    config.contexts.forEach((context) => {
        const contextPath = `${contextsPath}/${context.id}`;
        makeContextFiles(contextPath, context);
        context.variables.forEach((variable) => {
            const cid = variable.id;
            const variablePath = `${contextPath}/${cid}`;
            const variableImportPath = `${contextPath}/_imports/_${cid}`;
            makeVariableFiles(variablePath);
            makeVariableImportFiles(variableImportPath, context.id, cid);
            variable.variants.forEach((variant) => {
                const vid = variant.id;
                const variantPath = `${variablePath}/${vid}`;
                const variantImportPath = `${variableImportPath}/_${vid}`;
                makeVariantFiles(variantPath, `${cid}${vid}`);
                makeVariantImportFiles(variantImportPath, context.id, cid, vid);
            });
        });
    });
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
                context.variables.forEach((variable) => {
                    const cid = variable.id;
                    variable.variants.forEach((variant) => {
                        const vid = variant.id;
                        importStatements.push(
                            `import ${cid}${vid} from './_imports/_${cid}/_${vid}';`
                        );
                        variantDeclarations.push(
                            `rule.app.${cid}${vid} = ${cid}${vid};`
                        );
                    });
                });
                replaceText(
                    `${contextPath}/context.js`,
                    '__variantImports__',
                    importStatements.join('\n')
                );
                replaceText(
                    `${contextPath}/context.js`,
                    '__contextId__',
                    context.id
                );
                replaceText(
                    `${contextPath}/context.js`,
                    '__variantDeclarations__',
                    variantDeclarations.join('\n')
                );
            },
        },
        {
            file: `${contextPath}/context.scss`,
            template: `${scriptTemplatePath}/context.scss`,
            postProcess: () => {
                const importStatements = [];
                // const variantDeclarations = [];
                context.variables.forEach((variable) => {
                    const cid = variable.id;
                    variable.variants.forEach((variant) => {
                        const vid = variant.id;
                        importStatements.push(
                            `@use '_imports/_${cid}/${vid}' as ${cid}${vid};`
                        );
                        // variantDeclarations.push(
                        //     `body.evolv-${context.id}-${cid}${vid} {\n` +
                        //         `    @extend %${cid};\n` +
                        //         `    @import '_imports/_${cid}/${vid} as ${cid}${vid}';\n` +
                        //         '}\n'
                        // );
                    });
                });
                replaceText(
                    `${contextPath}/context.scss`,
                    '__variantImports__',
                    importStatements.join('\n')
                );
                // replaceText(
                //     `${contextPath}/context.scss`,
                //     '__variantDeclarations__',
                //     variantDeclarations.join('\n')
                // );
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
                replaceText(
                    `${importPath}/_setup.js`,
                    '__contextId__',
                    contextId
                ),
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

function getVariableFiles(variablePath) {
    return [];
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
                    variableId
                ),
        },
        {
            file: `${variableImportPath}/_${variableId}.scss`,
            template: `${scriptTemplatePath}/_variable-import.scss`,
            postProcess: () =>
                replaceText(
                    `${variableImportPath}/_${variableId}.scss`,
                    '__variableId__',
                    variableId
                ),
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
    variantId
) {
    return [
        {
            file: `${variantImportPath}.js`,
            template: `${scriptTemplatePath}/_variant-import.js`,
            postProcess: () => {
                replaceText(
                    `${variantImportPath}.js`,
                    '__variableId__',
                    variableId
                );
                replaceText(
                    `${variantImportPath}.js`,
                    '__variantId__',
                    variantId
                );
            },
        },
        {
            file: `${variantImportPath}.scss`,
            template: `${scriptTemplatePath}/_variant-import.scss`,
            postProcess: () => {
                replaceText(
                    `${variantImportPath}.scss`,
                    '__contextId__',
                    contextId
                );
                replaceText(
                    `${variantImportPath}.scss`,
                    '__variableId__',
                    variableId
                );
                replaceText(
                    `${variantImportPath}.scss`,
                    '__variantId__',
                    variantId
                );
            },
        },
    ];
}

function makeFolder(folderPath) {
    // log('make folder', folderPath);
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
    getVariableFiles(variablePath).forEach(makeFile);
}

function makeVariableImportFiles(variableImportPath, contextId, variableId) {
    makeFolder(variableImportPath);
    getVariableImportFiles(variableImportPath, contextId, variableId).forEach(
        makeFile
    );
}

function makeVariantFiles(variantPath, variantTag) {
    getVariantFiles(variantPath, variantTag).forEach(makeFile);
}

function makeVariantImportFiles(
    variantImportPath,
    contextId,
    variableId,
    variantId
) {
    getVariantImportFiles(
        variantImportPath,
        contextId,
        variableId,
        variantId
    ).forEach(makeFile);
}
