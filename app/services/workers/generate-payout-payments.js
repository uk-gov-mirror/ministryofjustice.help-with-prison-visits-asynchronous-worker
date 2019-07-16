const getClaimsPendingPayment = require('../data/get-claims-pending-payment')
const createPayoutFile = require('../payout-payments/create-payout-file')
const sftpSendPayoutPaymentFile = require('../sftp/sftp-send-payout-payment-file')
const updateClaimsProcessedPayment = require('../data/update-claims-processed-payment')
const insertDirectPaymentFile = require('../data/insert-direct-payment-file')
const fileTypes = require('../../constants/payment-filetype-enum')
const paymentMethods = require('../../constants/payment-method-enum')
const config = require('../../../config')
const _ = require('lodash')
const path = require('path')

module.exports._test_formatCSVData = formatCSVData

module.exports.execute = function (task) {
  var claimIds
  var paymentCsvFilePath

  return getClaimsPendingPayment(paymentMethods.PAYOUT.value)
    .then(function (paymentData) {
      if (paymentData.length > 0) {
        var claimIdIndex = 0
        claimIds = getClaimIdsFromPaymentData(paymentData, claimIdIndex)
        formatCSVData(paymentData, claimIdIndex)
        return createPayoutFile(paymentData)
          .then(function (filePath) {
            paymentCsvFilePath = filePath
            var filename = path.basename(paymentCsvFilePath)
            var remotePaypitCsvFilePath = `${config.PAYOUT_SFTP_REMOTE_PATH}${filename}`

            return sftpSendPayoutPaymentFile(paymentCsvFilePath, remotePaypitCsvFilePath)
          })
          .then(function () {
            return insertDirectPaymentFile(paymentCsvFilePath, fileTypes.PAYOUT_FILE)
              .then(function () {
                return updateAllClaimsProcessedPayment(claimIds, paymentData)
              })
          })
      }
    })
}

function getClaimIdsFromPaymentData (paymentData, claimIdIndex) {
  return _.map(paymentData, p => { return p[claimIdIndex] })
}

// Format to be Payment Amount, blank, First Name, Last Name, Address1, Address2, Address3, Address4, Postcode,
// POI code, blank, blank, Reference, blank, blank, blank, blank, blank, template code, blank, blank, Date of Visit
function formatCSVData (paymentData, claimIdIndex) {
  paymentData.forEach(function (data) {
    data.splice(claimIdIndex, 1)
    data.splice(1, 0, '')
    data.splice(9, 0, '2', '', '') // 2 is the code for checking ID in POI
    data.splice(13, 0, '', '', '', '', '', config.PAYOUT_TEMPLATE_CODE)
    data.splice(19, 0, '', '')

    // Ensures there is a space in the postcode
    var postCodeIndex = 8
    if (data[postCodeIndex].indexOf(' ') < 0) {
      data[postCodeIndex] = data[postCodeIndex].replace(/^(.*)(.{3})$/, '$1 $2')
    }

    // Formats the date of visit
    var dateOfVisitIndex = 21
    var dateOfVisitRaw = JSON.stringify(data[dateOfVisitIndex])
    var year = dateOfVisitRaw.substring(1, 5)
    var month = dateOfVisitRaw.substring(6, 8)
    var day = dateOfVisitRaw.substring(9, 11)
    var dateOfVisit = day + ' ' + month + ' ' + year
    data[dateOfVisitIndex] = dateOfVisit
  })

  return paymentData
}

// Makes it specific layout for post office payout

function updateAllClaimsProcessedPayment (claimIds, paymentData) {
  var promises = []

  for (var i = 0; i < claimIds.length; i++) {
    var claimPaymentData = paymentData[i]
    var claimId = claimIds[i]

    var totalApprovedCostIndex = 0
    promises.push(updateClaimsProcessedPayment(claimId, parseFloat(claimPaymentData[totalApprovedCostIndex])))
  }

  return Promise.all(promises)
}
