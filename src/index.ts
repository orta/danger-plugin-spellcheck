import {DangerDSLType} from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void
export declare function markdown(message: string): void

import mdspell from "markdown-spellcheck"
import context from "./string-index-context"

interface SpellCheckWord {
  word: string
  index: number
}

interface SpellCheckContext {
  info: string
  lineNumber: number
}

const leftSquareBracket = "&#91;"

const toMarkdownObject = (thing, title) => `
## ${title}

\`\`\`json
${JSON.stringify(thing, null, "  ")}
\`\`\`
`

const spellCheck = (file: string, sourceText: string) => new Promise(res => {
  const errors = mdspell.spell(sourceText, { ignoreNumbers: true, ignoreAcronyms: true }) as SpellCheckWord[]
  const contextualErrors = errors.map(e => context.getBlock(sourceText, e.index, e.word.length)) as SpellCheckContext[]
  markdown(`
### Typoes for ${danger.github.utils.fileLinks([file])}

| Line | Typo |
| ---- | ---- |
${contextualErrors.map(contextualErrorToMarkdown).join("\n")}
  `)

  res()
})

const contextualErrorToMarkdown = (error: SpellCheckContext) => {
  const sanitizedMarkdown = error.info.replace(/\[/, leftSquareBracket)
  return `${error.lineNumber} | ${sanitizedMarkdown}`
}

const getContents = (path) => new Promise<string | null>(res => {
    const apiParams = {...danger.github.thisPR, path, ref: danger.github.pr.head.ref}
    danger.github.api.repos.getContent(apiParams, (error, result) => {
      if (error) {
        fail(toMarkdownObject(error, "Network Error for " + path) + toMarkdownObject(apiParams, "Params"))
      }

      if (result) {
        const buffer = new Buffer(result.data.content, "base64")
        res(buffer.toString())
      } else {
        res()
      }
    })
})

/**
 * Spell checks any created or modified markdown files.
 */
export default async function spellcheck() {
  const allChangedFiles = [...danger.git.modified_files, ...danger.git.created_files]
  const allMD = allChangedFiles.filter(f => f.endsWith(".md") || f.endsWith(".markdown"))
  for (const file of allMD) {
    const contents = await getContents(file)
    if (contents) {
      await spellCheck(file, contents)
    }
  }
}
