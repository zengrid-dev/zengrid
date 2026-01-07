const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');

const packageJson = require('./package.json');

const production = !process.env.ROLLUP_WATCH;

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main.replace('./dist/', 'dist/'),
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: packageJson.module.replace('./dist/', 'dist/'),
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: [],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src',
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      sourceMap: true,
      compilerOptions: {
        outDir: './dist',
      },
    }),
    production && terser(),
  ],
};
