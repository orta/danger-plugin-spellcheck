import { GitHubDSL } from "danger"

export class GitHubProvider {
  public constructor(private readonly api: GitHubDSL) {}

  public fileLinks(paths: string[]) {
    return this.api.utils.fileLinks(paths)
  }

  public async fileContents(path: string, repoSlug?: string, ref?: string) {
    return this.api.utils.fileContents(path, repoSlug, ref)
  }
}
