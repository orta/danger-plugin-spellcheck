import {
  codeSpellCheck,
  getSpellcheckSettings,
  mdSpellCheck,
  spellCheck,
  SpellChecker,
  SpellCheckJSONSettings,
} from "./index"

declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.message = jest.fn()
  global.fail = jest.fn()
  global.markdown = jest.fn()
  global.danger = {
    utils: {
      sentence: jest.fn(),
    },
    github: {
      utils: {
        fileLinks: jest.fn(f => f.join(",")),
        fileContents: jest.fn(),
      },
      api: {
        repos: {
          getContent: jest.fn(),
        },
      },
      pr: {
        head: {
          ref: "branch",
        },
      },
    },
    git: {
      modified_files: ["README.md", "CHANGELOG.md"],
      created_files: ["VISION.md"],
    },
  }
})

afterEach(() => {
  global.warn = undefined
  global.message = undefined
  global.fail = undefined
  global.markdown = undefined
  global.danger = undefined
})

describe("getSpellcheckSettings()", () => {
  it("returns empty ignores and allowlist with no options", async () => {
    const fileContentsMock = global.danger.github.utils.fileContents
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const settings = await getSpellcheckSettings()

    expect(settings).toEqual({
      hasLocalSettings: false,
      ignore: [],
      ignoreFiles: [],
    })
    expect(fileContentsMock).toHaveBeenCalledTimes(1)
  })

  it("should return whatever is passed in if ignoreFiles is not empty", async () => {
    const globalSettings: SpellCheckJSONSettings = {
      ignore: [],
      ignoreFiles: ["settings.md"],
    }
    const fileContentsMock = global.danger.github.utils.fileContents
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({
      hasLocalSettings: false,
      ignore: [],
      ignoreFiles: ["settings.md"],
    })
    expect(fileContentsMock).toHaveBeenCalledTimes(2)
  })

  it("if whitelist is passed in the result should be ignoreFiles array with files as whitelistFiles", async () => {
    const globalSettings: SpellCheckJSONSettings = {
      ignore: [],
      whitelistFiles: ["settings.md"],
    }
    const fileContentsMock = global.danger.github.utils.fileContents
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({
      hasLocalSettings: false,
      ignore: [],
      ignoreFiles: ["settings.md"],
    })
    expect(fileContentsMock).toHaveBeenCalledTimes(2)
  })

  it("returns global settings with no local settings", async () => {
    const fileContentsMock = global.danger.github.utils.fileContents

    const globalSettings: SpellCheckJSONSettings = {
      ignore: ["global"],
      ignoreFiles: [],
    }
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({
      hasLocalSettings: false,
      ignore: ["global"],
      ignoreFiles: [],
    })
    expect(fileContentsMock).toHaveBeenCalledTimes(2)
  })

  it("returns local settings merged with global ones", async () => {
    const fileContentsMock = global.danger.github.utils.fileContents

    const globalSettings: SpellCheckJSONSettings = {
      ignore: ["global"],
      ignoreFiles: [],
    }

    const localSettings: SpellCheckJSONSettings = {
      ignore: ["local"],
      ignoreFiles: [],
    }
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(localSettings)))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({
      hasLocalSettings: true,
      ignore: ["global", "local"],
      ignoreFiles: [],
    })
    expect(fileContentsMock).toHaveBeenCalledTimes(2)
  })
})

describe("spellcheck()", () => {
  describe("mdspell", () => {
    it("checks a file", () => {
      return spellCheck("/a/b/c", `i aslo raed`, SpellChecker.MDSpellCheck, [], []).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).toContain("i")
        expect(markdown).toContain("aslo")
        expect(markdown).toContain("raed")
      })
    })

    it("ignores a word", () => {
      return spellCheck("/a/b/c", `i aslo raed\n\nhlelo`, SpellChecker.MDSpellCheck, ["hlelo"], []).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).toContain("i")
        expect(markdown).toContain("aslo")
        expect(markdown).toContain("raed")

        expect(markdown).not.toContain("hlelo")
      })
    })

    it("ignores the case of a word", () => {
      return spellCheck("/a/b/c", `i aslo raed\n\nhleLo`, SpellChecker.MDSpellCheck, ["hlelo"], []).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).toContain("i")
        expect(markdown).toContain("aslo")
        expect(markdown).toContain("raed")

        expect(markdown).not.toContain("hleLo")
      })
    })

    it("ignores a word which hits passed in regexes regex", () => {
      return spellCheck("/a/b/c", `i aslo raed\n\nhleLo`, SpellChecker.MDSpellCheck, ["hlelo"], ["/r.*d"]).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).not.toContain("**raed**")
      })
    })
  })

  describe("cspell", () => {
    it("checks a file", () => {
      return spellCheck("/a/b/c", `i aslo raed`, SpellChecker.CSpell, [], []).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).toContain("i")
        expect(markdown).toContain("aslo")
        expect(markdown).toContain("raed")
      })
    })

    it("ignores a word", () => {
      return spellCheck("/a/b/c", `i aslo raed\n\nhlelo`, SpellChecker.CSpell, ["hlelo"], []).then(f => {
        const markdown = global.markdown.mock.calls[0][0]
        expect(markdown).toContain("i")
        expect(markdown).toContain("aslo")
        expect(markdown).toContain("raed")

        expect(markdown).not.toContain("hlelo")
      })
    })
  })
})

describe("mdSpellCheck", () => {
  it("checks a string and returns some objects", () => {
    const results = mdSpellCheck(`i aslo raed`)
    expect(results.length).toEqual(3)
  })
})

describe("codeSpellCheck", () => {
  it("checks a string and returns some objects", async () => {
    const results = await codeSpellCheck(`i aslo raed`, "filename.md")
    expect(results.length).toEqual(2)
  })
})
