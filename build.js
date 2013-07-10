var fs = require('fs');

var _ = require('underscore');
var FeedParser = require('feedparser');
var request = require('request');
var async = require('async');
var feeds = require('yamljs').load(__dirname + '/feeds.yml');
var nunjucks = require('nunjucks');

var MAX_SIMULTANEOUS_REQUESTS = 10;
var MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
var MAX_ARTICLE_AGE = MS_PER_WEEK * 6;

function parseFeed(name, url, cb) {
  var earliestPublication = Date.now() - MAX_ARTICLE_AGE;
  var result = {
    name: name,
    error: null,
    meta: {},
    articles: []
  };

  request(url)
    .pipe(new FeedParser())
    .on('error', function(error) { result.error = error; })
    .on('meta', function(meta) { meta.title = name; result.meta = meta; })
    .on('data', function(article) {
      if (article.pubdate.getTime() > earliestPublication)
        result.articles.push(article);
    })
    .on('end', function() { cb(null, result); });
}

function render(context) {
  var fsLoader = new nunjucks.FileSystemLoader(__dirname + '/template');
  var env = new nunjucks.Environment(fsLoader, {
    autoescape: true
  });
  var html = env.getTemplate('index.html').render(context);

  fs.writeFileSync(__dirname + '/static/index.html', html);
}

async.parallelLimit(_.map(feeds, function(url, name) {
  return parseFeed.bind(null, name, feeds[name]);
}), MAX_SIMULTANEOUS_REQUESTS, function(err, results) {
  if (err) throw err;

  var allArticles = _.flatten(_.pluck(results, 'articles'), true);
  allArticles = _.sortBy(allArticles, 'pubdate').reverse();

  render({
    articles: allArticles,
    feeds: results,
    pubdate: new Date()
  });
});
