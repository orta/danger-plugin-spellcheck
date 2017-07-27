# danger-plugin-spellcheck

[![Build Status](https://travis-ci.org/orta/danger-plugin-spellcheck.svg?branch=master)](https://travis-ci.org/orta/danger-plugin-spellcheck)
[![npm version](https://badge.fury.io/js/danger-plugin-spellcheck.svg)](https://badge.fury.io/js/danger-plugin-spellcheck)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> Spell checks any created or modified markdown files in a GitHub PR using [node-markdown-spellcheck](https://github.com/lukeapage/node-markdown-spellcheck).

## Usage

Install:

```sh
yarn add danger-plugin-spellcheck --dev
```

At a glance:

```js
// dangerfile.js
import spellcheck from 'danger-plugin-spellcheck'

schedule(spellcheck())
```

## Changelog

See the GitHub [release history](https://github.com/orta/danger-plugin-spellcheck/releases).

## Contributing

See [CONTRIBUTING.md](contributing.md).
