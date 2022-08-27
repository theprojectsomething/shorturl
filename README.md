A Simple Cloudflare Workers ShortURL Forwarder
===

Setup your own serverless personalised/bitly/tinyURL forwarder for free on Cloudflare Workers.

## Features
- set up on a sub-domain you already own (or register a slick new short domain) and use it for redirects, e.g. **som.au/github** => **github.com/theprojectsomething**
- the code is forwarding-domain agnostic, so domain names can be switched out without updating code
- takes a list of **direct** and **dynamic** routes (see the examples below) and **301 redirects** incoming requests
- pass a `?debug` search param to get a json response
- lists are currently static & defined in the worker

## Defining routes

Routes are currently defined and edited directly in the worker (**src/index.js**). There are two types of route:

1. **Direct routes**
These map directly from `[a.domain/tiny-path => b.domain/not/so-tiny/path]` based on an *exact match of the path*
2. **Dynamic routes**
  - These allow a path to be appended to a url, that can be inserted into the redirect url using a `$1` token, e.g.
    the dynamic route `[/tiny-path => b.domain/not/so-tiny/$1/path/]` redirects:
      -  **/tiny-path/dynamic?a=b** => **b.domain/not/so-tiny/dynamic/path/?a=b**
      -  **/tiny-path** => **404 Not found**
  - Redirect urls without a token simply append the path, e.g. the dynamic route `[/tiny-path => b.domain]` redirects:
      -  **/tiny-path/dynamic?a=b** => **b.domain/dynamic?a=b**
      -  **/tiny-path** => **404 Not found**
  - Note the second example in both cases above. If no path is appended to a dynamic route it will return a **404 Not found**. If you want to allow for this case use a direct route in addition to the dynamic one.

## Quick start: deployed to the cloud in <2mins

1. clone the repo:
```sh
git clone https://github.com/theprojectsomething/shorturl.git
cd shorturl
```
2. initialise the app to install wrangler:
```sh
npm init
```
3. add some routes to the worker (insert your favourite text editor here):
```sh
nano src/index.js
```
4. time to test your routes on localhost (try appending `?debug` to the end of your requests):
```
npx wrangler dev src/index.js
```
5. publish it to the cloud
```
npx wrangler publish
```

**And we're live on your workers subdomain! All that's left to do is [connect your custom domain](https://developers.cloudflare.com/workers/platform/routing/).**

## Potential improvements:
- lean on e.g. KV storage for route storage and lookup
- admin mode via e.g. basic auth / HMAC tokens
- API / web interface
- something else? Let me know!