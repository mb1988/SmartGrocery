if (!self.define) {
  let e,
    s = {};
  const t = (t, n) => (
    (t = new URL(t + ".js", n).href),
    s[t] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = t), (e.onload = s), document.head.appendChild(e));
        } else ((e = t), importScripts(t), s());
      }).then(() => {
        let e = s[t];
        if (!e) throw new Error(`Module ${t} didn’t register its module`);
        return e;
      })
  );
  self.define = (n, a) => {
    const i = e || ("document" in self ? document.currentScript.src : "") || location.href;
    if (s[i]) return;
    let c = {};
    const u = (e) => t(e, i),
      r = { module: { uri: i }, exports: c, require: u };
    s[i] = Promise.all(n.map((e) => r[e] || u(e))).then((e) => (a(...e), c));
  };
}
define(["./workbox-4754cb34"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/_next/app-build-manifest.json", revision: "a8c6cbf6a209b53971a12674940c921f" },
        { url: "/_next/static/chunks/117-59e030f1b0f89043.js", revision: "u56t5Lab0zuVVdHYYWBv0" },
        { url: "/_next/static/chunks/448-4653f1415747f08a.js", revision: "u56t5Lab0zuVVdHYYWBv0" },
        {
          url: "/_next/static/chunks/app/_not-found/page-9042a24b4e105126.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/app/layout-534233386fc3b680.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/app/lists/%5Bid%5D/page-25d9e4d2d0b80ce5.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/app/lists/page-463b73337585d328.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/app/page-0a8b9a7b052e6eac.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/app/shop/%5BlistId%5D/page-f948187c5349801f.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/fd9d1056-42a1c2df9c4a85a8.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/framework-f66176bb897dc684.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/main-app-4f8f5a29c7f81291.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        { url: "/_next/static/chunks/main-ce2d49347adb81ed.js", revision: "u56t5Lab0zuVVdHYYWBv0" },
        {
          url: "/_next/static/chunks/pages/_app-72b849fbd24ac258.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/pages/_error-7ba65e1336b92748.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-2675052e5229cb88.js",
          revision: "u56t5Lab0zuVVdHYYWBv0",
        },
        { url: "/_next/static/css/71d1b9d180eb2164.css", revision: "71d1b9d180eb2164" },
        {
          url: "/_next/static/media/4473ecc91f70f139-s.p.woff",
          revision: "78e6fc13ea317b55ab0bd6dc4849c110",
        },
        {
          url: "/_next/static/media/463dafcda517f24f-s.p.woff",
          revision: "cbeb6d2d96eaa268b4b5beb0b46d9632",
        },
        {
          url: "/_next/static/u56t5Lab0zuVVdHYYWBv0/_buildManifest.js",
          revision: "c155cce658e53418dec34664328b51ac",
        },
        {
          url: "/_next/static/u56t5Lab0zuVVdHYYWBv0/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        { url: "/manifest.json", revision: "ee756b129f4e787cb66c7ca012c20ca2" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: s, event: t, state: n }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, { status: 200, statusText: "OK", headers: s.headers })
                : s,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 })],
      }),
      "GET"
    ));
});
