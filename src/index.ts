import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
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

const spellCheck = (file: string, sourceText: string, ignoredWords: string[]) =>
  new Promise(res => {
    const errors = mdspell.spell(sourceText, { ignoreNumbers: true, ignoreAcronyms: true }) as SpellCheckWord[]
    const presentableErrors = errors.filter(e => ignoredWords.indexOf(e.word) !== -1)
    const contextualErrors = presentableErrors.map(e =>
      context.getBlock(sourceText, e.index, e.word.length)
    ) as SpellCheckContext[] // tslint:disable-line

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

const getParams = path => ({ ...danger.github.thisPR, path, ref: danger.github.pr.head.ref })
const getDetails = (params, path) =>
  new Promise<string | null>(res => {
    danger.github.api.repos.getContent(params, (error, result) => {
      if (error) {
        fail(toMarkdownObject(error, "Network Error for " + path) + toMarkdownObject(params, "Params"))
      }

      if (result) {
        const buffer = new Buffer(result.data.content, "base64")
        res(buffer.toString())
      } else {
        res()
      }
    })
  })

const getContents = path => getDetails(getParams(path), path)

export const githubRepresentationforPath = (value: string) => {
  if (value.includes("@")) {
    return {
      path: value.split("@")[1] as string,
      owner: value.split("@")[0].split("/")[0] as string,
      repo: value.split("@")[0].split("/")[1] as string,
    }
  }
}

interface SpellCheckOptions {
  ignore: string
}

/**
 * Spell checks any created or modified markdown files.
 *
 * Has an optional setting object.
 */
export default async function spellcheck(options?: SpellCheckOptions) {
  const allChangedFiles = [...danger.git.modified_files, ...danger.git.created_files]
  const allMD = allChangedFiles.filter(f => f.endsWith(".md") || f.endsWith(".markdown"))
  let ignoredWords: { ignored: string[] }

  if (options && options.ignore) {
    const ignoreRepo = githubRepresentationforPath(options.ignore)
    const data = await getDetails(ignoreRepo, ignoreRepo.path)
    if (data) {
      // TODO: Error handling
      ignoredWords = JSON.parse(data).ignored
    }
  }

  for (const file of allMD) {
    const contents = await getContents(file)
    if (contents) {
      await spellCheck(file, contents, ignoredWords.ignored)
    }
  }
}
