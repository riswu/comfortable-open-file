'use babel'

import { isDirectoryPath, isExists, readdir, stat, lstat } from './helpers'
import stdPath from 'path'
import fuzzaldrin from 'fuzzaldrin'

export function filter(items, query) {
  if (items.length === 0) return items
  if (isDirectoryPath(query)) {
    return items.filter((item) => {
      if (!item.tag) return true
      if (items.length === 2 && item.tag === 'create-directory') return true
      return false
    })
  }
  const queryBaseName = stdPath.basename(query)
  const createFileTagItem = items.find((item) => item.tag && item.tag === 'create-file')
  const noTagItems = items.filter((item) => !item.tag)
  const filteredItems = fuzzaldrin.filter(noTagItems, queryBaseName, { key: 'fragment' })
  const equalItem = filteredItems.find((item) => item.fragment === queryBaseName)
  if (!equalItem) filteredItems.push(createFileTagItem)
  return filteredItems
}

export async function isValidPath(path) {
  if (['', '~', '.', '..'].some((v) => path.startsWith(v + stdPath.sep))) return true
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
      full: full,
      fragment: fileName,
      tag: 'error'
    }
  }
}

export async function fetchItems(dirPath) {
  const fetchedItems = []
  if (await isExists(dirPath)) {
    const fileNames = ['..'].concat(await readdir(dirPath))
    for (let fileName of fileNames) {
      fetchedItems.push(await fetchItem(dirPath, fileName))
    }
  }
  fetchedItems.push({
    fragment: 'Create a file',
    tag: 'create-file'
  })
  fetchedItems.push({
    fragment: 'Create a directory',
    tag: 'create-directory'
  })
  return fetchedItems
}
