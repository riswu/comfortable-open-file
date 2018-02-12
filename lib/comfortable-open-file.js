'use babel';

import ComfortableOpenFileView from './comfortable-open-file-view';
import { CompositeDisposable } from 'atom';
import os from 'os';
import fs from 'fs';
import mkdirp from 'mkdirp';
import stdPath from 'path';
import fuzzaldrin from 'fuzzaldrin';

function resolveTilde(somePath) {
  if (somePath.startsWith('~' + stdPath.sep)) return stdPath.join(os.homedir(), somePath.slice(1));
  return somePath;
}

function isDirPath(somePath) {
  return somePath.endsWith(stdPath.sep);
}

function isExists(somePath) {
  try {
    fs.accessSync(somePath);
    return true;
  } catch (e) {
    return false;
  }
}

class ComfortableOpenFileModel {
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
    if (isDirPath(query)) return paths.filter((path) => {
      if (!path.tag) return true;
      if (paths.length === 2 && path.tag === 'create-directory') return true;
      return false;
    });
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
    if (path1.stat.isDirectory() && !path2.stat.isDirectory()) return -1;
    if (!path1.stat.isDirectory() && path2.stat.isDirectory()) return 1;
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

  getQuery() {
    return this.state.query;
  }

  update(state) {
    this.state = state;
    if (this.observer) this.observer.update(state);
  }

  static fetchPaths(dirPath) {
    let fetchedPaths = [];
    if (isExists(dirPath)) {
      const fileNames = ['..'].concat(fs.readdirSync(dirPath));
      fetchedPaths = fileNames.map((fileName) => {
        const full = stdPath.resolve(dirPath, fileName);
        try {
          const stat = fs.statSync(full);
          const lstat = fs.lstatSync(full);
          return {
            full: full,
            fragment: fileName,
            stat: stat,
            lstat: lstat
          };
        } catch (e) {
          return {
            full: full,
            fragment: fileName,
            tag: 'error'
          };
        }
      });
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

  static isValidPath(somePath) {
    if (['', '~', '.', '..'].reduce((acc, v) => acc || somePath.startsWith(v + stdPath.sep), false)) return true;
    const somePathRoot = stdPath.parse(somePath).root;
    if (somePathRoot && isExists(somePathRoot)) return true;
    return false;
  }

  setQuery(query) {
    if (this.state.query === query) return;

    if (!ComfortableOpenFileModel.isValidPath(query)) {
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
        const fetchedPaths = ComfortableOpenFileModel.fetchPaths(queryDirPath);
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

  moveDir(dirPath) {
    let resolvedPath = stdPath.resolve(resolveTilde(this.basePath), resolveTilde(dirPath));
    resolvedPath = isDirPath(resolvedPath) ? resolvedPath : resolvedPath + stdPath.sep;
    try {
      const fetchedPaths = ComfortableOpenFileModel.fetchPaths(resolvedPath);
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

export default {
  comfortableOpenFileModel: null,
  comfortableOpenFileView: null,
  modalPanel: null,
  subscriptions: null,

  config: {
    initialDirectoryPath: {
      title: 'Initial Directory Path',
      description: 'If you have already opened a file, you can get the file list of the directory.',
      type: 'string',
      default: os.homedir()
    }
  },

  consumeElementIcons(service) {
    this.comfortableOpenFileView.setAddIconToElementService(service);
  },

  activate(state) {
    this.comfortableOpenFileModel = new ComfortableOpenFileModel();
    this.comfortableOpenFileView = new ComfortableOpenFileView({
      filter: (paths, query) => this.filter(paths, query),
      order: (path1, path2) => this.order(path1, path2),
      didChangeQuery: (query) => this.didChangeQuery(query),
      didChangeSelection: (path) => this.didChangeSelection(path),
      didConfirmSelection: (path) => this.didConfirmSelection(path),
      didCancelSelection: () => this.didCancelSelection()
    });
    this.comfortableOpenFileModel.setObserver(this.comfortableOpenFileView);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.comfortableOpenFileView.element,
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'comfortable-open-file:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.commands.add('.comfortable-open-file', {
      'comfortable-open-file:add-project-folder': () => this.addProjectFolder(),
      'comfortable-open-file:remove-project-folder': () => this.removeProjectFolder()
    }));
  },

  async deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.comfortableOpenFileView.destroy();
  },

  serialize() {
    return { comfortableOpenFileViewState: this.comfortableOpenFileView.serialize() };
  },

  getActiveFileDirPath() {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor && editor.getPath()) return stdPath.dirname(editor.getPath());
    return null;
  },

  toggle() {
    if (this.modalPanel.isVisible()) {
      this.detach();
    } else {
      this.attach();
    }
  },

  attach() {
    if (this.modalPanel.isVisible()) return;
    const activeFileDirPath = this.getActiveFileDirPath();
    let initDirPath = '';
    if (activeFileDirPath) {
      initDirPath = activeFileDirPath;
    } else {
      initDirPath = resolveTilde(atom.config.get('comfortable-open-file.initialDirectoryPath'));
    }
    this.comfortableOpenFileModel.setBasePath(initDirPath);
    this.comfortableOpenFileModel.moveDir(initDirPath);
    this.modalPanel.show();
    this.comfortableOpenFileView.focus();
  },

  detach() {
    if (!this.modalPanel.isVisible()) return;
    atom.workspace.getActivePane().activate();
    this.modalPanel.hide();
  },

  filter(paths, query) {
    return ComfortableOpenFileModel.filter(paths, query);
  },

  order(path1, path2) {
    return ComfortableOpenFileModel.order(path1, path2);
  },

  didConfirmSelection(path) {
    if (path.tag && path.tag === 'create-file') {
      mkdirp.sync(stdPath.dirname(this.comfortableOpenFileModel.getQuery()));
      atom.workspace.open(this.comfortableOpenFileModel.getQuery());
      this.detach();
    } else if (path.tag && path.tag === 'create-directory') {
      mkdirp.sync(this.comfortableOpenFileModel.getQuery());
      this.comfortableOpenFileModel.moveDir(this.comfortableOpenFileModel.getQuery());
    } else if (path.stat.isDirectory()) {
      this.comfortableOpenFileModel.moveDir(path.full);
    } else if (path.stat.isFile()) {
      atom.workspace.open(path.full);
      this.detach();
    }
  },

  didCancelSelection() {
    this.detach();
  },

  addProjectFolder() {
    const selectedPath = this.comfortableOpenFileModel.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stat.isDirectory()) return;
    if (!atom.project.getPaths().find((projectPath) => projectPath === selectedPath.full)) {
      atom.project.addPath(selectedPath.full);
    }
    this.detach();
  },

  removeProjectFolder() {
    const selectedPath = this.comfortableOpenFileModel.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stat.isDirectory()) return;
    if (atom.project.getPaths().find((projectPath) => projectPath === selectedPath.full)) {
      atom.project.removePath(selectedPath.full);
    }
    this.detach();
  },

  didChangeQuery(query) {
    this.comfortableOpenFileModel.setQuery(query);
  },

  didChangeSelection(path) {
    this.comfortableOpenFileModel.setSelectedPath(path);
  }
};
