# danger-plugin-spellcheck

[![Build Status](https://travis-ci.org/orta/danger-plugin-spellcheck.svg?branch=master)](https://travis-ci.org/orta/danger-plugin-spellcheck)
[![npm version](https://badge.fury.io/js/danger-plugin-spellcheck.svg)](https://badge.fury.io/js/danger-plugin-spellcheck)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> Spell checks any created or modified files in a GitHub PR using 

- [node-markdown-spellcheck](https://github.com/lukeapage/node-markdown-spellcheck) for Markdown.
- [cspell](https://github.com/streetsidesoftware/cspell) for code (opt-in).

## Usage

Install:

```sh
yarn add danger-plugin-spellcheck --dev
```

At a glance:

```js
// dangerfile.js
import spellcheck from 'danger-plugin-spellcheck'

spellcheck()
```

You can have a shared repo for the settings for your spell checking, or you can have a file called `spellcheck.json` in your repo's root.

```js
// dangerfile.js
import spellcheck from 'danger-plugin-spellcheck'

spellcheck({ settings: "artsy/artsy-danger@spellcheck.json" })
```

The JSON should look something like:

```json
{
  "ignore": ["orta", "artsy", "github", "/danger-*."],
  "whitelistFiles": ["README.md"]
}
```

The `"ignore"` section is case in-sensitive for words, if a word has a prefix of `"/"` then it will be treated as a `RegExp`.

The `"whitelistFiles"` section is an array of files which will **NOT** be spellchecked.

#### Dynamic Content

The spellcheck function also accepts `ignore` and `whitelistFiles` as properties of the options object.  If you already have a list of spell check exceptions (_e.g._ from your editor), you can build them in your dangerfile and pass them in to your spellcheck function call.

```js
// dangerfile.js
import spellcheck from 'danger-plugin-spellcheck'

spellcheck({
  ignore: ['Nachoz', 'Tacoz'],
  whitelistFiles: ['README.md']
})
```

#### Checking Code

The spellcheck also takes a set of globs to run cspell against:

```js
// dangerfile.js
import spellcheck from 'danger-plugin-spellcheck'

spellcheck({
  ignore: ['Nachoz', 'Tacoz'],
  whitelistFiles: ['README.md'],
  codeSpellCheck: ["**/*.ts", "**/*.js"]
})
```

## Peril

If you're using Peril you can use both a global settings for org wide-spellchecking, and then have local additions to any
of the settings. This can make it easier to handle specific one off cases that feel a bit too unique to a single project.

Here is our Artsy setup where we do this:

* [Dangerfile for every PR](https://github.com/artsy/artsy-danger/blob/997d4fb7f4680973ac016eb75474ad15bf18c183/org/all-prs.ts#L7-L9)
* [Global Spellcheck for every repo](https://github.com/artsy/artsy-danger/blob/997d4fb7f4680973ac016eb75474ad15bf18c183/spellcheck.json)
* [A per-repo override for a specific repo](https://github.com/artsy/bearden/blob/1979379bb56dacb13593fbc90981ed88e1b097b3/spellcheck.json)

## Credits

This was created by [Orta Therox](https://twitter.com/orta) and [Yuki Nishijima](https://twitter.com/yuki24) in an amazing pairing session on cold thursday before an [Artsy Happy Hour](https://github.com/artsy/meta/blob/master/meta/happy_hour.md).

## Contributing

See [CONTRIBUTING.md](contributing.md).
