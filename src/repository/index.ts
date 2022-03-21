import { DangerDSL } from "danger/distribution/dsl/DangerDSL"
import { GitHubProvider } from "./github"

/**
 * Get repository based if danger.github, or any other danger.<provider> exists
 */
export const getRepository = (danger: DangerDSL) => {
  if (danger.github) {
    return new GitHubProvider(danger.github)
  }

  throw new Error("Unsupported provider")
}
