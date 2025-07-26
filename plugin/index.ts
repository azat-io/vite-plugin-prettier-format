import type { Plugin } from 'vite'

import { resolveConfig, format } from 'prettier'
import fs from 'node:fs/promises'
import path from 'node:path'

export function prettierFormat(): Plugin {
  let outputDirectory: string = 'dist'
  return {
    closeBundle: async () => {
      let resolvedOutputDirectory = path.resolve(outputDirectory)

      if (!resolvedOutputDirectory) {
        console.warn(
          'Output directory or file is not specified in the bundle options.',
        )
        return
      }

      let files = await getAllFiles(resolvedOutputDirectory)

      await Promise.all(
        files.map(async file => {
          let fileContent = await fs.readFile(file, 'utf8')
          let prettierConfig = await resolveConfig(file)
          let formattedContent = await format(fileContent, {
            ...prettierConfig,
            filepath: file,
          })
          await fs.writeFile(file, formattedContent, 'utf8')
        }),
      )
    },
    configResolved: config => {
      outputDirectory = config.build.outDir
    },
    name: 'vite-plugin-prettier-format',
  }
}

async function getAllFiles(directory: string): Promise<string[]> {
  let entries = await fs.readdir(directory, { withFileTypes: true })

  let childPathsPromises = entries.map(async entry => {
    let filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return getAllFiles(filePath)
    } else if (entry.isFile()) {
      return [filePath]
    }
    return []
  })

  let nestedPaths = await Promise.all(childPathsPromises)
  return nestedPaths.flat()
}
