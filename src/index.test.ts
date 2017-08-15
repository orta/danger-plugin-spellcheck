import {mdSpellCheck, spellCheck} from "./index"

declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.message = jest.fn()
  global.fail = jest.fn()
  global.markdown = jest.fn()
  global.danger = { utils: { sentence: jest.fn()} , github: { utils: { fileLinks: jest.fn((f) => f.join(",")) }},
})

afterEach(() => {
  global.warn = undefined
  global.message = undefined
  global.fail = undefined
  global.markdown = undefined
})

describe("spellcheck()", () => {
  it("checks a file", () => {
    return spellCheck("/a/b/c", `i aslo raed`, []).then(f => {
      const markdown = global.markdown.mock.calls[0][0]
      expect(markdown).toContain("aslo")
      expect(markdown).toContain("raed")
      expect(markdown).toContain("i")
    })
  })

  it("ignores a word", () => {
    return spellCheck("/a/b/c", `i aslo raed\n\nhlelo`, ["hlelo"]).then(f => {
      const markdown = global.markdown.mock.calls[0][0]
      expect(markdown).toContain("aslo")
      expect(markdown).toContain("raed")
      expect(markdown).toContain("i")

      expect(markdown).not.toContain("hlelo")
    })
  })
})

describe("mdSpellCheck", () => {
  it("checks a string and returns some objects", () => {
    const results = mdSpellCheck(`i aslo raed`)
    expect(results.length).toEqual(3)
  })
})
