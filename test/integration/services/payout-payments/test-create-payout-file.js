const config = require('../../../../config')
const expect = require('chai').expect
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const unlink = Promise.promisify(require('fs').unlink)

const createPaymentFile = require('../../../../app/services/payout-payments/create-payout-file')
const formatCSVData = require('../../../../app/services/workers/helpers/payments/payout/format-csv-data')
let testFilePath

const data = [
  ['34.22', 'Joe', 'Bloggs$$', '123 Test Street$$', 'Test Town&&', 'Test County||', 'Test>><< Country', 'BT123BT', 'V123456', 'TEST089-LET-001', '28// 09 2017'],
  ['12.22', 'Frank', 'Bloggs', '456 Test Street', 'Test Town', 'Test County', 'Test Country', 'BT12 6BT', 'V123457', 'TEST089-LET-001', '28 09 2017']
]

describe('services/payout-payments/create-payout-file', function () {
  it('should generate valid file', function () {
    const formattedData = formatCSVData(data, 9)
    formattedData.forEach(function (row) {
      row[row.length - 1] = 'TEST089-LET-001'
    })

    return createPaymentFile(formattedData)
      .then(function (filePath) {
        expect(filePath).to.be.not.null //eslint-disable-line
        expect(filePath).to.contain(config.PAYOUT_FILENAME_PREFIX)
        expect(filePath).to.contain(config.PAYOUT_FILENAME_POSTFIX)
        testFilePath = filePath

        return readFile(filePath).then(function (content) {
          const lines = content.toString().split('\n')
          expect(lines.length).to.be.equal(3)
          // expect(lines[0]).to.be.equal('34.22,,Joe,Bloggs,123 Test Street,Test Town,Test County,Test Country,BT12 3BT,2,,,V123456,,,,,,TEST089-LET-001,,,28 09 2017')
          // expect(lines[1]).to.be.equal('12.22,,Frank,Bloggs,456 Test Street,Test Town,Test County,Test Country,BT12 6BT,2,,,V123457,,,,,,TEST089-LET-001,,,28 09 2017')
        })
      })
  })

  after(function () {
    return unlink(testFilePath)
  })
})
