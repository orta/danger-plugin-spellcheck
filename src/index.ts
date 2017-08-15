import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
declare function message(message: string): void
declare function warn(message: string): void
declare function fail(message: string): void
declare function markdown(message: string): void
declare function markdown(message: string): void

import mdspell from "markdown-spellcheck"
import context from "./string-index-context"

export interface SpellCheckWord {
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

export const spellCheck = (file: string, sourceText: string, ignoredWords: string[]) =>
  new Promise(res => {
    const errors = mdSpellCheck(sourceText)

    const presentableErrors = errors.filter(e => ignoredWords.indexOf(e.word.toLowerCase()) === -1)

    const contextualErrors = presentableErrors.map(e =>
      context.getBlock(sourceText, e.index, e.word.length),
    ) as SpellCheckContext[] // tslint:disable-line

    if (contextualErrors.length > 0) {
      markdown(`
### Typoes for ${danger.github.utils.fileLinks([file])}

| Line | Typo |
| ---- | ---- |
${contextualErrors.map(contextualErrorToMarkdown).join("\n")}
        `)
    }

    res()
  })

const contextualErrorToMarkdown = (error: SpellCheckContext) => {
  const sanitizedMarkdown = error.info.replace(/\[/, leftSquareBracket)
  return `${error.lineNumber} | ${sanitizedMarkdown}`
}

const getParams = path => ({ ...danger.github.thisPR, path, ref: danger.github.pr.head.ref })
const getDetails = async (path: string, params: any) => {
  const result = await danger.github.api.repos.getContent(params)
  if (result) {
    const buffer = new Buffer(result.data.content, "base64")
    return buffer.toString()
  } else {
    fail(toMarkdownObject(params, "Network Error for " + path))
  }
}

export const mdSpellCheck = (sourceText: string): SpellCheckWord[] =>
mdspell.spell(sourceText, { ignoreNumbers: true, ignoreAcronyms: true })

export const githubRepresentationforPath = (value: string) => {
  if (value.includes("@")) {
    return {
      path: value.split("@")[1] as string,
      owner: value.split("@")[0].split("/")[0] as string,
      repo: value.split("@")[0].split("/")[1] as string,
    }
  }
}

/**
 * Optional ...options.
 *
 * Today it offers:
 *
 *  - `ignore` a peril-like-GH-path to the JSON file of ignored words. e.g.
 *    "orta/words@ignore_words.json" which is the repo orta/words and the file
 *    "ignore_words.json". See the README for usage.
 *
 */
export interface SpellCheckOptions {
  ignore: string
}

/**
 * Spell checks any created or modified markdown files.
 *
 * Has an optional setting object for things like ignore.
 */
export default async function spellcheck(options?: SpellCheckOptions) {
  const allChangedFiles = [...danger.git.modified_files, ...danger.git.created_files]
  const allMD = allChangedFiles.filter(f => f.endsWith(".md") || f.endsWith(".markdown"))
  let ignoredWords = []

  if (options && options.ignore) {
    const ignoreRepo = githubRepresentationforPath(options.ignore)
    if (ignoreRepo) {
      const data = await getDetails(ignoreRepo.path, ignoreRepo)
      if (data) {
        const settings = JSON.parse(data)
        if (!settings.ignored) {
          ignoredWords = settings.ignored.map(w => w.toLowerCase())
        }
      }
    } else {
      fail("`danger-plugin-spellcheck`: Could not make a repo + file from " + options.ignore)
    }
  }

  for (const file of allMD) {
    const contents = await getDetails(file, getParams(file))
    if (contents) {
      await spellCheck(file, contents, ignoredWords)
    }
  }
}
