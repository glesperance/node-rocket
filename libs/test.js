module.exports = test

test.completion = function (opts, cb) {
  if (opts.conf.argv.remain.length > 2) return cb(null, [])
  console.log("Yo");
}

function help (args, cb) {
  console.log("Yo");
}
