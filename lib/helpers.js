'use babel';

import os from 'os';
import fs from 'fs';
import stdPath from 'path';

export function resolveTilde(somePath) {
  if (somePath.startsWith('~' + stdPath.sep)) return stdPath.join(os.homedir(), somePath.slice(1));
  return somePath;
}

export function isDirPath(somePath) {
  return somePath.endsWith(stdPath.sep);
}

export function isExists(somePath) {
  try {
    fs.accessSync(somePath);
    return true;
  } catch (e) {
    return false;
  }
}
