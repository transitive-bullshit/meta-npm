# meta-npm [![travis](https://img.shields.io/travis/fisch0920/meta-npm.svg)](https://travis-ci.org/fisch0920/meta-npm) [![npm](https://img.shields.io/npm/v/meta-npm.svg)](https://npmjs.org/package/meta-npm) [![downloads](https://img.shields.io/npm/dm/meta-npm.svg)](https://npmjs.org/package/meta-npm)

#### Meta package manager for managing projects comprised of many npm modules

Node and npm encourage the use of small, reusable modules, and many npm authors have [embraced](http://substack.net/how_I_write_modules) this approach. Large node projects are now commonly broken up into dozens of isolated submodules and their respective repositories, which is great from software engineering standpoint, but this fragmentation can make it more difficult to develop on and contribute to the project as a whole.

`meta-npm` is a meta npm package manager designed to solve this problem by allowing you to easily checkout a top-level project and all of its dependencies, creating any forks as neccessary and handling `npm link`ing them together for local development. It also makes synchronizing changes to the submodules a breeze both on github and the npm registry.

## install

```
npm install meta-npm
```

## usage

TODO

## todo

* ~~Create project.~~
* Decide on project structure.

## license

MIT. Copyright (c) Travis Fischer.
