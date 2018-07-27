'use babel'
/** @jsx etch.dom */

import stdPath from 'path'
import etch from 'etch'
import { CompositeDisposable } from 'atom'
import { filter, isValidPath, fetchItems } from './model'
import { resolveTilde, isDirectoryPath, mkdirWithP } from './helpers'
import View from './view'

export default class Application {
  constructor(em) {
    this.em = em
    
    this.state = {
      query: '',
      items: [],
      filteredItems: [],
      selectionIndex: 0,
      basePath: '',
      error: null
    }
    etch.initialize(this)

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add(this.element, {
      'core:move-up': (event) => {
        this.selectPrevious()
        event.stopPropagation()
      },
      'core:move-down': (event) => {
        this.selectNext()
        event.stopPropagation()
      },
      'core:move-to-top': (event) => {
        this.selectFirst()
        event.stopPropagation()
      },
      'core:move-to-bottom': (event) => {
        this.selectLast()
        event.stopPropagation()
      },
      'core:confirm': (event) => {
        this.confirm()
        event.stopPropagation()
      },
      'core:cancel': (event) => {
        this.cancel()
        event.stopPropagation()
      },
      'comfortable-open-file:move-up-directory': (event) => {
        this.moveUpDirectory()
        event.stopPropagation()
      },
      'comfortable-open-file:add-project-folder': (event) => {
        this.addProjectFolder()
        event.stopPropagation()
      },
      'comfortable-open-file:remove-project-folder': (event) => {
        this.removeProjectFolder()
        event.stopPropagation()
      }
    }))
  }

  render() {
    return (
      <View
        ref="view"
        query={this.state.query}
        onChangeQeury={(query) => this.setQuery(query)}
        onBlur={() => this.cancel()}
        items={this.state.filteredItems}
        selectionIndex={this.state.selectionIndex}
        onClick={(index) => this.onClick(index)}
        error={this.state.error}
      />
    )
  }

  async update(state) {
    this.state = state
    await etch.update(this)
  }

  async destroy() {
    await this.subscriptions.dispose()
    await etch.destroy(this)
  }

  async setQuery(query) {
    if (!await isValidPath(query)) {
      const state = Object.assign({}, this.state)
      state.query = query
      state.items = []
      state.filteredItems = []
      state.selectionIndex = 0
      state.error = null
      await this.update(state)
      return
    }

    if (isDirectoryPath(query)) {
      await this.moveDirectory(query)
      return
    }

    let resolved
    if (query.endsWith(stdPath.sep + '.')) {
      resolved = stdPath.resolve(this.state.basePath, resolveTilde(query))
      if (isDirectoryPath(resolved)) {
        resolved = resolved + '.'
      } else {
        resolved = resolved + stdPath.sep + '.'
      }
    } else if (query.endsWith(stdPath.sep + '..')) {
      resolved = stdPath.resolve(this.state.basePath, resolveTilde(query.slice(0, -1)))
      if (isDirectoryPath(resolved)) {
        resolved = resolved + '..'
      } else {
        resolved = resolved + stdPath.sep + '..'
      }
    } else {
      resolved = stdPath.resolve(this.state.basePath, resolveTilde(query))
    }
    
    let preQueryDirPath
    if (isDirectoryPath(this.state.query)) {
      preQueryDirPath = this.state.query
    } else {
      const dirName = stdPath.dirname(this.state.query)
      if (isDirectoryPath(dirName)) {
        preQueryDirPath = dirName        
      } else {
        preQueryDirPath = dirName + stdPath.sep
      }
    }
    
    let queryDirPath
    if (isDirectoryPath(resolved)) {
      queryDirPath = resolved
    } else {
      const dirName = stdPath.dirname(resolved)
      if (isDirectoryPath(dirName)) {
        queryDirPath = dirName
      } else {
        queryDirPath = dirName + stdPath.sep
      }
    }

    if (preQueryDirPath === queryDirPath) {
      const state = Object.assign({}, this.state)
      state.query = resolved
      state.filteredItems = filter(this.state.items, resolved)
      state.selectionIndex = 0
      await this.update(state)
    } else {
      try {
        const fetchedItems = await fetchItems(queryDirPath)
        const state = Object.assign({}, this.state)
        state.query = resolved
        state.items = fetchedItems
        state.filteredItems = filter(fetchedItems, resolved)
        state.selectionIndex = 0
        state.error = null
        await this.update(state)
      } catch (e) {
        const state = Object.assign({}, this.state)
        state.query = resolved
        state.items = []
        state.filteredItems = []
        state.selectionIndex = 0
        state.error = e
        await this.update(state)
      }
    }
  }

  async moveDirectory(dirPath) {
    let resolved = stdPath.resolve(this.state.basePath, resolveTilde(dirPath))
    resolved = isDirectoryPath(resolved) ? resolved : resolved + stdPath.sep
    try {
      const fetchedItems = await fetchItems(resolved)
      const state = Object.assign({}, this.state)
      state.query = resolved
      state.items = fetchedItems
      state.filteredItems = filter(fetchedItems, resolved)
      state.selectionIndex = 0
      state.error = null
      await this.update(state)
    } catch (e) {
      const state = Object.assign({}, this.state)
      state.query = resolved
      state.items = []
      state.filteredItems = []
      state.selectionIndex = 0
      state.error = e
      await this.update(state)
    }
  }

  async setBasePath(basePath) {
    let resolved = stdPath.resolve(resolveTilde(basePath))
    resolved = isDirectoryPath(resolved) ? resolved : resolved + stdPath.sep
    const state = Object.assign({}, this.state)
    state.basePath = resolved
    await this.update(state)
    await this.setQuery(this.state.query)
  }

  async selectPrevious() {
    if (this.state.selectionIndex <= 0) {
      await this.selectLast()
    } else {
      const state = Object.assign({}, this.state)
      state.selectionIndex = this.state.selectionIndex - 1
      await this.update(state)
    }
  }

  async selectNext() {
    if (this.state.filteredItems.length - 1 <= this.state.selectionIndex) {
      await this.selectFirst()
    } else {
      const state = Object.assign({}, this.state)
      state.selectionIndex = this.state.selectionIndex + 1
      await this.update(state)
    }
  }

  async selectFirst() {
    const state = Object.assign({}, this.state)
    state.selectionIndex = 0
    await this.update(state)
  }

  async selectLast() {
    const state = Object.assign({}, this.state)
    state.selectionIndex = Math.max(this.state.filteredItems.length - 1, 0)
    await this.update(state)
  }

  async moveUpDirectory() {
    await this.setQuery(this.state.query + '..' + stdPath.sep)
  }

  async onClick(index) {
    const state = Object.assign({}, this.state)
    state.selectionIndex = index
    await this.update(state)
    await this.confirm()
  }

  get selectionItem() {
    if (this.state.filteredItems.length > 0) {
      return this.state.filteredItems[this.state.selectionIndex]
    } else {
      return null
    }
  }

  async confirm() {
    const item = this.selectionItem
    if (item) {
      if (item.tag && item.tag === 'create-file') {
        await mkdirWithP(stdPath.dirname(this.state.query))
        this.em.emit('confirm', this.state.query)
      } else if (item.tag && item.tag === 'create-directory') {
        await mkdirWithP(this.state.query)
        await this.moveDirectory(this.state.query)
      } else if (item.stats.isDirectory()) {
        await this.moveDirectory(item.full)
      } else if (item.stats.isFile()) {
        this.em.emit('confirm', item.full)
      } 
    }
  }

  addProjectFolder() {
    const item = this.selectionItem
    if (!item || item.tag || !item.stats.isDirectory()) return
    this.em.emit('add-project-folder', item.full)
  }
  
  removeProjectFolder() {
    const item = this.selectionItem
    if (!item || item.tag || !item.stats.isDirectory()) return
    this.em.emit('remove-project-folder', item.full)
  }

  cancel() {
    this.em.emit('cancel')
  }

  focus() {
    this.refs.view.focus()
  }
}
