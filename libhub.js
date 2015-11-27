'use strict'

const parseLink  = require('parse-link-header')
const rp         = require('request-promise')
const Promise    = require('bluebird')

const HOST = 'api.github.com'

class Client {
  constructor(token, opts) {
    opts = opts || {}

    this.token = token
    this.host = opts.host || HOST
    this.ghclient = opts.ghclient || process.env.GHCLIENT
    this.ghsecret = opts.ghsecret || process.env.GHSECRET

    this.cache = opts.cache 
  }

  get(path, query) {
    query = query || {}

    return this.fetch(path, query)
    .then( (res) => {

      if (!query.allPages) return res.body

      let pages = parseLink(res.headers.link)
      let lastPage = parseInt(pages.last.page)

      let page = 1
      let requests = []
      while (page < lastPage) {
        page += 1
        query.page = page
        requests.push(this.fetch(path, query))
      }

      // Fetch all pages concurrently
      return Promise.all(requests)
      .then( (values) => {
        return values.reduce( (accum, page) => {
          return accum.concat(page.body)
        }, res.body)
      })
    })
  }

  prepareOptions(method, path, query, body) {
    path = encodeURI(path)
    query = query || {}
    
    let opts = {
      url:      `https://${this.host}${path}`,
      qs:       query,
      method:   method,
      body:     body,
      json:     true,

      // Option for request-promise to return body+headers
      resolveWithFullResponse: true,

      headers:  {
        'User-Agent':   'LibHub',
        'Content-Type': 'application/json',
        'Accept':       'application/vnd.github.v3+json'
      }
    }

    if (this.token) {
      opts.headers['Authorization'] = `token ${this.token}`
    } else {
      query.client_id = this.ghclient
      query.client_secret = this.ghsecret
    }

    return opts
  }

  fetch(path, query) {
    query.page = query.page || 1
    query.per_page = query.per_page || 100

    let opts = this.prepareOptions('GET', path, query)

    if (!this.cache) return rp(opts)

    // Generate a cache hash for the request
    let hash = `${this.token}:${opts.path}:${JSON.stringify(query)}`

    // Get ETag and use it if present
    return this.cache.get(`res:${hash}`)
    .then( (cached) => {
      if (cached) {
        let res = JSON.parse(cached)
        opts.headers['If-None-Match'] = res.headers.etag
      }
      return rp(opts)
    })

    // If we get 200, process and cache the response
    .then( (res) => {

      let response = {
        headers: res.headers,
        body:    res.body
      }

      return this.cache.set(`res:${hash}`, JSON.stringify(response))
      .then( () => response)
    })

    // If we don't get a 200, check if it's a 304 cache hit or throw
    .catch( (err) => {
      if (err.statusCode !== 304) throw err

      return this.cache.get(`res:${hash}`)
      .then( (cached) => JSON.parse(cached) )

    })
  }
}

['POST', 'PUT', 'PATCH', 'DELETE'].forEach( (method) => {
  Client.prototype[method.toLowerCase()] = function(path, query, body) {
    let opts = this.prepareOptions(method, path, query, body)
    return rp(opts).then( (res) => res.body )
  }
})

module.exports = Client
