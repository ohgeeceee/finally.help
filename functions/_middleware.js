// Canonical-host redirect. Any request that arrives on a non-primary hostname
// (finallymakesense.com, its www, or www.finally.help) is 301-redirected to the
// canonical https://finally.help/<same-path>. All finally.help traffic passes
// through untouched. Runs ahead of every asset and API route.

const CANONICAL = "finally.help";
const REDIRECT_HOSTS = new Set([
  "finallymakesense.com",
  "www.finallymakesense.com",
  "www.finally.help",
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (REDIRECT_HOSTS.has(url.hostname.toLowerCase())) {
    url.hostname = CANONICAL;
    url.protocol = "https:";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
