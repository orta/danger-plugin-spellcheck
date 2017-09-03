import spellcheck from './dist'
import {schedule} from "danger"

schedule(
  spellcheck({ settings: "artsy/artsy-danger@spellcheck.json" })
)
