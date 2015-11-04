var nixt = require('nixt')
var should = require('should')
var pkg = require('../package.json')

var surge = 'node ' + pkg.bin + ' '
var opts = {
  colors: false,
  newlines: true
}

describe('plus', function () {

  var subdomain = ''

  beforeEach(function (done) {
    this.timeout(5000)

    nixt(opts)
      .exec(surge + 'logout -e localhost:5001') // Logout before the test starts
      .run(surge + ' -e localhost:5001')
      .on(/.*email:.*/).respond('kenneth+test@chloi.io\n')
      .on(/.*password:.*/).respond('12345\n')
      .on(/.*project path:.*/).respond('./test/fixtures/cli-test.surge.sh\n')
      .on(/.*domain:.*/).respond('\n')
      .expect(function (result) {
        subdomain = result.stdout.split('Project is published and running at')[1].trim()
      })
      .end(done)
  })

  it('`surge plus`', function (done) {
    this.timeout(10000)

    nixt(opts)
      .run(surge + 'plus -e localhost:5001')
      .on(/.*domain:.*/).respond(subdomain + '\n')
      .on(/.*Would you like to charge.*/).respond('yes\n')
      // .on(/.*card number:.*/).respond('4242-4242-4242-4242\n')
      // .on(/.*exp \(mo\/yr\):.*/).respond('01/19\n')
      // .on(/.*cvc:.*/).respond('012')
      .expect(function (result) {
        should(result.stdout).match(/plan: Plus/)
        should(result.stdout).match(/You are now upgraded to Plus!/)
        should(result.stdout).not.match(/plan: Free/)
        should(result.stdout).not.match(/invalid/)
        should(result.stdout).not.match(/Please try again\./)
      })
      .end(done)
  })

  it('`surge ssl`', function (done) {
    this.timeout(10000)

    nixt(opts)
      .run(surge + '-e localhost:5001 ssl ' + subdomain)
      .on(/.*pem file:.*/).respond('./test/fixtures/ssl/test.pem\n')
      .on(/.*Would you like to charge.*/).respond('yes\n')
      .expect(function (result) {
        should(result.stdout).not.match(/No such file or directory/)
        should(result.stdout).not.match(/invalid/)
        should(result.stdout).not.match(/Please try again\./)
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/applied/)
      })
      .end(done)
  })

  // TODO This doesn’t respond with the existing result + `\n` right now
  // it('`surge ssl` with `CNAME` file', function (done) {
  //   nixt(opts)
  //     .run(surge + '-e localhost:5001 ssl --project ./test/fixtures/cli-test-6.surge.sh')
  //     .on(/.*domain:.*/).respond('\n')
  //     .expect(function (result) {
  //     })
  //     .end(done)
  // })

  // it('`surge ssl --domain` with no arg', function (done) {
  //   this.timeout(5000)
  //
  //   nixt(opts)
  //     .run(surge + '--endpoint localhost:5001 ssl --domain\n')
  //     .expect(function (result) {
  //       should(result.stderr).equal('undefined')
  //       should(result.stderr).not.match(/throw/)
  //       should(result.stderr).not.match(/AssertionError/)
  //     })
  //     .end(done)
  // })

  afterEach(function (done) {
    nixt(opts)
      .run(surge + 'teardown -e localhost:5001')
      .on(/.*domain:.*/).respond(subdomain + '\n')
      .expect(function (result) {
        should(result.stdout).match(/Success/)
        should(result.stdout).match(/removed/)
      })
      .end(done)
  })
})
