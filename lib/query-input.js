'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { TextEditor } from 'atom'
import { wait } from './helpers'

export default class QueryInput {
  constructor(props) {
    this.props = props
    etch.initialize(this)

    this.refs.editor.setText(props.query)
    this.refs.editor.onDidChange(() => this.onDidChange())
    const editorElement = this.refs.editor.element
    editorElement.addEventListener('focus', (event) => this.onFocus(event))
    editorElement.addEventListener('blur', (event) => this.onBlur(event))
  }

  render() {
    return <TextEditor ref="editor" mini={true} />
  }

  async update(props) {
    this.props = props
    if (props.query !== this.refs.editor.getText()) {
      this.refs.editor.setText(props.query)        
    }
    if (props.focus !== this.refs.editor.element.hasFocus()) {
      if (props.focus) {
        this.refs.editor.element.focus() 
      } else {
        this.refs.editor.element.blur()
      }
    }
  }

  async destroy() {
    await etch.destroy(this)
  }

  async onDidChange() {
    if (this.props.query !== this.refs.editor.getText()) {
      if (this.props.onChange) {
        const check = this.refs.editor.getText()
        await wait(10)
        const query = this.refs.editor.getText()
        if (check === query) {
          this.props.onChange(query) 
        }
      } 
    }
  }

  onFocus() {
    if (this.props.focus !== this.refs.editor.element.hasFocus()) {
      if (this.props.onFocus) {
        this.props.onFocus()
      } 
    }
  }

  onBlur() {
    if (this.props.focus !== this.refs.editor.element.hasFocus()) {
      if (this.props.onBlur) {
        this.props.onBlur()
      }
    }
  }
}
