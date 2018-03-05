'use babel';

import ComfortableOpenFileModel from './comfortable-open-file-model';
import ComfortableOpenFileView from './comfortable-open-file-view';
import { resolveTilde, mkdirWithP } from './helpers';
import { CompositeDisposable } from 'atom';
import os from 'os';
import stdPath from 'path';

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

  async attach() {
    if (this.modalPanel.isVisible()) return;
    const activeFileDirPath = this.getActiveFileDirPath();
    let initDirPath = '';
    if (activeFileDirPath) {
      initDirPath = activeFileDirPath;
    } else {
      initDirPath = resolveTilde(atom.config.get('comfortable-open-file.initialDirectoryPath'));
    }
    this.comfortableOpenFileModel.setBasePath(initDirPath);
    await this.comfortableOpenFileModel.moveDir(initDirPath);
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

  async didConfirmSelection(path) {
    if (path.tag && path.tag === 'create-file') {
      await mkdirWithP(stdPath.dirname(this.comfortableOpenFileModel.getQuery()));
      atom.workspace.open(this.comfortableOpenFileModel.getQuery());
      this.detach();
    } else if (path.tag && path.tag === 'create-directory') {
      await mkdirWithP(this.comfortableOpenFileModel.getQuery());
      this.comfortableOpenFileModel.moveDir(this.comfortableOpenFileModel.getQuery());
    } else if (path.stats.isDirectory()) {
      this.comfortableOpenFileModel.moveDir(path.full);
    } else if (path.stats.isFile()) {
      atom.workspace.open(path.full);
      this.detach();
    }
  },

  didCancelSelection() {
    this.detach();
  },

  addProjectFolder() {
    const selectedPath = this.comfortableOpenFileModel.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stats.isDirectory()) return;
    if (!atom.project.getPaths().find((projectPath) => projectPath === selectedPath.full)) {
      atom.project.addPath(selectedPath.full);
    }
    this.detach();
  },

  removeProjectFolder() {
    const selectedPath = this.comfortableOpenFileModel.getSelectedPath();
    if (!selectedPath || selectedPath.tag || !selectedPath.stats.isDirectory()) return;
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
