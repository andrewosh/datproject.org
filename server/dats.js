const Archiver = require('hypercore-archiver')
const mkdirp = require('mkdirp')
const encoding = require('dat-encoding')
const hyperdrive = require('hyperdrive')
const ram = require('random-access-memory')
const Swarm = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')

module.exports = Dats

function Dats (dir) {
  if (!(this instanceof Dats)) return new Dats(dir)
  mkdirp.sync(dir)
  this.archiver = Archiver({dir: dir})
  this.swarm = createSwarm(this.archiver)
  this.archives = {}
}

Dats.prototype.get = function (key, opts, cb) {
  if (typeof opts === 'function') return this.get(key, {}, opts)
  var self = this
  key = encoding.toStr(key)
  var buf = encoding.toBuf(key)
  self.archiver.add(buf, function (err) {
    if (err) return cb(err)
    self.archiver.get(buf, {wait: !!opts.timeout, timeout: opts.timeout}, function (err, metadata, content) {
      if (err) return cb(err)
      var archive = hyperdrive(ram, buf, {metadata: metadata, content: content})
      return cb(null, archive)
    })
  })
}

Dats.prototype.metadata = function (archive, opts, cb) {
  if (typeof opts === 'function') return this.metadata(archive, {}, opts)
  var dat
  if (!archive.content) dat = {}
  else {
    dat = {
      peers: archive.content.peers.length,
      size: archive.content.byteLength
    }
  }
  var cancelled = false

  var timeout = setTimeout(function () {
    var msg = 'timed out'
    if (cancelled) return
    cancelled = true
    return cb(new Error(msg), dat)
  }, opts.timeout)

  function done (err, dat) {
    clearTimeout(timeout)
    if (cancelled) return
    cancelled = true
    return cb(err, dat)
  }

  archive.tree.list('/', {nodes: true}, function (err, entries) {
    for (var i in entries) {
      var entry = entries[i]
      entries[i] = entry.value
      entries[i].name = entry.name
      entries[i].type = 'file'
    }
    dat.entries = entries
    dat.peers = archive.content.peers.length
    if (err || cancelled) return done(err, dat)
    var filename = 'dat.json'
    archive.stat(filename, function (err, entry) {
      if (err || cancelled) return done(null, dat)
      archive.readFile(filename, function (err, metadata) {
        if (err || cancelled) return done(err, dat)
        try {
          dat.metadata = metadata ? JSON.parse(metadata.toString()) : undefined
        } catch (e) {
        }
        dat.size = archive.content.byteLength
        return done(null, dat)
      })
    })
  })
}

Dats.prototype.close = function (cb) {
  this.swarm.close(cb)
}

function createSwarm (archiver, opts) {
  if (!archiver) throw new Error('hypercore archiver required')
  if (!opts) opts = {}

  var swarmOpts = swarmDefaults({
    hash: false,
    stream: function () {
      return archiver.replicate()
    }
  })
  var swarm = Swarm(swarmOpts)

  archiver.changes(function (err, feed) {
    if (err) throw err
    swarm.join(feed.discoveryKey)
  })

  archiver.list().on('data', function (key) {
    serveArchive(key)
  })
  archiver.on('add', serveArchive)
  archiver.on('remove', function (key) {
    swarm.leave(archiver.discoveryKey(key))
  })

  return swarm

  function serveArchive (key) {
    var hex = archiver.discoveryKey(key)
    swarm.join(hex)
  }
}
