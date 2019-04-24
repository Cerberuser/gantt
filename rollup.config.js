import less from 'rollup-plugin-less';
import { uglify } from 'rollup-plugin-uglify';
import merge from 'deepmerge';
import typescript from 'rollup-plugin-typescript2';

const dev = {
    input: 'src/index.ts',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.js',
        format: 'iife'
    },
    plugins: [
        typescript(),
        less({
            output: 'dist/gantt.css'
        })
    ]
};
const prod = merge(dev, {
    output: {
        file: 'dist/gantt.min.js'
    },
    plugins: [typescript(), uglify()]
});

export default [dev, prod];
