import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
import { DangerResults } from "../node_modules/danger/distribution/dsl/DangerResults"

declare var danger: DangerDSLType
declare var results: DangerResults

declare function message(message: string): void
declare function warn(message: string): void
declare function fail(message: string): void
declare function markdown(message: string): void

import * as cspell from "cspell-lib"
import mdspell from "markdown-spellcheck"
import * as minimatch from "minimatch"
import { extname } from "path"
import { getRepository } from "./repository"
import context from "./string-index-context"

const implicitSettingsFilename = "spellcheck.json"

/**
 * Optional ...options.
 *
 * Today it offers:
 *
 *  - `settings` a peril-like-GH-path to the JSON file of ignored words. e.g.
 *    "orta/words@ignore_words.json" which is the repo orta/words and the file
 *    "ignore_words.json". See the README for usage.
 *
 *  - `ignore` a list of words to ignore
 *  - `ignoreFiles` a list of files to ignore
 *  - `codeSpellCheck` a list of regexes to run cspell against
 */
export interface SpellCheckOptions {
  settings?: string
  ignore?: string[]
  ignoreFiles?: string[]
  codeSpellCheck?: string[]
}

/**
 * A de-null'd version of the spell settings
 */
export interface SpellCheckSettings {
  ignore: string[]
  "cSpell.words"?: string[]
  hasLocalSettings?: boolean
  ignoreFiles: string[]
}

export interface LegacySpellCheckSettings extends Omit<SpellCheckSettings, "ignoreFiles"> {
  whitelistFiles: string[]
}

/**
 * This is the _expected_ structure of the JSON file for settings.
 */
export type SpellCheckJSONSettings = Partial<SpellCheckSettings | LegacySpellCheckSettings>

export interface SpellCheckWord {
  word: string
  index: number
}

interface SpellCheckContext {
  info: string
  lineNumber: number
}

const leftSquareBracket = "&#91;"

export enum SpellChecker {
  MDSpellCheck,
  CSpell,
}

const repository = getRepository(danger)

export const spellCheck = async (
  file: string,
  sourceText: string,
  type: SpellChecker,
  ignoredWords: string[],
  ignoredRegexs: string[]
) => {
  const errorFunc = type === SpellChecker.MDSpellCheck ? mdSpellCheck : codeSpellCheck
  const errors = await errorFunc(sourceText, file)

  const presentableErrors = errors
    .filter(e => ignoredWords.indexOf(e.word.toLowerCase()) === -1)
    .filter(e => !ignoredRegexs.find(r => !!e.word.match(new RegExp(r.substring(1)))))

  const contextualErrors = presentableErrors.map(e =>
    context.getBlock(sourceText, e.index, e.word.length)
  ) as SpellCheckContext[]

  if (contextualErrors.length > 0) {
    markdown(`
### Typos for ${repository.fileLinks([file])}

| Line | Typo |
| ---- | ---- |
${contextualErrors.map(contextualErrorToMarkdown).join("\n")}
      `)
  }
}

