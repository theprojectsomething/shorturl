/**
 * A Simple Cloudflare Workers ShortURL Redirector
 * ===
 * 
 * - takes a list of direct and dynamic routes (examples below) and redirects requests
 * - pass a ?debug search param to get a json response
 * - list is currently static & defined in this file
 *
 * Potential improvements:
 * - lean on e.g. a static git-managed JSON or KV storage for route lookup
 * - admin mode via e.g. basic auth / HMAC tokens
 * - API / web interface
 */

// include any directly mapped routes
// e.g: ['/a', 'https://b.c/d']
//        /a => https://b.c/d
//        /a/b => [no match]
//        /ab => [no match]
const direct = new Map([
  ['/', 'https://theprojectsomething.com'],
  ['/cv', 'https://cv.theprojectsomething.com'],
  ['/github', 'https://github.com/theprojectsomething'],
  ['/codepen', 'https://codepen.io/theprojectsomething'],
]);

// include any routes that take a basepath and a dynamic endpoint
// anything after the basepath must be prefixed with a "/"
// e.g: ['/a', 'https://b.c/d']
//        /a/e/f => https://b.c/d/e/f
//        /a/x?y=z => https://b.c/d/x?y=z
//        /a => https://b.c/d [no match] (you should include a direct route map to catch "/a")
//        /ab => [no match]
// And with dynamic (and required!) path placement
//      ['/a', 'https://b.c/$1/e']
//        /a/d/e => https://b.c/d/e/f (note that double slashes are accounted for)
const startsWith = new Map([
  ['/gh', 'https://github.com/theprojectsomething'],
  ['/pen', 'https://codepen.io/theprojectsomething/pen'],
]);

function getRoute(pathname) {

  // check path for a direct match
  if (direct.has(pathname)) {
    return direct.get(pathname);
  }

  // check path for a startsWith match
  for (const [prefix, route] of startsWith) {

    // check if prefix matches directly or doesn't match at all
    // we add a slash to ensure path "/a/b" matches route "/a" but path "/ab" doesn't
    // note the prefix should never end with a slash, so concat is safe
    // also note we don't allow direct matches with startsWith, use a direct route instead
    if (pathname === prefix || !pathname.startsWith(prefix + '/')) {
      continue;
    }

    // now to check if we need dynamic replacement
    if (route.includes('$1')) {
      // first place the prefix-less path into the route
      return route.replace(/\$1/, pathname.slice(prefix.length + 1))
      // then do a straightup search and replace for double-slashes (allowing for protocol)
      // this saves a bunch of complexity with route declaration and slashes
      .replace(/([^:])\/\//g, '$1/');
    }

    // it's not a dynamic route
    // add the path to the end, or return the route directly where there's no path
    return `${route}/${pathname.slice(prefix.length + 1)}`;
  }
}

export default {
	async fetch(request) {
    const { pathname, search } = new URL(request.url);
    const location = getRoute(pathname);

    // requests with ?debug appended get a JSON response
    const searchParams = search ? new URLSearchParams(search) : null;
    if (searchParams?.has('debug')) {
      // remove debug for the response
      searchParams.delete('debug');

      // convert any remaining params to a search string
      const searchAmended = searchParams.toString();
      return new Response(JSON.stringify({
        // set the location, appending the ?search only if it has params
        location: location?.concat(searchAmended ? `?${searchAmended}` : ''),
        status: location ? 301 : 404,
      }, null, '  '), {
        status: location ? 200 : 404,
        headers: { 'content-type': 'application/json;charset=UTF-8' },
      });
    }

    // redirect or return a 404
    return location
    ? Response.redirect(location + search, 301)
    : new Response('not found', { status: 404 });
	},
};
