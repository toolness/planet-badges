This is a simple planet-style feed aggregator that fetches feeds via
[node-feedparser][] and generates a static site using [nunjucks][].

The process of feed aggregation, static site generation and
deployment to S3 was designed to be easy to run on Heroku as a single worker
dyno that executes at regular intervals via [Heroku Scheduler][]. However,
it can just as easily be configured as a `cron` job, or run through other
means.

## Building The Site

Set the environment variable `ORIGIN` to the base url that the site is
served from. Example, `export ORIGIN='http://planet.openbadges.org'`.
Note, should include the protocol, and not end in a trailing slash.

Run `node build.js`, which will fetch feeds and create the
planet site in the `static` directory.

## Uploading The Site To S3

You can upload the site to S3 by setting the `S3_KEY`, `S3_SECRET`, and
`S3_BUCKET` environment variables to reasonable values and then running
`node upload.js`.

## Managing Feeds

Feeds can be Atom or RSS. You can manage the list of feeds using a JSON
file in the repository, or via a Google Spreadsheet. Both options are
mutually exclusive: if the `SPREADSHEET_URL` environment variable is
non-empty, then the Google Spreadsheet will be preferred over JSON.

### Using JSON

Just edit `feeds.json`, adding or removing entries as necessary.

### Using Google Spreadsheets

First, import `feeds.example.csv` into a new Google Spreadsheet. Then
go to the "File" menu in Google Spreadsheets and choose "Publish to the web";
check the "Automatically republish when changes are made" box, and copy the
link to the published data into the `SPREADSHEET_URL` environment variable.

Do not change the very first row of the spreadsheet (i.e., the column names).
Other than that, feel free to add or remove rows as necessary.

## Security

Currently, the code doesn't sanitize the HTML coming from the feeds, so either
host the static site on its own domain or make sure you're only pulling
content from trusted sources. Or, fork the code and add sanitization!

  [node-feedparser]: https://github.com/danmactough/node-feedparser#readme
  [nunjucks]: http://nunjucks.jlongster.com/
  [Heroku Scheduler]: https://devcenter.heroku.com/articles/scheduler
