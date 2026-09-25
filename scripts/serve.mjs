/**
 * Serves the production build the way GitHub Pages does, for the end-to-end tests and local checks.
 *
 *   npm run build && npm run serve             # http://localhost:4173/livery/
 *   BASE_PATH=/my-fork/ npm run serve          # a build made with the same BASE_PATH
 *
 * Like Pages: the site lives under /<repository>/, `/page` also finds `page.html`, a directory without a
 * trailing slash redirects to one, and anything else gets 404.html with status 404.
 */
import {createReadStream, existsSync, readFileSync} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, join, normalize, sep} from 'node:path';
import {createGzip} from 'node:zlib';

const ROOT = join(import.meta.dirname, '..', 'apps', 'shell', 'dist');
const BASE = process.env.BASE_PATH ?? '/livery/';
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

function assertBuild() {
  const index = join(ROOT, 'index.html');
  const problems = [];

  if (!existsSync(index)) {
    problems.push('there is no production build');
  } else if (!readFileSync(index, 'utf8').includes(`src="${BASE}assets/`)) {
    problems.push(`the build was not made for ${BASE} (build and serve with the same BASE_PATH)`);
  }
  if (existsSync(index) && !existsSync(join(ROOT, '404.html'))) {
    problems.push('404.html is missing');
  }
  if (problems.length > 0) {
    console.error(`✖ Can't serve ${ROOT}: ${problems.join('; ')}.\n  Run \`npm run build\` first.`);
    process.exit(1);
  }
}

async function isFile(path) {
  return (await stat(path).catch(() => null))?.isFile() ?? false;
}

async function resolveFile(pathname) {
  const relative = normalize(decodeURIComponent(pathname.slice(BASE.length)));
  const target = join(ROOT, relative);

  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    return {status: 404, file: join(ROOT, '404.html')};
  }
  if (await isFile(join(target, 'index.html'))) {
    return pathname.endsWith('/') ? {status: 200, file: join(target, 'index.html')} : {redirect: `${pathname}/`};
  }
  for (const candidate of [target, `${target}.html`]) {
    if (await isFile(candidate)) {
      return {status: 200, file: candidate};
    }
  }
  return {status: 404, file: join(ROOT, '404.html')};
}

assertBuild();

createServer((request, response) => {
  void (async () => {
    const {pathname} = new URL(request.url ?? '/', 'http://localhost');

    if (`${pathname}/` === BASE) {
      response.writeHead(301, {location: BASE}).end();
      return;
    }
    if (!pathname.startsWith(BASE)) {
      response.writeHead(404, {'content-type': 'text/plain'}).end('Not found');
      return;
    }

    const result = await resolveFile(pathname);

    if ('redirect' in result) {
      response.writeHead(301, {location: result.redirect}).end();
      return;
    }

    const type = TYPES[extname(result.file)] ?? 'application/octet-stream';
    const gzip =
      /text|javascript|json|svg|manifest/.test(type) && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');
    response.writeHead(result.status, {
      'content-type': type,
      ...(gzip ? {'content-encoding': 'gzip', vary: 'accept-encoding'} : {}),
    });
    const stream = createReadStream(result.file);
    (gzip ? stream.pipe(createGzip()) : stream).pipe(response);
  })();
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}${BASE}`);
});
