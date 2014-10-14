
module.exports = MetaNPM

var fs        = require('fs')
var npm       = require('npm')
var async     = require('async')
var GithubAPI = require('github')
var ghparse   = require('github-url-to-object')
var nodegit   = require('nodegit')
var retry     = require('retry')
var _         = require('underscore')
var debug     = require('debug')('meta-npm')

function MetaNPM (opts, cb) {
  var self  = this
  self.opts = opts

  self.github = new GithubAPI({
    version: "3.0.0",
    // optional
    debug: false,
    timeout: 5000
  })

  self.github.authenticate({
    type: "basic",
    username: opts.username,
    password: opts.password
  })

  npm.load(null, cb)
}

MetaNPM.prototype.init = function (cb) {
  var self = this
  if (self.config) return

  try {
    self.config = JSON.parse(fs.readFileSync('meta-package.json'))
  } catch (e) {
    console.error("invalid meta-package.json", e)
    return cb(e)
  }

  cb(null)
}

MetaNPM.prototype.init = function (pkg, opts, cb) {
  var self = this
  opts = opts || {}

  parsePackage(pkg, opts, function (err, pkgs) {
    if (err) cb(err)

    console.log('found', pkgs.length, 'packages')

    // clone / fork each package as necessary
    async.eachLimit(pkgs, 4, function (pkg, cb) {
      if (pkg.user === self.opts.username) {
        self._clonePackage(pkg, opts, cb)
      } else {
        self.github.repos.getForks({
          user: pkg.user,
          repo: pkg.repo,
          per_page: 100
        }, function (err, forks) {
          if (err) forks = []
          forks = forks.filter(function (fork) { return fork.owner.login === self.opts.username })

          function cloneFork (fork) {
            pkg.user = fork.owner.login
            pkg.repo = fork.name
            pkg.https_url = fork.html_url
            self._clonePackage(pkg, opts, cb)
          }

          if (forks.length >= 1) {
            cloneFork(forks[0])
          } else {
            console.log("forking repo", pkg.user + "/" + pkg.repo)

            self.github.repos.fork({
              user: pkg.user,
              repo: pkg.repo
            }, function (err, repo) {
              if (err) return cb(err)

              process.nextTick(function () {
                cloneFork(repo)
              })
            })
          }
        })
      }
    }, function (err) {
      if (err) return cb(err)

      // npm link / install packages
      console.log("npm linking and installing all packages")
      async.eachLimit(pkgs, 4, function (pkg, cb) {
        // TODO
      })

      cb(null, pkgs)
    })
  })
}

MetaNPM.prototype._clonePackage = function (pkg, opts, cb) {
  var url = 'git://github.com/' + pkg.user + '/' + pkg.repo + '.git'
  console.log("cloning repo", url)

  var operation = retry.operation()
  operation.attempt(function () {
    nodegit.Repo.clone(url, pkg.repo, null, function (err, repo) {
      if (operation.retry(err)) return

      cb(err ? operation.mainError() : null, repo)
    })
  })
}

function parsePackage (pkg, opts, cb) {
  debug('parse', pkg)

  var v = pkg.indexOf('@')
  if (opts.blacklist && (pkg in opts.blacklist || (v >= 0 && pkg.substring(0, v) in opts.blacklist))) {
    return cb(null)
  }

  npm.commands.view([ pkg ], true, function (err, metadata) {
    if (err) return cb(err)

    var versions = Object.keys(metadata)
    metadata = metadata[versions[versions.length - 1]]

    if (!metadata || !metadata.repository) {
      return cb("no repository found for " + pkg)
    }

    if (metadata.repository.type !== 'git') {
      return cb("only github repositories supported; package " + pkg + " has unsupported type " + metadata.repository.type)
    }

    var repo = metadata.repository.url

    if (repo.indexOf('github.com') === -1) {
      return cb("only github git repositories supported; package " + pkg + " uses unsupported host " + repo)
    }

    var info = ghparse(repo)

    if (opts.users && opts.users.indexOf(info.user) < 0) {
      return cb("repository for package " + pkg + " not in whitelisted users")
    }

    var packages = [ info ]
    var packageMap = { }
    var deps = _.extend(metadata.dependencies, metadata.devDependencies)
    packageMap[info.https_url] = true

    if (!deps) return cb(null, packages)

    var dependencies = Object.keys(deps).map(function (key) {
      return {
        key: key,
        value: deps[key]
      }
    })

    opts.blacklist = opts.blacklist || {}

    dependencies.forEach(function (dep) {
      opts.blacklist[dep.key] = true
    })

    async.eachLimit(dependencies, 8, function (dep, cb) {
      var pkg = dep.key + '@' + dep.value
      var o = _.clone(opts)
      o.blacklist = _.clone(o.blacklist)
      delete o.blacklist[dep.key]

      parsePackage(pkg, o, function (err, pkgs) {
        if (!err && pkgs) {
          pkgs.forEach(function (pkg) {
            var url = pkg.https_url
            if (!(url in packageMap)) {
              packageMap[url] = true
              packages.push(pkg)
            }
          })
        }

        cb(null)
      })
    }, function (err) {
      if (err) return cb(err)
      cb(null, packages)
    })
  })
}
