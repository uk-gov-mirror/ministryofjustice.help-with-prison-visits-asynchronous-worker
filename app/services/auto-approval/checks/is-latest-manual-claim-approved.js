const AutoApprovalCheckResult = require('../../domain/auto-approval-check-result')

const CHECK_NAME = 'is-latest-manual-claim-approved'
const FAILURE_MESSAGE = 'The last manually evaluated claim was rejected'

module.exports = function (autoApprovalData) {
  if (autoApprovalData.latestManuallyApprovedClaim && autoApprovalData.latestManuallyApprovedClaim.Status === 'APPROVED') {
    return new AutoApprovalCheckResult(CHECK_NAME, true, '')
  } else {
    return new AutoApprovalCheckResult(CHECK_NAME, false, FAILURE_MESSAGE)
  }
}
