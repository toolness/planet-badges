var fs = require('fs');

var _ = require('underscore');
var FeedParser = require('feedparser');
var request = require('request');
var async = require('async');
var meta = require('./meta.json');
var RSS = require('juan-rss');
var Mustache = require('mustache');

var MAX_SIMULTANEOUS_REQUESTS = 10;
var MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
var MAX_ARTICLE_AGE = MS_PER_WEEK * 6;
var TIMEOUT = 20000;

var ORIGIN = process.env['ORIGIN'];
var SPREADSHEET_URL = process.env['SPREADSHEET_URL'];

if (!ORIGIN) {
  throw("Need to set ORIGIN in env to run build");
  process.exit(1);
}

function parseFeed(name, url, cb) {
  var earliestPublication = Date.now() - MAX_ARTICLE_AGE;
  var result = {
    name: name,
    error: null,
    meta: {},
    articles: []
  };

  request(url, {timeout: TIMEOUT})
    .on('error', function(error) {
      result.error = error;
      // FeedParser is automatically killed w/o emitting any additional
      // events, so we'll call the callback now.
      cb(null, result);
    })
    .pipe(new FeedParser())
    .on('error', function(error) {
      result.error = error;
      // FeedParser will still emit the 'end' event, so don't call the
      // callback yet.
    })
    .on('meta', function(meta) { meta.title = name; result.meta = meta; })
    .on('data', function(article) {
      if (article.pubdate.getTime() > earliestPublication)
        result.articles.push(article);
    })
    .on('end', function() { cb(null, result); });
}

function renderRSS(context) {
  // create the feed
  var feed = new RSS();

  feed.title = meta.title;
  feed.description = meta.description;
  feed.feed_url = ORIGIN + meta.feed_url;
  feed.site_url = ORIGIN;
  feed.image_url = ORIGIN + meta.image_url;
  feed.author = meta.author;

  // add the items
  _.each(context.articles, function(article) {
    feed.item({
      title: article.title,
      url: article.link,
      description: article.summary,
      date: article.pubdate
    });
    if (article.author) {
      feed['dc:creator'] = article.author;
    };
  });

  // write it out
  rss = feed.xml();
  fs.writeFileSync(__dirname + '/static' + meta.feed_url, rss);
}

function render(context) {
  _.extend(context, meta);
  renderRSS(context);
  var template = fs.readFileSync(__dirname + '/template/index.html', 'utf-8');
  var html = Mustache.render(template, context);

  fs.writeFileSync(__dirname + '/static/index.html', html);
}

function fetchFeeds(feeds) {
  async.parallelLimit(_.map(feeds, function(url, name) {
    return function(cb) {
      console.log('Fetching "' + name + '"...');
      parseFeed(name, feeds[name], function(err, result) {
        console.log('Processed "' + name + '".');
        cb(err, result);
      });
    }
  }), MAX_SIMULTANEOUS_REQUESTS, function(err, results) {
    if (err) throw err;

    var allArticles = _.flatten(_.pluck(results, 'articles'), true);
    allArticles = _.sortBy(allArticles, 'pubdate').reverse();

    console.log('Rendering...');

    render({
      articles: allArticles,
      feeds: results,
      pubdate: new Date()
    });

    console.log('Done.');
  });
}

if (SPREADSHEET_URL) {
  console.log('Fetching spreadsheet "' + SPREADSHEET_URL + '"...');
  require('tabletop').init({
    key: SPREADSHEET_URL,
    simpleSheet: true,
    callback: function(rows) {
      var feeds = {};
      rows.forEach(function(row) {
        if (row.name && /^https?:\/\//.test(row.feedurl))
          feeds[row.name] = row.feedurl;
      });
      fetchFeeds(feeds);
    }
  })
} else
  fetchFeeds(require('./feeds.json'));
