import { GitHubDSL } from "danger"

export class GitHubProvider {
  public constructor(private readonly api: GitHubDSL) {}

  public get repoSlug() {
    const pr = this.api.thisPR
    return `${pr.owner}/${pr.repo}`
  }

  public get headRef() {
    return this.api.pr.head.ref
  }

  public editLink(fileName: string, ref = "master") {
    return `/${this.repoSlug}/edit/${ref}/${fileName}`
  }

  public fileLinks(paths: string[]) {
    return this.api.utils.fileLinks(paths)
  }

  public async fileContents(path: string, repoSlug?: string, ref?: string) {
    return this.api.utils.fileContents(path, repoSlug, ref)
  }
}
