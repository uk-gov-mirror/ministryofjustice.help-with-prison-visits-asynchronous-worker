const moment = require('moment')
const dateFormatter = require('../../date-formatter')

const AutoApprovalCheckResult = require('../../domain/auto-approval-check-result')

const CHECK_NAME = 'are-children-under-18'
const FAILURE_MESSAGE = 'One or more children to be claimed are over 18 years old'

module.exports = function (autoApprovalData) {
  const now = dateFormatter.now()

  if (autoApprovalData.ClaimChildren && autoApprovalData.ClaimChildren.length > 0) {
    for (let i = 0; i < autoApprovalData.ClaimChildren.length; i++) {
      const child = autoApprovalData.ClaimChildren[i]
      const dateOfBirth = moment(child.DateOfBirth)
      const ageInYears = now.diff(dateOfBirth, 'years')

      if (ageInYears >= 18) {
        return new AutoApprovalCheckResult(CHECK_NAME, false, FAILURE_MESSAGE)
      }
    }
  }
  return new AutoApprovalCheckResult(CHECK_NAME, true, '')
}
