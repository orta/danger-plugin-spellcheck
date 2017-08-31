import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
declare function message(message: string): void
declare function warn(message: string): void
declare function fail(message: string): void
declare function markdown(message: string): void
declare function markdown(message: string): void

const toMarkdownObject = (thing, title) => `
## ${title}

\`\`\`json
${JSON.stringify(thing, null, "  ")}
\`\`\`
`

const getFileContents = async (path: string, params: any) => {
  const result = await danger.github.api.repos.getContent(params)
  if (result) {
    const buffer = new Buffer(result.data.content, "base64")
    return buffer.toString()
  } else {
    fail(toMarkdownObject(params, "Network Error for " + path))
  }
}

export default getFileContents
