# LibHub

:warning: This library is no longer used by https://libraries.io or maintained :warning:

Libraries.io minimalistic GitHub client.

## Features

 - Dead simple API
 - Promise based
 - Support for caching + [conditional requests](https://developer.github.com/v3/#conditional-requests) (optional)
 - Support for pagination using [link headers](https://developer.github.com/v3/#link-header)

## Requirements

 - Node.js v4.2.x

## Getting Started

```javascript
  const Client = require('libhub')
  let github = new Client(token)

  // GET
  github.get(`/repos/librariesio/libhub/issues`)
  .then( (issues) => {
    console.log(issues)
  })

  // POST
  github.post(`/repos/librariesio/libhub/issues`, {}, issueBody)
  .then( (issue) => {
    console.log(issue)
  })

```

Available methods: `get`, `post`, `patch`, `put`, `delete`


### Error handling

```javascript
  // 3xx/4xx/5xx errors
  github.get(`/repos/librariesio/${invalidId}`)
  .then( (repo) => {
    // This won't happen
  })
  .catch( (err) => {
    console.log(err.statusCode) // 404
  })
```

## Caching

  The Client constructor takes an optional cache object that should have a `get` and a `set` method. Both should return a Promise.

```javascript
  const Client = require('libhub')
  const InMemoryCache = require('./test/cache')
  let github = new Client(token, { cache: InMemoryCache })

  github.get(`/repos/librariesio/libhub/issues`)
  .then( (issues) => {
    console.log(issues)
  })
```

## Pagination

```javascript
  github.get(`/events`, { allPages: true })
  .then( (events) => {
    console.log(events.length) // All the user public events ~300
  })
```

## Why another GitHub client?

Well, simplicity. Most GitHub clients I used implement unnecessary abstractions. For example, [octonode](https://github.com/pksunkara/octonode#create-a-reference-post-repospksunkarahubgitrefs). This means that you need to check GitHub API documentation **and** Octonode documentation to perform any action. This gets boring pretty quickly.

With LibHub, you just need to lookup the resource URL and use it. Also, ES6 interpolation.

```javascript
  github.get(`/repos/${owner}/${repo}/branches/${branch}`)
```

## License

MIT
