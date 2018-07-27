'use babel'

import os from 'os'
import fs from 'fs'
import stdPath from 'path'
import mkdirp from 'mkdirp'

export function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}

export function resolveTilde(path) {
  if (path.startsWith('~' + stdPath.sep)) {
    return stdPath.join(os.homedir(), path.slice(1))
  } else {
    return path    
  }
}

export function isDirectoryPath(path) {
  return path.endsWith(stdPath.sep)
}

export function isExists(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, (error) => resolve(!error))
  })
}

export function readdir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (error, fileNames) => {
      if (error) reject(error)
      resolve(fileNames)
    })
  })
}

export function stat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (error, stats) => {
      if (error) reject(error)
      resolve(stats)
    })
  })
}

export function lstat(filePath) {
  return new Promise((resolve, reject) => {
    fs.lstat(filePath, (error, stats) => {
      if (error) reject(error)
      resolve(stats)
    })
  })
}

export function mkdirWithP(dirPath) {
  return new Promise((resolve, reject) => {
    mkdirp(dirPath, (error, made) => {
      if (error) reject(error)
      resolve()
    })
  })
}
