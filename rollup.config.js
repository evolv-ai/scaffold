import copy from 'rollup-plugin-copy';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import evolvConfig from './evolv.config.js';

function buildServeFile(path) {
  const input = `./src/contexts/${path}`;
  const output = `./serve/${path}`;

  return {
    input: `${input}.js`,
    output: {
      file: `${output}.js`,
      format: 'iife',
    },
  };
}

function buildExportFile(path) {
  const input = `./src/contexts/${path}`;
  const output = `./export/.build/${path}`;

  return {
    input: `${input}.js`,
    output: { file: `${output}.js` },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
      terser(),
    ],
  };
}

function extractFiles(config, buildFile) {
  const files = [];
  config.contexts.forEach((context) => {
    const contextPath = `${context.id}`;
    files.push(buildFile(`${contextPath}/context`));

    if (!context.variables) return;

    context.variables.forEach((concept) => {
      const conceptPath = `${contextPath}/${concept.id}`;
      concept.variants.forEach((variant) =>
        files.push(buildFile(`${conceptPath}/${variant.id}`)),
      );
    });
  });

  return files;
}

const files = extractFiles(evolvConfig, buildServeFile);
files.push(...extractFiles(evolvConfig, buildExportFile));
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

export default files;
