var levelRest = require('level-rest-parser')
var extend = require('extend')
var transports = require('transport-stream')
var concat = require('concat-stream')
var url = require('url')
var hyperquest = require('hyperquest')
var datPing = require('dat-ping')
var debug = require('debug')('api/metadat')

var schema = require('./metadat.json')

module.exports = function (db, opts) {
  if (!opts) opts = {}
  if (!opts.schema) opts.schema = schema

  var model = levelRest(db, opts)

  var metadat = {}
  extend(metadat, model) // inheritance

  metadat.authorize = function (opts, userData, cb) {
    var params = opts.params
    // if it doesnt have an id we dont need to do custom authorization
    if (!params.id) return cb(null, userData)

    // only allow users to edit their own data
    model.get({id: params.id}, function (err, meta) {
      // if not exists then skip authorization
      if (err) return cb(null, userData)
      // ensure only owner can edit
      if (meta.owner_id !== userData.user.handle) return cb(new Error('action not allowed'))
      else cb(null, userData)
    })
  }

  metadat.put = function (data, opts, cb) {
    if (data.refresh) {
      model.get({id: data.id}, function (err, data) {
        if (err) return cb(err)
        refresh(data, opts, function (err, metadat) {
          // we dont care about the error, it is updated in the status
          model.put(metadat, opts, cb)
        })
      })
    }
    else model.put(data, opts, cb)
  }

  metadat.post = function (data, opts, cb) {
    var self = this
    self.indexes['url'].find(data.url, function (err, rows) {
      if (err) return cb(err)
      if (rows.length > 0) return cb(new Error('Someone has already published a dat with that url'))

      metadat.indexes['owner_id'].find(data.owner_id, function (err, rows) {
        if (err) return cb(err)
        if (rows.length > 0) {
          for (i in rows) {
            var row = rows[i]
            if (row.name == data.name) {
              return cb(new Error('You have already published a dat with that name'))
            }
          }
        }
        refresh(data, opts, function (err, metadat) {
          if (err) return cb(err)

          if (!metadat.name || !metadat.description) {
            return cb(new Error('Requires a name and description.'))
          }

          model.post(metadat, opts, cb)
        })
      })
    })
  }

  function unreachable (err) {
    return (err.message.indexOf('ENOENT') > -1 || err.message.indexOf('ECONNREFUSED') > -1)
  }

  function authentication (err) {
    return (err.level === 'client-authentication')
  }

  function refresh (metadat, opts, cb) {
    datPing(metadat.url, function (err, status) {
      if (err) {
        if (authentication(err)) {
          err.message = 'Authentification failed.'
        }
        else if (unreachable(err)) {
          err.message = 'Dat unreachable.'
        }
      }
      metadat.error = err || undefined
      if (!err) metadat.status = status
      metadat.last_updated = new Date().toISOString()
      metadat.description = metadat.status.dat.description || 'No description'
      metadat.readme = metadat.status.dat.readme || '# No readme'
      console.log('new metadat:', metadat)
      return cb(err, metadat)
    })

  }

  return metadat
}
