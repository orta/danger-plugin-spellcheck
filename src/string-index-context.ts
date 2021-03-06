// Taken from https://github.com/lukeapage/node-markdown-spellcheck/blob/master/es6/context.js
// Under the ISC license

// Modifed to fit this project's style-guide and to return markdown instead of chalk-based ANSII colouring.

function getLines(src, index, noBefore, noAfter) {
  let beforeLines = [] // tslint:disable-line
  let afterLines = [] // tslint:disable-line
  let thisLineStart
  let line
  let column

  let lastCutIndex = index

  for (let i = index - 1; i >= 0; i--) {
    if (src[i] === "\n") {
      if (thisLineStart === undefined) {
        thisLineStart = i + 1
        column = index - (i + 1)
      } else {
        (beforeLines as any).push(src.substr(i, lastCutIndex - i))
      }
      lastCutIndex = i
      if (beforeLines.length >= noBefore) {
        break
      }
    }
  }
  if (thisLineStart === undefined) {
    thisLineStart = 0
    column = index
  }
  for (let i = index; i < src.length; i++) {
    if (src[i] === "\n") {
      if (line === undefined) {
        line = src.substr(thisLineStart, i - thisLineStart)
      } else {
        (afterLines as any).push(src.substr(lastCutIndex, i - lastCutIndex))
      }
      lastCutIndex = i
      if (afterLines.length >= noAfter) {
        break
      }
    }
  }
  if (line === undefined) {
    line = src.slice(thisLineStart)
  }
  let lineNumber = 1
  for (let i = index - 1; i >= 0; i--) {
    if (src[i] === "\n") {
      lineNumber++
    }
  }
  return {
    line,
    beforeLines,
    afterLines,
    column,
    lineNumber,
  }
}

export default {
  getBlock(src, index, length) {
    const lineInfo = getLines(src, index, 2, 2)
    let lineStart = 0
    let lineEnd = lineInfo.line.length
    if (lineInfo.column > 30) {
      lineStart = lineInfo.column - 30
    }
    if ((lineEnd - (lineInfo.column + length)) > 30) {
      lineEnd = lineInfo.column + length + 30
    }
    const info = lineInfo.line.substring(lineStart, lineInfo.column) +
      "**" + lineInfo.line.substr(lineInfo.column, length) + "**" +
      lineInfo.line.substring(lineInfo.column + length, lineEnd)
    return {
      info,
      lineNumber: lineInfo.lineNumber,
    }
  },
}