const contextualErrorToMarkdown = (error: SpellCheckContext) => {
  const sanitizedMarkdown = error.info.replace(/\[/, leftSquareBracket)
  return `${error.lineNumber} | ${sanitizedMarkdown}`
}

export const mdSpellCheck = (sourceText: string): SpellCheckWord[] =>
  mdspell.spell(sourceText, { ignoreNumbers: true, ignoreAcronyms: true })

export const codeSpellCheck = (sourceText: string, path: string): Promise<SpellCheckWord[]> => {
  const ext = extname(path)
  const languageIds = cspell.getLanguagesForExt(ext)
  const mergedSettings = cspell.mergeSettings(cspell.getDefaultSettings(), { source: { name: path, filename: path } })
  const config = cspell.constructSettingsForText(mergedSettings, sourceText, languageIds)

  return cspell.checkText(sourceText, config).then(info => {
    return info.items
      .filter(i => i.isError)
      .map(item => ({
        word: item.text,
        index: item.startPos,
      }))
  })
}

export const githubRepresentationForPath = (value: string) => {
  if (value.includes("@")) {
    const parts = value.split("@")
    const slug = parts[0].split("/")

    return {
      path: parts[1],
      repoSlug: parts[0],
      owner: slug[0],
      repo: slug[1],
    }
  }
}

export const parseSettingsFromFile = async (path: string, repo: string): Promise<SpellCheckSettings> => {
  const data = await repository.fileContents(path, repo)
  if (data) {
    const settings = JSON.parse(data)
    if ("whitelistFiles" in (settings as Partial<LegacySpellCheckSettings>)) {
      return {
        ignore: (settings.ignore || settings["cSpell.words"] || []).map(w => w.toLowerCase()),
        ignoreFiles: settings.whitelistFiles || [],
      }
    }
    if ("ignoreFiles" in (settings as Partial<SpellCheckSettings>)) {
      return {
        ignore: (settings.ignore || settings["cSpell.words"] || []).map(w => w.toLowerCase()),
        ignoreFiles: settings.ignoreFiles || [],
      }
    }
  }
  return { ignore: [], ignoreFiles: [] }
}

export const getSpellcheckSettings = async (options?: SpellCheckOptions): Promise<SpellCheckSettings> => {
  let ignoredWords = [] as string[]
  let allowlistedMarkdowns = [] as string[]

  if (options && options.settings) {
    const settingsRepo = githubRepresentationForPath(options.settings)
    if (settingsRepo) {
      const globalSettings = await parseSettingsFromFile(settingsRepo.path, settingsRepo.repoSlug)
      ignoredWords = ignoredWords.concat(globalSettings.ignore)
      allowlistedMarkdowns = allowlistedMarkdowns.concat(globalSettings.ignoreFiles)
    }
  }

  const localSettings = await parseSettingsFromFile(implicitSettingsFilename, repository.repoSlug)
  // from local settings file
  ignoredWords = ignoredWords.concat(localSettings.ignore)
  allowlistedMarkdowns = allowlistedMarkdowns.concat(localSettings.ignoreFiles)
  // from function
  ignoredWords = ignoredWords.concat((options && options.ignore) || [])
  allowlistedMarkdowns = allowlistedMarkdowns.concat((options && options.ignoreFiles) || [])
  const hasLocalSettings = !!(localSettings.ignore.length || localSettings.ignoreFiles.length)

  return { ignore: ignoredWords, ignoreFiles: allowlistedMarkdowns, hasLocalSettings }
}

/**
 * Spell checks any created or modified markdown files.
 *
 * Has an optional setting object for things like ignore.
 */
export default async function spellcheck(options?: SpellCheckOptions) {
  const allChangedFiles = [...danger.git.modified_files, ...danger.git.created_files]

  const settings = await getSpellcheckSettings(options)
  const ignore = settings.ignore || []
  const ignoreFiles = settings.ignoreFiles || []

  const ignoredRegexes = ignore.filter(f => f.startsWith("/"))
  const ignoredWords = ignore.filter(f => !f.startsWith("/"))

  /** Pull out the files which we want to run cspell over */
  const globs = (options && options.codeSpellCheck) || []
  const allCodeToCheck = getCodeForSpellChecking(allChangedFiles, globs).filter(f => ignoreFiles.indexOf(f) === -1)

  /** Grab any MD files */
  const allMD = allChangedFiles.filter(f => f.endsWith(".md") || f.endsWith(".markdown"))
  const markdowns = allMD.filter(md => ignoreFiles.indexOf(md) === -1)

  const filesToLookAt = {
    [SpellChecker.MDSpellCheck]: markdowns,
    [SpellChecker.CSpell]: allCodeToCheck,
  }

  for (const type of Object.keys(filesToLookAt)) {
    const files = filesToLookAt[type]
    for (const file of files) {
      const contents = await repository.fileContents(file, repository.repoSlug, repository.headRef)
      if (contents) {
        await spellCheck(file, contents, Number(type), ignoredWords, ignoredRegexes)
      }
    }
  }

  const hasTypos = results.markdowns.find(m => {
    if (typeof m === "string") {
      return (m as string).includes("### Typos for")
    } else {
      return m.message.includes("### Typos for")
    }
  })

  // https://github.com/artsy/artsy-danger/edit/master/spellcheck.json
  if (hasTypos && (settings.hasLocalSettings || options)) {
    const repo = options && options.settings && githubRepresentationForPath(options.settings)

    const repoEditURL = repository.editLink(implicitSettingsFilename, repository.headRef)
    const globalEditURL = repo && repository.editLink(implicitSettingsFilename)
    const globalSlug = repo && repository.repoSlug

    let localMessage = ""
    if (settings.hasLocalSettings && repoEditURL) {
      localMessage = `<p>Make changes to this repo's settings in ${url(repoEditURL, implicitSettingsFilename)}.</p>`
    } else if (options && (options.ignore || options.ignoreFiles)) {
      localMessage = `<p>Make changes to this repo's spellcheck function call in the dangerfile.</p>`
    }

    const globalMessage =
      options && repo
        ? `<p>
Make changes to the global settings ${url(globalEditURL!, repo.path)} in ${url(globalSlug!, "/" + globalSlug!)}.
</p>`
        : ""

    markdown(`
<details>
<summary>Got false positives?</summary>
${globalMessage}
${localMessage}
</details>
`)
  }
}

const url = (href: string, text: string) => `<a href='${href}'>${text}</a>`

const getCodeForSpellChecking = (allChangedFiles: string[], globs: string[]) => {
  return allChangedFiles.filter(file => {
    for (const glob of globs) {
      if (minimatch(file, glob)) {
        return true
      }
    }
  })
}
