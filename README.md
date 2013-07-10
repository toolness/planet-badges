This is a simple planet-style feed aggregator that fetches feeds via
[node-feedparser][] and generates a static site using [nunjucks][].

The process of feed aggregation, static site generation and
deployment to S3 was meant to be easy to run on Heroku as a single worker
dyno that runs at regular intervals via [Heroku Scheduler][].

## Building The Site

Just run `node build.js`, which will fetch feeds and create the
planet site in the `static` directory.

## Uploading The Site To S3

You can upload the site to S3 by setting the `S3_KEY`, `S3_SECRET`, and
`S3_BUCKET` environment variables to reasonable values and then running
`node upload.js`.

## Adding A Feed

Just add an entry to `feeds.yml`. The feed can be Atom or RSS.

  [node-feedparser]: https://github.com/danmactough/node-feedparser#readme
  [nunjucks]: http://nunjucks.jlongster.com/
  [Heroku Scheduler]: https://devcenter.heroku.com/articles/scheduler
