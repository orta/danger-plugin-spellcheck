jest.mock("./get-file-contents", () => ({ default: jest.fn() }))
import getFileContents from "./get-file-contents"
const fileContentsMock = getFileContents as jest.Mock<{}>

import { getSpellcheckSettings, mdSpellCheck, spellCheck, SpellCheckJSONSettings } from "./index"

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
  fileContentsMock.mockReset()
})

describe("getSpellcheckSettings()", () => {
  it("returns empty ignores and whitelist with no options", async () => {
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const settings = await getSpellcheckSettings()

    expect(settings).toEqual({ ignore: [], whitelistFiles: [] })
    expect(getFileContents).toHaveBeenCalledTimes(1)
  })

  it("returns global settings with no local settings", async () => {
    const globalSettings: SpellCheckJSONSettings = {
      ignore: ["global"],
      whitelistFiles: [],
    }
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(""))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({ ignore: ["global"], whitelistFiles: [] })
    expect(getFileContents).toHaveBeenCalledTimes(2)
  })

  it("returns local settings merged with global ones", async () => {
    const globalSettings: SpellCheckJSONSettings = {
      ignore: ["global"],
      whitelistFiles: [],
    }

    const localSettings: SpellCheckJSONSettings = {
      ignore: ["local"],
      whitelistFiles: [],
    }
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(globalSettings)))
    fileContentsMock.mockImplementationOnce(() => Promise.resolve(JSON.stringify(localSettings)))

    const something = { settings: "orta/my-settings@setting.json" }
    const settings = await getSpellcheckSettings(something)

    expect(settings).toEqual({ ignore: ["global", "local"], whitelistFiles: [] })
    expect(getFileContents).toHaveBeenCalledTimes(2)
  })
})

describe("spellcheck()", () => {
  it("checks a file", () => {
    return spellCheck("/a/b/c", `i aslo raed`, []).then(f => {
      const markdown = global.markdown.mock.calls[0][0]
      expect(markdown).toContain("i")
      expect(markdown).toContain("aslo")
      expect(markdown).toContain("raed")
    })
  })

  it("ignores a word", () => {
    return spellCheck("/a/b/c", `i aslo raed\n\nhlelo`, ["hlelo"]).then(f => {
      const markdown = global.markdown.mock.calls[0][0]
      expect(markdown).toContain("i")
      expect(markdown).toContain("aslo")
      expect(markdown).toContain("raed")

      expect(markdown).not.toContain("hlelo")
    })
  })

  it("ignores the case of a word", () => {
    return spellCheck("/a/b/c", `i aslo raed\n\nhleLo`, ["hlelo"]).then(f => {
      const markdown = global.markdown.mock.calls[0][0]
      expect(markdown).toContain("i")
      expect(markdown).toContain("aslo")
      expect(markdown).toContain("raed")

      expect(markdown).not.toContain("hleLo")
    })
  })
})

describe("mdSpellCheck", () => {
  it("checks a string and returns some objects", () => {
    const results = mdSpellCheck(`i aslo raed`)
    expect(results.length).toEqual(3)
  })
})
