import { GitHubDSL } from "danger"

export class GitHubProvider {
  public constructor(private readonly api: GitHubDSL) {}
}
