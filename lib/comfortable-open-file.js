'use babel';

import ComfortableOpenFileModel from './comfortable-open-file-model';
import ComfortableOpenFileView from './comfortable-open-file-view';
import { resolveTilde, mkdirWithP } from './helpers';
import { CompositeDisposable } from 'atom';
import os from 'os';
import stdPath from 'path';

export default {
  model: null,
  view: null,
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
    this.view.setAddIconToElementService(service);
  },

  activate(state) {
    this.model = new ComfortableOpenFileModel();
    this.view = new ComfortableOpenFileView({
      filter: (paths, query) => this.filter(paths, query),
      order: (path1, path2) => this.order(path1, path2),
      didChangeQuery: (query) => this.didChangeQuery(query),
      didChangeSelection: (path) => this.didChangeSelection(path),
      didConfirmSelection: (path) => this.didConfirmSelection(path),
      didCancelSelection: () => this.didCancelSelection()
    });
    this.model.on('update', (state) => this.view.update(state));
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.view.element,
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
    this.view.destroy();
  },

  serialize() {
    return { viewState: this.view.serialize() };
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

  async attach() {
    if (this.modalPanel.isVisible()) return;
    const activeFileDirPath = this.getActiveFileDirPath();
    let initDirPath = '';
    if (activeFileDirPath) {
      initDirPath = activeFileDirPath;
    } else {
      initDirPath = resolveTilde(atom.config.get('comfortable-open-file.initialDirectoryPath'));
    }
    this.model.setBasePath(initDirPath);
    await this.model.moveDir(initDirPath);
    this.modalPanel.show();
    this.view.focus();
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

  async didConfirmSelection(path) {
    if (path.tag && path.tag === 'create-file') {
      await mkdirWithP(stdPath.dirname(this.model.getQuery()));
      atom.workspace.open(this.model.getQuery());
      this.detach();
    } else if (path.tag && path.tag === 'create-directory') {
      await mkdirWithP(this.model.getQuery());
      this.model.moveDir(this.model.getQuery());
    } else if (path.stats.isDirectory()) {
      this.model.moveDir(path.full);
    } else if (path.stats.isFile()) {
      atom.workspace.open(path.full);
      this.detach();
    }
  },

  didCancelSelection() {
    this.detach();
  },

  addProjectFolder() {
    const selectedPath = this.model.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stats.isDirectory()) return;
    if (!atom.project.getPaths().find((projectPath) => projectPath === selectedPath.full)) {
      atom.project.addPath(selectedPath.full);
    }
    this.detach();
  },

  removeProjectFolder() {
    const selectedPath = this.model.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stats.isDirectory()) return;
    if (atom.project.getPaths().find((projectPath) => projectPath === selectedPath.full)) {
      atom.project.removePath(selectedPath.full);
    }
    this.detach();
  },

  didChangeQuery(query) {
    this.model.setQuery(query);
  },

  didChangeSelection(path) {
    this.model.setSelectedPath(path);
  }
};
