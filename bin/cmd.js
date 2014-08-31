#!/usr/bin/env node

var chalk = require('chalk')
var minimist = require('minimist')
var MetaNPM = require('../')
var fs = require('fs')

function usage () {
  console.log('Usage: meta-npm [OPTIONS]')
  console.log('TODO')
}

var argv = minimist(process.argv.slice(2), {
  alias: {
    n: 'no-quit',
    q: 'quiet',
    h: 'help',
    v: 'version'
  },
  boolean: [ // options that are always boolean
    'quiet',
    'help',
    'version'
  ]
})

if (argv.help || process.argv.length === 2) {
  usage()
  process.exit(0)
}

if (argv.version) {
  console.log(require('../package.json').version)
  process.exit(0)
}

