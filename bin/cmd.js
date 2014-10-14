#!/usr/bin/env node

var chalk = require('chalk')
var minimist = require('minimist')
var MetaNPM = require('../')
var fs = require('fs')

function usage () {
  console.log('Usage: meta-npm [OPTIONS] [COMMAND] [COMMAND-ARGS]')
  console.log('TODO')
}

var argv = minimist(process.argv.slice(2), {
  alias: {
    n: 'no-quit',
    q: 'quiet',
    h: 'help',
    v: 'version',
    w: 'whitelist',
    u: 'username',
    p: 'password'
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

/* meta-npm create webtorrent
 * meta-npm fetch
 * meta-npm pull
 * meta-npm push
 * meta-npm pull-request
 *
 */

var command = argv._[0]

if (!command) {
  usage()
  process.exit(1)
}

var metaNPM = new MetaNPM({
  username: argv.username,
  password: argv.password
}, function (err) {
  if (command === 'create') {
    metaNPM.create(argv._[1], {
      users: argv.whitelist.split(',')
    }, function (err) {
      if (err) {
        console.error(err)
        usage()
        process.exit(1)
      } else {
        process.exit(0)
      }
    })
  }
})

