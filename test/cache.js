'use strict'

var cache = {}

function get(key) {
  return Promise.resolve(cache[key])
}

function set(key, value) {
  cache[key] = value
  return Promise.resolve(value)
}

module.exports = {
  get: get,
  set: set
}
