'use babel';

import os from 'os';
import fs from 'fs';
import stdPath from 'path';
import mkdirp from 'mkdirp';

export function resolveTilde(somePath) {
  if (somePath.startsWith('~' + stdPath.sep)) return stdPath.join(os.homedir(), somePath.slice(1));
  return somePath;
}

export function isDirPath(somePath) {
  return somePath.endsWith(stdPath.sep);
}

export function isExists(somePath) {
  return new Promise((resolve, reject) => {
    fs.access(somePath, (error) => resolve(!error));
  });
}

export function readDir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (error, fileNames) => {
      if (error) reject(error);
      resolve(fileNames);
    });
  });
}

export function stat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (error, stats) => {
      if (error) reject(error);
      resolve(stats);
    });
  });
}

export function lstat(filePath) {
  return new Promise((resolve, reject) => {
    fs.lstat(filePath, (error, stats) => {
      if (error) reject(error);
      resolve(stats);
    });
  });
}

export function mkdirWithP(dirPath) {
  return new Promise((resolve, reject) => {
    mkdirp(dirPath, (error, made) => {
      if (error) reject(error);
      resolve();
    });
  });
}
