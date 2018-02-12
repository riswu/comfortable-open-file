'use babel';

import SelectListView from 'atom-select-list';
import { Directory } from 'atom';
import fsPlus from 'fs-plus';
import stdPath from 'path';

export default class ComfortableOpenFileView {
  constructor(props) {
    this.query = '';
    this.paths = [];
    this.selectListView = new SelectListView({
      query: this.query,
      items: this.paths,
      emptyMessage: 'No matches found',
      elementForItem: (path, options) => this.createListItemElement(path, options),
      filter: (paths, query) => props.filter(paths, query),
      order: (path1, path2) => props.order(path1, path2),
      didChangeQuery: (query) => {
        this.query = query;
        props.didChangeQuery(query);
      },
      didChangeSelection: (path) => props.didChangeSelection(path),
      didConfirmSelection: (path) => props.didConfirmSelection(path),
      didCancelSelection: () => props.didCancelSelection()
    });
    this.selectListView.element.classList.add('comfortable-open-file');
    this.addIconToElementService = null;
  }

  update(props) {
    const state = {};
    if (props.query !== this.query) {
      this.query = props.query;
      state.query = props.query;
    }
    if (props.paths !== this.paths) {
      this.paths = props.paths;
      state.items = props.paths;
    }
    if (props.error && props.error.message !== this.errorMessage) {
      this.errorMessage = props.error.message;
      state.errorMessage = props.error.message;
      state.emptyMessage = '';
    } else if (!props.error && this.errorMessage) {
      this.errorMessage = '';
      state.errorMessage = '';
      state.emptyMessage = 'No matches found';
    }
    console.log(state);
    if (state) this.selectListView.update(state);
  }

  setAddIconToElementService(service) {
    this.addIconToElementService = service;
  }

  async addIconToElement(element, path) {
    if (this.addIconToElementService) {
      this.addIconToElementService(element, path.full);
      // const disposable = this.addIconToElementService(element, path.full);
      // element.onDestroy(() => disposable.dispose());
    } else if (path.stat.isDirectory()) {
      if (path.lstat.isSymbolicLink()) {
        element.classList.add('icon-file-symlink-directory');
      } else {
        const directory = new Directory(path.full);
        const repos = await atom.project.repositoryForDirectory(directory);
        if (repos && atom.project.getPaths().find((projectPath) => projectPath === path.full)) {
          element.classList.add('icon-repo');
        } else if (repos && repos.isSubmodule()) {
          element.classList.add('icon-file-submodule');
        } else {
          element.classList.add('icon-file-directory');
        }
      }
    } else if (path.stat.isFile()) {
      if (path.lstat.isSymbolicLink()) {
        element.classList.add('icon-file-symlink-file');
      } else if (fsPlus.isReadmePath(path.fragment)) {
        element.classList.add('icon-book');
      } else {
        const extension = stdPath.extname(path.fragment);
        if (fsPlus.isCompressedExtension(extension)) {
          element.classList.add('icon-file-zip');
        } else if (fsPlus.isImageExtension(extension)) {
          element.classList.add('icon-file-media');
        } else if (fsPlus.isPdfExtension(extension)) {
          element.classList.add('icon-file-pdf');
        } else if (fsPlus.isBinaryExtension(extension)) {
          element.classList.add('icon-file-binary');
        } else {
          element.classList.add('icon-file-text');
        }
      }
    }
  }

  createListItemElement(path, {selected, index, visible}) {
    const li = document.createElement('li');
    const fileName = document.createElement('div');
    fileName.classList.add('primary-line');
    if (!path.tag) {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      this.addIconToElement(icon, path);
      fileName.appendChild(icon);
    }
    fileName.appendChild(document.createTextNode(path.fragment));
    li.appendChild(fileName);
    return li;
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.selectListView.destroy();
  }

  focus() {
    this.selectListView.focus();
  }

  get element() {
    return this.selectListView.element;
  }
}
