/**
 * @file vite.config.js
 * @description Vite configuration file for staticcanvas javascript UMD build
 * @version v1.0
 */

import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import { resolve } from 'path';
import fs from 'fs';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const pkg_name_WNNS = pkg.name.split('/').pop();

const bannertext = `/**
  ${pkg_name_WNNS}
  ................................
  ${pkg.description}

  @Version v${pkg.version}
  @Author ${pkg.author.name}
  @License ${pkg.license}
  @Homepage ${pkg.homepage}

  @CompiledWith
      > Vite: v${pkg.extras.compliedBy.vite}
      > Date: ${new Date().toISOString()}

  @Repository
      > gitlab: ${pkg.author.gitlab}
      > github: ${pkg.author.github}
*/`;

export default defineConfig({
  build: {
    // Output to dist
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,

    // Target ES2015 (ES6) to ensure broad compatibility (closest to ES5 without bloating)
    target: ['es2015'],

    lib: {
      entry: resolve(__dirname, `src/${pkg_name_WNNS}.js`),
      name: pkg_name_WNNS,
      fileName: pkg_name_WNNS,
    },

    // We disable global minification to handle it per-file below
    minify: false,

    rollupOptions: {
      // Your 4-File Output Strategy
      output: [
        // 1. UMD Standard
        {
          format: 'umd',
          name: pkg_name_WNNS,
          dir: `dist/${pkg_name_WNNS}/dist`,
          entryFileNames: `${pkg_name_WNNS}.js`,
          // sourcemap: true, // unsupport with rullup directory using vite
          exports: 'named', // <--- Explicitly tell Rollup these are named exports
          plugins: [
            terser({
              compress: false,
              mangle: false,
              format: {
                beautify: true, // Keep indentation and newlines
                comments: true,
                preamble: bannertext,
              },
            }),
          ],
        },
        // 2. UMD Minified
        {
          format: 'umd',
          name: pkg_name_WNNS,
          dir: `dist/${pkg_name_WNNS}/dist`,
          entryFileNames: `${pkg_name_WNNS}.min.js`,
          // sourcemap: true, // unsupport with rullup directory using vite
          exports: 'named', // <--- Explicitly tell Rollup these are named exports
          plugins: [
            terser({
              compress: true,
              mangle: true,
              format: {
                // beautify: true,      // Keep indentation and newlines
                comments:
                  /@license|@author|@Compiled|@homepage|@github|@gitlab|@CompiledWith|> Vite:|> Date:/i,
                preamble: bannertext,
              },
            }),
          ],
        },
        // 3. ESM Standard
        {
          format: 'es',
          dir: `dist/${pkg_name_WNNS}/dist`,
          entryFileNames: `${pkg_name_WNNS}.esm.js`,
          // sourcemap: true, // unsupport with rullup directory using vite
          plugins: [
            terser({
              compress: false,
              mangle: false,
              format: {
                beautify: true, // Keep indentation and newlines
                comments: true,
                preamble: bannertext,
              },
            }),
          ],
        },
        // 4. ESM Minified
        {
          format: 'es',
          dir: `dist/${pkg_name_WNNS}/dist`,
          entryFileNames: `${pkg_name_WNNS}.esm.min.js`,
          // sourcemap: true, // unsupport with rullup directory using vite
          plugins: [
            terser({
              compress: true,
              mangle: true,
              format: {
                // beautify: true,      // Keep indentation and newlines
                comments:
                  /@license|@author|@Compiled|@homepage|@github|@gitlab|@CompiledWith|> Vite:|> Date:/i,
                preamble: bannertext,
              },
            }),
          ],
        },
      ],
    },
  },
  plugins: [
    copy({
      // This is so we can copy files to dist and publish from
      // dist with custom readme etc
      targets: [
        // Handle README: Rename README-npm.md to README.md in dist
        { src: 'README-npm.md', dest: `dist/${pkg_name_WNNS}`, rename: 'README.md' },

        // Handle License
        { src: 'LICENSE', dest: `dist/${pkg_name_WNNS}` },

        // MAGIC STEP: Copy & Patch package.json
        {
          src: 'package.json',
          dest: `dist/${pkg_name_WNNS}`,
          transform: (contents) => {
            const json = JSON.parse(contents.toString());

            // Clean up dev noise
            delete json.scripts;
            delete json.devDependencies;
            delete json.files; // No longer needed as we are inside the folder

            return JSON.stringify(json, null, 2);
          },
        },
        // copy source files to dist
        { src: 'src', dest: `dist/${pkg_name_WNNS}` },
        // copy package-lock.json to dist for npm ci installs
        { src: 'package-lock.json', dest: `dist/${pkg_name_WNNS}` },
        // copy jsr.jsonc to dist for jsr publishing
        { src: 'jsr.jsonc', dest: `dist/${pkg_name_WNNS}` },
      ],
      hook: 'writeBundle', // Run after build finishes
    }),
  ],
});
