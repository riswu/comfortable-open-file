'use babel';

import { resolveTilde, isDirPath, isExists, readDir, stat, lstat } from './helpers';
import stdPath from 'path';
import fuzzaldrin from 'fuzzaldrin';

export default class ComfortableOpenFileModel {
  constructor() {
    this.observer = null;
    this.basePath = '';
    this.state = {
      query: '',
      paths: [],
      selected: null,
      error: null
    };
  }

  static filter(paths, query) {
    if (paths.length === 0) return paths;
    if (isDirPath(query)) {
      return paths.filter((path) => {
        if (!path.tag) return true;
        if (paths.length === 2 && path.tag === 'create-directory') return true;
        return false;
      });
    }
    const queryBaseName = stdPath.basename(query);
    const createFileTagPath = paths.find((path) => path.tag && path.tag === 'create-file');
    const noTagPaths = paths.filter((path) => !path.tag);
    const filteredPaths = fuzzaldrin.filter(noTagPaths, queryBaseName, { key: 'fragment' });
    const equalPath = filteredPaths.find((path) => path.fragment === queryBaseName);
    if (!equalPath) filteredPaths.push(createFileTagPath);
    return filteredPaths;
  }

  static order(path1, path2) {
    if (path1.tag) return 1;
    if (path2.tag) return -1;
    if (path1.stats.isDirectory() && !path2.stats.isDirectory()) return -1;
    if (!path1.stats.isDirectory() && path2.stats.isDirectory()) return 1;
    if (path1.fragment < path2.fragment) return -1;
    if (path1.fragment > path2.fragment) return 1;
    return 0;
  }

  setObserver(observer) {
    if (!observer) return;
    this.observer = observer;
    this.observer.update(this.state);
  }

  setBasePath(basePath) {
    this.basePath = basePath;
  }

  update(state) {
    this.state = state;
    if (this.observer) this.observer.update(state);
  }

  static async fetchPath(dirPath, fileName) {
    const full = stdPath.resolve(dirPath, fileName);
    try {
      const stats = await stat(full);
      const lstats = await lstat(full);
      return {
        full: full,
        fragment: fileName,
        stats: stats,
        lstats: lstats
      };
    } catch (e) {
      return {
        full: full,
        fragment: fileName,
        tag: 'error'
      };
    }
  }

  static async fetchPaths(dirPath) {
    const fetchedPaths = [];
    if (await isExists(dirPath)) {
      const fileNames = ['..'].concat(await readDir(dirPath));
      for (let fileName of fileNames) {
        fetchedPaths.push(await ComfortableOpenFileModel.fetchPath(dirPath, fileName));
      }
    }
    fetchedPaths.push({
      fragment: 'Create a file',
      tag: 'create-file'
    });
    fetchedPaths.push({
      fragment: 'Create a directory',
      tag: 'create-directory'
    });
    return fetchedPaths;
  }

  static async isValidPath(somePath) {
    if (['', '~', '.', '..'].reduce((acc, v) => acc || somePath.startsWith(v + stdPath.sep), false)) return true;
    const somePathRoot = stdPath.parse(somePath).root;
    if (somePathRoot && await isExists(somePathRoot)) return true;
    return false;
  }

  async setQuery(query) {
    if (this.state.query === query) return;

    if (!await ComfortableOpenFileModel.isValidPath(query)) {
      this.update({
        query: query,
        paths: [],
        selected: null,
        error: null
      });
      return;
    }

    if (isDirPath(query)) {
      this.moveDir(query);
      return;
    }

    let resolvedPath;
    if (query.endsWith(stdPath.sep + '.')) {
      resolvedPath = stdPath.resolve(resolveTilde(this.basePath), resolveTilde(query));
      resolvedPath = isDirPath(resolvedPath) ? resolvedPath + '.' : resolvedPath + stdPath.sep + '.';
    } else if (query.endsWith(stdPath.sep + '..')) {
      resolvedPath = stdPath.resolve(resolveTilde(this.basePath), resolveTilde(query.slice(0, -1)));
      resolvedPath = isDirPath(resolvedPath) ? resolvedPath + '..' : resolvedPath + stdPath.sep + '..';
    } else {
      resolvedPath = stdPath.resolve(resolveTilde(this.basePath), resolveTilde(query));
    }
    let preQueryDirPath = isDirPath(this.state.query) ? this.state.query : stdPath.dirname(this.state.query);
    preQueryDirPath = isDirPath(preQueryDirPath) ? preQueryDirPath : preQueryDirPath + stdPath.sep;
    let queryDirPath = isDirPath(resolvedPath) ? resolvedPath : stdPath.dirname(resolvedPath);
    queryDirPath = isDirPath(queryDirPath) ? queryDirPath : queryDirPath + stdPath.sep;
    if (preQueryDirPath !== queryDirPath) {
      try {
        const fetchedPaths = await ComfortableOpenFileModel.fetchPaths(queryDirPath);
        this.update({
          query: resolvedPath,
          paths: fetchedPaths,
          selected: null,
          error: null
        });
      } catch (e) {
        this.update({
          query: resolvedPath,
          paths: [],
          selected: null,
          error: e
        });
      }
    } else {
      this.update({
        query: resolvedPath,
        paths: this.state.paths,
        selected: this.state.selected,
        error: this.state.error
      });
    }
  }

  getQuery() {
    return this.state.query;
  }

  setSelectedPath(selectedPath) {
    this.update({
      query: this.state.query,
      paths: this.state.paths,
      selected: selectedPath,
      error: this.state.error
    });
  }

  getSelectedPath() {
    return this.state.selected;
  }

  async moveDir(dirPath) {
    let resolvedPath = stdPath.resolve(resolveTilde(this.basePath), resolveTilde(dirPath));
    resolvedPath = isDirPath(resolvedPath) ? resolvedPath : resolvedPath + stdPath.sep;
    try {
      const fetchedPaths = await ComfortableOpenFileModel.fetchPaths(resolvedPath);
      this.update({
        query: resolvedPath,
        paths: fetchedPaths,
        selected: null,
        error: null
      });
    } catch (e) {
      this.update({
        query: resolvedPath,
        paths: [],
        selected: null,
        error: e
      });
    }
  }
}
