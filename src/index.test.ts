import {mdSpellCheck, spellCheck} from "./index"

declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.message = jest.fn()
  global.fail = jest.fn()
  global.markdown = jest.fn()
  global.danger = { utils: { sentence: jest.fn()} , github: { utils: { fileLinks: jest.fn((f) => f.join(",")) }} }
})

afterEach(() => {
  global.warn = undefined
  global.message = undefined
  global.fail = undefined
  global.markdown = undefined
  global.danger = undefined
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
