'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { TextEditor } from 'atom'
import { wait } from './helpers'

export default class QueryInput {
  constructor(props) {
    this.props = props
    etch.initialize(this)

    this.refs.textEditor.setText(props.query)
    this.refs.textEditor.onDidChange(() => this.onDidChange())
    const editorElement = this.refs.textEditor.element
    editorElement.addEventListener('blur', (event) => this.onBlur(event))
  }

  render() {
    return <TextEditor ref="textEditor" mini={true} />
  }

  async update(props) {
    this.props = props
    if (props.query !== this.refs.textEditor.getText()) {
      this.refs.textEditor.setText(props.query)        
    }
  }

  async destroy() {
    await etch.destroy(this)
  }

  async onDidChange() {
    if (this.props.onChange) {
      const check = this.refs.textEditor.getText()
      await wait(10)
      const query = this.refs.textEditor.getText()
      if (check === query) {
        this.props.onChange(query) 
      }
    }
  }

  onBlur() {
    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }

  focus() {
    this.refs.textEditor.element.focus()
  }
}
