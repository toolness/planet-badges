var fs = require('fs');
var cheerio = require('cheerio');

var STATIC_DIR = __dirname + '/static';

function main() {
  var html = fs.readFileSync(STATIC_DIR + '/index.html', 'utf-8');
  var $ = cheerio.load(html);
  $('html')
    .attr('manifest', '/planet.appcache')
    .append($('<script src="offline.js"></script>'));
  var offlineHtml = $.html();
  fs.writeFileSync(STATIC_DIR + '/planet.appcache', [
    'CACHE MANIFEST',
    '# ' + new Date(),
    'CACHE:',
    '/offline/index.html'
  ].concat($('link[rel=stylesheet]').map(function() {
    return $(this).attr('href') || '';
  }).get()).concat($('img').map(function() {  
    return $(this).attr('src') || '';
  }).get()).join('\n'));
  fs.writeFileSync(STATIC_DIR + '/offline/index.html', offlineHtml);
}

if (!module.parent)
  main();
