'use strict';
const path = require('path');
const fs = require('fs');

module.exports = {
    devtool: 'inline-source-map',
    mode: 'development',
    entry: './src/public/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist/public'),
    },
    module: {
        rules: [
            {
                test: /\.ts|\.tsx$/,
                loader: 'ts-loader',
                exclude: fs
                    .readdirSync(path.resolve(__dirname, 'src/'), { withFileTypes: true })
                    .filter((dirent) => dirent.isFile())
                    .map((p) => path.resolve(__dirname, 'src', p.name)),
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
};
