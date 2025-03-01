# Vite Plugin Prettier Format

<img
  src="https://raw.githubusercontent.com/azat-io/vite-plugin-prettier-format/main/assets/logo.svg"
  alt="ESLint Plugin De Morgan logo"
  align="right"
  height="160"
  width="160"
/>

[![Version](https://img.shields.io/npm/v/vite-plugin-prettier-format.svg?color=ffc820&labelColor=906dfe)](https://npmjs.com/package/vite-plugin-prettier-format)
[![Code Coverage](https://img.shields.io/codecov/c/github/azat-io/vite-plugin-prettier-format.svg?color=ffc820&labelColor=906dfe)](https://npmjs.com/package/vite-plugin-prettier-format)
[![GitHub License](https://img.shields.io/badge/license-MIT-232428.svg?color=ffc820&labelColor=906dfe)](https://github.com/azat-io/vite-plugin-prettier-format/blob/main/license.md)

A Vite plugin that formats output files with Prettier after bundle generation.

This plugin is particularly useful when you're building a library with Vite in library mode.

With this plugin, you can ensure that all your library's distribution files maintain consistent and clean formatting according to your Prettier standards.

## How It Works

This plugin hooks into Vite's build process and executes at the closeBundle phase (after bundle generation). It will:

1. Find all files in the output directory (specified by build.outDir in your Vite config).
2. Read each file's content.
3. Format the content using Prettier with your existing configuration.
4. Write the formatted content back to the file.

## Installation

You'll first need to install [Vite](https://vitejs.dev) and [Prettier](https://prettier.io):

```bash
npm install --save-dev vite prettier
```

Then install `vite-plugin-prettier-format`:

```bash
npm install --save-dev vite-plugin-prettier-format
```

## Usage

Add `vite-plugin-prettier-format` to your Vite config file:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import prettierFormat from 'vite-plugin-prettier-format'

export default defineConfig({
  plugins: [prettierFormat()],
})
```

## Configuration

The plugin uses your project's Prettier configuration automatically. It attempts to resolve the Prettier config for each file using Prettier's built-in resolveConfig function.

Make sure you have a Prettier configuration file in your project (e.g., `.prettierrc`, `.prettierrc.js`, etc.).

## License

MIT &copy; [Azat S.](https://azat.io)
