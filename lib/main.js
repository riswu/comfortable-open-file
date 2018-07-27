'use babel'

import os from 'os'
import stdPath from 'path'
import { EventEmitter } from 'events'
import { CompositeDisposable } from 'atom'
import Application from './application'

const em = new EventEmitter()
let app
let modalPanel
let subscriptions

function getActiveFileDirectoryPath() {
  const editor = atom.workspace.getActiveTextEditor()
  if (editor && editor.getPath()) {
    return stdPath.dirname(editor.getPath()) 
  } else {
    return null    
  }
}

async function attach() {
  const activeFileDirPath = getActiveFileDirectoryPath()
  let basePath
  if (activeFileDirPath) {
    basePath = activeFileDirPath
  } else {
    basePath = atom.config.get('comfortable-open-file.initialDirectoryPath')
  }
  await app.setBasePath(basePath)
  await app.moveDirectory(basePath)
  modalPanel.show()
  app.focus()
}

function detach() {
  atom.workspace.getActivePane().activate()
  modalPanel.hide()
}

export default {
  config: {
    initialDirectoryPath: {
      title: 'Initial Directory Path',
      description: 'If you have already opened a file, you can get the file list of the directory.',
      type: 'string',
      default: os.homedir()
    }
  },
  
  activate(state) {
    app = new Application(em)
    em.on('confirm', (path) => {
      atom.workspace.open(path)
      detach()
    })
    em.on('add-project-folder', (path) => {
      if (!atom.project.getPaths().find((projectPath) => projectPath === path)) {
        atom.project.addPath(path)
      }
      detach()
    })
    em.on('remove-project-folder', (path) => {
      if (atom.project.getPaths().find((projectPath) => projectPath === path)) {
        atom.project.removePath(path)
      }
      detach()
    })
    em.on('cancel', () => detach())
    
    modalPanel = atom.workspace.addModalPanel({
      item: app.element,
      visible: false
    })

    subscriptions = new CompositeDisposable()
    subscriptions.add(atom.commands.add('atom-workspace', {
      'comfortable-open-file:toggle': (event) => {
        this.toggle()
        event.stopPropagation()
      }
    }))
  },

  async deactivate() {
    await subscriptions.dispose()
    await modalPanel.destroy()
    await app.destroy()
  },
  
  toggle() {
    if (!modalPanel.isVisible()) {
      attach()
    } else {
      detach()
    }
  }
}
