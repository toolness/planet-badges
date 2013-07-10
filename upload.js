var fs = require('fs');

var async = require('async');
var knox = require('knox');
var staticDir = __dirname + '/static';
var client = knox.createClient({
  key: process.env.S3_KEY,
  secret: process.env.S3_SECRET,
  bucket: process.env.S3_BUCKET
});

function getFilesToUpload(baseDir, dir) {
  if (!dir) dir = '';

  var absDir = baseDir + '/' + dir;
  var files = [];

  fs.readdirSync(absDir).forEach(function(filename) {
    var relPath = dir + '/' + filename;
    var absPath = absDir + '/' + filename;
    if (fs.statSync(absPath).isDirectory())
      files.push.apply(files, getFilesToUpload(baseDir, relPath));
    else
      files.push(relPath);
  });

  return files;
}

console.log("uploading to bucket " + client.bucket);

async.forEachSeries(getFilesToUpload(staticDir), function(path, cb) {
  console.log("uploading", path);
  client.putFile(staticDir + path, path, {'x-amz-acl': 'public-read'}, cb);
}, function(err) {
  if (err) throw err;
  console.log("done.");
});
