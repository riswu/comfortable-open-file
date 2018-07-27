'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import stdPath from 'path'
import fsPlus from 'fs-plus'
import QueryInput from './query-input'

export default class View {
  constructor(props) {  
    this.props = props
    etch.initialize(this)
  }

  render() {
    return (
      <div className="comfortable-open-file">
        <div>
          <QueryInput
            ref="queryInput"
            query={this.props.query}
            onChange={(query) => this.props.onChangeQeury(query)}
            onBlur={(event) => this.props.onBlur(event)}
          />
        </div>
        {this.renderErrorMessages()}
        {this.renderItems()}
      </div>
    )
  }

  renderErrorMessages() {
    if (this.props.error) {
      return <div>{this.props.error.message}</div>
    } else {
      return null
    }
  }

  renderItems() {
    if (this.props.items.length > 0) {
      const listItems = this.props.items.map((item, index) => {
        const isSelected = index === this.props.selectionIndex
        return (
          <ItemView
            item={item}
            index={index}
            isSelected={isSelected}
            onClick={(index) => this.props.onClick(index)}
          />
        )
      })

      return (
        <div className="select-list">
          <ol className="list-group">
            {listItems}
          </ol>
        </div>
      ) 
    } else {
      if (this.props.error) {
        return null
      } else {
        return <div>No matches found</div>
      }
    }
  }

  async update(props) {
    this.props = props
    await etch.update(this)
  }

  async destroy() {
    await etch.destroy(this)
  }

  focus() {
    this.refs.queryInput.focus()
  }
}

class ItemView {
  constructor(props) {
    this.props = props
    etch.initialize(this)
    
    if (this.props.selected) {
      this.element.scrollIntoViewIfNeeded(false)      
    }

    this.element.addEventListener('mousedown', (event) => this.onMouseDown(event))
    this.element.addEventListener('mouseup', (event) => this.onMouseUp(event))
    this.element.addEventListener('click', (event) => this.onClick(event))
  }

  render() {
    if (this.props.isSelected) {
      return (
        <li key={this.props.index} className="selected">
          <div className="primary-line">
            {this.renderIcon()}
            {this.props.item.fragment}
          </div>
        </li>
      )
    } else {
      return (
        <li key={this.props.index}>
          <div className="primary-line">
            {this.renderIcon()}
            {this.props.item.fragment}  
          </div>
        </li>
      )
    }    
  }

  renderIcon() {
    if (this.props.item.tag) return null
    
    if (this.props.item.stats.isDirectory()) {
      if (this.props.item.lstats.isSymbolicLink()) {
        return <span className="icon icon-file-symlink-directory"></span>
      } else {
        return <span className="icon icon-file-directory"></span>
      }
    }

    if (this.props.item.stats.isFile()) {
      if (this.props.item.lstats.isSymbolicLink()) {
        return <span className="icon icon-file-symlink-file"></span>
      } else if (fsPlus.isReadmePath(this.props.item.fragment)) {
        return <span className="icon icon-book"></span>
      } else {
        const extension = stdPath.extname(this.props.item.fragment)
        if (fsPlus.isCompressedExtension(extension)) {
          return <span className="icon icon-file-zip"></span>
        } else if (fsPlus.isImageExtension(extension)) {
          return <span className="icon icon-file-media"></span>
        } else if (fsPlus.isPdfExtension(extension)) {
          return <span className="icon icon-file-pdf"></span>
        } else if (fsPlus.isBinaryExtension(extension)) {
          return <span className="icon icon-file-binary"></span>
        } else {
          return <span className="icon icon-file-text"></span>
        }
      }
    }

    return null
  }
    
  async update(props) {
    this.props = props
    await etch.update(this)
    
    if (this.props.isSelected) {
      this.element.scrollIntoViewIfNeeded(false)      
    }
  }

  async destroy() {
    await etch.destroy(this)
  }

  onMouseDown(event) {
    event.preventDefault()
  }

  onMouseUp(event) {
    event.preventDefault()
  }

  onClick(event) {
    if (this.props.onClick) {
      this.props.onClick(this.props.index)
    }
    event.preventDefault()
  }
}
