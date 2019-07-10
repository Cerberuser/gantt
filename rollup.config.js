import less from 'rollup-plugin-less';
import { uglify } from 'rollup-plugin-uglify';
import merge from 'deepmerge';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const dev = {
    input: 'src/index.ts',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.js',
        format: 'iife',
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            tsconfigOverride: { compilerOptions: { rootDir: 'src' }, exclude: ['**/*.test.ts'] }
        }),
        less({
            output: 'dist/gantt.css'
        })
    ]
};
const prod = merge(dev, {
    output: {
        file: 'dist/gantt.min.js'
    },
    plugins: [uglify()]
});

const es6 = merge(dev, {
    output: {
        file: 'dist/gantt-es6.js',
        format: 'esm'
    }
});

export default [dev, prod, es6];
