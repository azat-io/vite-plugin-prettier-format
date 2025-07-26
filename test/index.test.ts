import type { ResolvedConfig } from 'vite'
import type { Dirent } from 'node:fs'

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import * as prettier from 'prettier'
import fs from 'node:fs/promises'
import path from 'node:path'

import { prettierFormat } from '../plugin'

vi.mock('node:fs/promises')
vi.mock('prettier')
vi.mock('node:path')

describe('vite-plugin-prettier-format', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    vi.mocked(path.resolve).mockImplementation(directory => directory)

    vi.mocked(path.join).mockImplementation((...arguments_) =>
      arguments_.join('/'),
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should set the plugin name correctly', () => {
    let plugin = prettierFormat()
    expect(plugin.name).toBe('vite-plugin-prettier-format')
  })

  it('should update outputDirectory when configResolved is called', async () => {
    let plugin = prettierFormat()
    let config = {
      build: {
        outDir: 'custom-dist',
      },
    } as ResolvedConfig

    let configResolvedHook = plugin.configResolved as unknown as (
      config: ResolvedConfig,
    ) => void

    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    configResolvedHook(config)

    vi.mocked(path.resolve).mockImplementationOnce(directory => {
      expect(directory).toBe('custom-dist')
      return directory
    })

    vi.mocked(fs.readdir).mockResolvedValueOnce([])

    await closeBundleHook()
  })

  it('should call console.warn if output directory is not specified', async () => {
    let plugin = prettierFormat()

    vi.mocked(path.resolve).mockReturnValueOnce('')

    let consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    await closeBundleHook()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Output directory or file is not specified in the bundle options.',
    )
  })

  it('should find and format files in output directory', async () => {
    let plugin = prettierFormat()

    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    let mockEntries = [
      {
        isDirectory: () => false,
        isFile: () => true,
        name: 'file1.js',
      },
      {
        isDirectory: () => true,
        isFile: () => false,
        name: 'subdir',
      },
    ] as Dirent[]

    let mockSubEntries = [
      {
        isDirectory: () => false,
        isFile: () => true,
        name: 'file2.js',
      },
    ] as Dirent[]

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockEntries as unknown as Dirent<Buffer>[])
      .mockResolvedValueOnce(mockSubEntries as unknown as Dirent<Buffer>[])

    vi.mocked(fs.readFile)
      .mockResolvedValueOnce('const a = 1;')
      .mockResolvedValueOnce('function test() { return 42; }')

    vi.mocked(prettier.resolveConfig).mockResolvedValue({ semi: false })

    vi.mocked(prettier.format).mockImplementation(
      content =>
        new Promise(resolve => {
          if (content === 'const a = 1;') {
            resolve('const a = 1')
          }
          if (content === 'function test() { return 42; }') {
            resolve('function test() {\n  return 42\n}')
          } else {
            resolve(content)
          }
        }),
    )

    let writeFileMock = vi.mocked(fs.writeFile).mockResolvedValue()

    await closeBundleHook()

    expect(writeFileMock).toHaveBeenCalledTimes(2)
    expect(writeFileMock).toHaveBeenCalledWith(
      'dist/file1.js',
      'const a = 1',
      'utf8',
    )
    expect(writeFileMock).toHaveBeenCalledWith(
      'dist/subdir/file2.js',
      'function test() {\n  return 42\n}',
      'utf8',
    )
  })

  it('should recursively process nested directories', async () => {
    let plugin = prettierFormat()

    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    let mockLevel1 = [
      {
        isDirectory: () => true,
        isFile: () => false,
        name: 'dir1',
      },
      {
        isDirectory: () => true,
        isFile: () => false,
        name: 'dir2',
      },
    ] as Dirent[]

    let mockLevel2Directory1 = [
      {
        isDirectory: () => false,
        isFile: () => true,
        name: 'file1.js',
      },
    ] as Dirent[]

    let mockLevel2Directory2 = [
      {
        isDirectory: () => true,
        isFile: () => false,
        name: 'dir3',
      },
    ] as Dirent[]

    let mockLevel3Directory3 = [
      {
        isDirectory: () => false,
        isFile: () => true,
        name: 'file2.js',
      },
    ] as Dirent[]

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockLevel1 as unknown as Dirent<Buffer>[])
      .mockResolvedValueOnce(
        mockLevel2Directory1 as unknown as Dirent<Buffer>[],
      )
      .mockResolvedValueOnce(
        mockLevel2Directory2 as unknown as Dirent<Buffer>[],
      )
      .mockResolvedValueOnce(
        mockLevel3Directory3 as unknown as Dirent<Buffer>[],
      )

    vi.mocked(fs.readFile).mockResolvedValue('dummy content')
    vi.mocked(prettier.resolveConfig).mockResolvedValue({})
    vi.mocked(prettier.format).mockImplementation(
      async content =>
        new Promise(resolve => {
          let formattedContent = `${content} (formatted)`
          resolve(formattedContent)
        }),
    )
    vi.mocked(fs.writeFile).mockResolvedValue()

    await closeBundleHook()

    expect(fs.readdir).toHaveBeenCalledTimes(4)

    expect(fs.writeFile).toHaveBeenCalledTimes(2)
    expect(fs.writeFile).toHaveBeenCalledWith(
      'dist/dir1/file1.js',
      'dummy content (formatted)',
      'utf8',
    )
    expect(fs.writeFile).toHaveBeenCalledWith(
      'dist/dir2/dir3/file2.js',
      'dummy content (formatted)',
      'utf8',
    )
  })

  it('should throw when file reading fails', async () => {
    let plugin = prettierFormat()
    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    vi.mocked(fs.readdir).mockResolvedValueOnce([
      {
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isDirectory: () => false,
        isSocket: () => false,
        isFIFO: () => false,
        isFile: () => true,
        name: 'bad.js',
      } as unknown as Dirent,
    ] as unknown as Dirent<Buffer>[])

    vi.mocked(fs.readFile).mockRejectedValueOnce(
      new Error('Failed to read file'),
    )

    vi.mocked(prettier.resolveConfig).mockResolvedValue({})

    await expect(closeBundleHook()).rejects.toThrow('Failed to read file')

    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('should handle special filesystem entries that are neither files nor directories', async () => {
    let plugin = prettierFormat()
    let closeBundleHook = plugin.closeBundle as unknown as () => Promise<void>

    vi.mocked(fs.readdir).mockResolvedValueOnce([
      {
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isDirectory: () => false,
        isSocket: () => false,
        name: 'special-entry',
        isFile: () => false,
        isFIFO: () => true,
      } as unknown as Dirent,
    ] as unknown as Dirent<Buffer>[])

    vi.mocked(path.resolve).mockReturnValueOnce('dist')

    await closeBundleHook()

    expect(fs.writeFile).not.toHaveBeenCalled()

    expect(fs.readFile).not.toHaveBeenCalled()
  })
})
