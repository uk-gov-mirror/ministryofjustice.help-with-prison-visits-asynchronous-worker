const expect = require('chai').expect
const Promise = require('bluebird')
const fs = require('fs')
const unlink = Promise.promisify(require('fs').unlink)
const dateFormatter = require('../../../../app/services/date-formatter')
const config = require('../../../../config')
const XlsxPopulate = require('xlsx-populate')
const log = require('../../../../app/services/log')

const createAdiJournalFile = require('../../../../app/services/direct-payments/create-adi-journal-file')
var testFilePath

describe('services/direct-payments/create-adi-journal-file', function () {
  it('should generate ADI Journal file', function () {
    var accountingDate = dateFormatter.now().format('DD-MMM-YYYY')
    var amount = 123.45
    var journalName = config.ADI_JORNAL_PREFIX + dateFormatter.now().format('DDMMYY') + config.ADI_JORNAL_SUFFIX
    return createAdiJournalFile(amount)
      .then(function (filePath) {
        expect(fs.existsSync(filePath), 'file must have been created (cannot verify content)').to.be.true //eslint-disable-line
        testFilePath = filePath
        return XlsxPopulate.fromFileAsync(testFilePath)
          .then(workbook => {
            var adiJournalSheet = workbook.sheet(config.ADI_JOURNAL_SHEET)
            var totalCellValue = adiJournalSheet.cell(config.ADI_TOTAL_CELL).value()
            var debitCellValue = adiJournalSheet.cell(config.ADI_DEBIT_CELL).value()
            var accountingDateCellValue = adiJournalSheet.cell(config.ADI_ACCOUNTING_DATE_CELL).value()
            var periodCellValue = adiJournalSheet.cell(config.ADI_PERIOD_CELL).value()
            var adiJournalNameCellValue = adiJournalSheet.cell(config.ADI_JORNAL_NAME_CELL).value()
            var adiJournalDescriptionCellValue = adiJournalSheet.cell(config.ADI_JORNAL_DESCRIPTION_CELL).value()
            expect(totalCellValue, 'Total Cell should have the value ' + amount).to.be.eql(amount)
            expect(debitCellValue, 'Debit Cell should have the value ' + amount).to.be.eql(amount)
            expect(accountingDateCellValue, 'Accounting Date Cell should have the value ' + accountingDate).to.be.eql(accountingDate)
            expect(periodCellValue, 'Period cell should be blank').to.be.eql(undefined)
            expect(adiJournalNameCellValue, 'Journal name cell should have the value ' + journalName).to.be.eql(journalName)
            expect(adiJournalDescriptionCellValue, 'Journal description cell should have the value ' + journalName).to.be.eql(journalName)
          })
          .catch(function (error) {
            log.error('An error occurred while reading the test journal ')
            log.error(error)
            throw (error)
          })
      })
  })

  after(function () {
    console.log('\n\n\n\n\nTest File Path is ' + testFilePath + '\n\n\n\n\n\n')
    return unlink(testFilePath)
  })
})
