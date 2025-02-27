const Promise = require('bluebird')
const stringify = Promise.promisify(require('csv-stringify'))
const writeFile = Promise.promisify(require('fs').writeFile)
const fs = require('fs')
const path = require('path')
const dateFormatter = require('../date-formatter')
const config = require('../../../config')
const log = require('../log')
const _ = require('lodash')

const dataPath = config.DATA_FILE_PATH
const outputPath = path.join(dataPath, config.PAYMENT_FILE_PATH)

module.exports = function (payments) {
  const filePath = path.join(outputPath, getFileName())
  mkdirIfNotExists(dataPath)
  mkdirIfNotExists(outputPath)
  const formattedPayments = stripSpecialCharacters(payments)
  const length = formattedPayments.length

  log.info(`Generating payout file with ${length} payments`)
  return stringify(formattedPayments).then(function (content) {
    return writeFile(filePath, content, {})
      .then(function () {
        log.info(`Filepath for payout payment file = ${filePath}`)
        return filePath
      })
  })
}

function mkdirIfNotExists (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function getFileName () {
  const datestamp = dateFormatter.now().format('DDMMYYYY')
  return `${config.PAYOUT_FILENAME_PREFIX}${datestamp}${config.PAYOUT_FILENAME_POSTFIX}.csv`
}

function stripSpecialCharacters (payments) {
  const replaceCharacters = string => string.replace(/[^a-zA-Z0-9-. ]/g, '')
  return _.map(payments, paymentRow => _.map(paymentRow, replaceCharacters))
}
