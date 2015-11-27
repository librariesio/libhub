/* eslint-env mocha */
'use strict'

require('sepia')

const Client = require('../libhub')
const InMemoryCache = require('./cache')
const assert = require('assert')
const sinon = require('sinon')

const TOKEN = process.env.TOKEN

describe('GitHub client', () => {

  var gistId

  it('POST', (done) => {
    let gh = new Client(TOKEN)
    let newGist = {
      public: false,
      files: { "file1.txt": { content: "String file contents" } }
    }
    
    gh.post(`/gists`, {}, newGist)
    .then( (gist) => {
      assert(gist)
      assert.deepEqual(Object.keys(gist.files).length, 1)
      assert.deepEqual(gist.files['file1.txt'].content, 'String file contents')
      gistId = gist.id
    })
    .then( () => done() )
    .catch(done)
  })

  it('GET', (done) => {
    let gh = new Client(TOKEN)
    
    gh.get(`/gists/${gistId}`)
    .then( (gist) => {
      assert(gist)
      assert.deepEqual(gist.files['file1.txt'].content, 'String file contents')
      gistId = gist.id
    })
    .then( () => done() )
    .catch(done)
  })

  it('GET with cache', (done) => {
    let gh = new Client(TOKEN, {cache: InMemoryCache})

    sinon.spy(InMemoryCache, 'get');
    sinon.spy(InMemoryCache, 'set');
   
    gh.get(`/gists/${gistId}`)
    .then( (gist) => {
      assert.deepEqual(InMemoryCache.get.callCount, 1);
      assert.deepEqual(InMemoryCache.set.callCount, 1);

      assert(gist)
      assert.deepEqual(gist.files['file1.txt'].content, 'String file contents')
    })
    .then( () => gh.get(`/gists/${gistId}`) )
    .then( (gist) => {
      assert.deepEqual(InMemoryCache.get.callCount, 3);

      assert(gist)
      assert.deepEqual(gist.files['file1.txt'].content, 'String file contents')
    })
    .then( () => done() )
    .catch(done)
  })


  it('PATCH', (done) => {
    let gh = new Client(TOKEN)
    let updatedGist = {
      files: { "file1.txt": { content: "String file updated" } }
    }
    
    gh.patch(`/gists/${gistId}`, {}, updatedGist)
    .then( (gist) => {
      assert(gist)
      assert.deepEqual(gist.files['file1.txt'].content, 'String file updated')
    })
    .then( () => done() )
    .catch(done)
  })

  it('PUT', (done) => {
    let gh = new Client(TOKEN)
    
    gh.put(`/gists/${gistId}/star`)
    .then( () => done() )
    .catch(done)
  })

  it('DELETE', (done) => {
    let gh = new Client(TOKEN)
    
    gh.delete(`/gists/${gistId}`)
    .then( () => done() )
    .catch(done)
  })

  it('GET all pages', function(done) {
    this.timeout(5000)

    let gh = new Client(TOKEN)
    
    gh.get(`/events`, { allPages: true })
    .then( (events) => {
      assert(events.length > 100) // Greater than the max per_page
    })
    .then( () => done() )
    .catch(done)
  })

  it('GET 404/5xx should throw', (done) => {
    let gh = new Client(TOKEN)

    gh.get(`/gists/invalid`)
    .catch( (err) => {
      assert.deepEqual(404, err.statusCode)
      done()
    })
  })

})
