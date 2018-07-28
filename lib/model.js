'use babel'

import { isDirectoryPath, isExists, readdir, stat, lstat } from './helpers'
import stdPath from 'path'
import fuzzaldrin from 'fuzzaldrin'

export function filter(items, query) {
  if (items.length === 0) return items
  const noErrorItems = items.filter((item) => !item.tag)
  if (isDirectoryPath(query)) return noErrorItems
  const queryBaseName = stdPath.basename(query)
  return fuzzaldrin.filter(noErrorItems, queryBaseName, { key: 'fragment' })
}

const prefixes = ['', '~', '.', '..'].map((v) => v + stdPath.sep)

export async function isValidPath(path) {
  if (prefixes.some((v) => path.startsWith(v))) return true
  if (path.endsWith(':')) return false
  const pathRoot = stdPath.parse(path).root
  if (pathRoot && await isExists(pathRoot)) return true
  return false
}

async function fetchItem(dirPath, fileName) {
  const full = stdPath.resolve(dirPath, fileName)
  try {
    const stats = await stat(full)
    const lstats = await lstat(full)
    return {
      full: full,
      fragment: fileName,
      stats: stats,
      lstats: lstats
    }
  } catch (e) {
    return {
      tag: 'error',
      full: full,
      fragment: fileName,
      error: e
    }
  }
}

export async function fetchItems(dirPath) {
  const items = []
  items.push(await fetchItem(dirPath, '..'))
  if (await isExists(dirPath)) {
    try {
      const fileNames = await readdir(dirPath)
      for (let fileName of fileNames) {
        items.push(await fetchItem(dirPath, fileName))
      }
    } catch (e) {
      return [items, e]
    }
  }
  return [items, null]
}

export async function tagItems(path) {
  const items = []
  if (!await isExists(path)) {
    if (isDirectoryPath(path)) {
      items.push({
        tag: 'create-directory',
        fragment: 'Create a directory'
      })
    } else {
      items.push({
        tag: 'create-file',
        fragment: 'Create a file'
      })
    }
  }
  return items
}
