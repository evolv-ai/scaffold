import copy from 'rollup-plugin-copy';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import config from './evolv.config.js';

function buildServeFile(path) {
    var input = `./src/contexts/${path}`;
    var output = `./serve/${path}`;

    return {
        input: `${input}.js`,
        output: {
            file: `${output}.js`,
            format: 'iife',
        },
    };
}

function buildExportFile(path) {
    var input = `./src/contexts/${path}`;
    var output = `./export/.build/${path}`;

    return {
        input: `${input}.js`,
        output: { file: `${output}.js` },
    };
}

function extractFiles(config, buildFile) {
    var files = [];
    config.contexts.forEach((context) => {
        var contextPath = `${context.id}`;
        files.push(buildFile(`${contextPath}/context`));
        context.variables.forEach((concept) => {
            var conceptPath = `${contextPath}/${concept.id}`;
            concept.variants.forEach((variant) =>
                files.push(buildFile(`${conceptPath}/${variant.id}`))
            );
        });
    });

    return files;
}

var files = extractFiles(config, buildServeFile);
files.push(...extractFiles(config, buildExportFile));
files.push({
    input: `./src/local/catalyst-local.js`,
    output: {
        dir: `./serve`,
        format: 'iife',
    },
    plugins: [
        copy({
            targets: [{ src: './src/local/local-loader.js', dest: './serve' }],
        }),
        nodeResolve(),
    ],
});

// console.info('config', JSON.stringify(files));
export default files;
