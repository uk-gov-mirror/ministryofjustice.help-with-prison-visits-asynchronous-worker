const config = require('../../../config')
const moment = require('moment')
const getAllOpenAdvanceClaimsForDateOfJourneyRangeWithEmail = require('../data/get-all-open-advance-claims-for-date-of-journey-range-with-email')
const insertTask = require('../data/insert-task')
const tasksEnum = require('../../constants/tasks-enum')
const reminderEnum = require('../../constants/advance-claim-reminder-enum')
const Promise = require('bluebird')

module.exports.execute = function (task) {
  const dateCreated = task.dateCreated
  const numberOfDaysAfterDateOfJourneyForReminder = parseInt(config.NUMBER_OF_DAYS_AFTER_DATE_OF_JOURNEY_FOR_ADVANCE_REMINDER)
  const numberOfDaysAfterDateOfJourneyForSecondReminder = parseInt(config.NUMBER_OF_DAYS_AFTER_DATE_OF_JOURNEY_FOR_SECOND_ADVANCE_REMINDER)

  // Get date range of Advance Claims with DateOfJourney which require reminders
  const startDateFirst = moment(dateCreated).startOf('day').subtract(numberOfDaysAfterDateOfJourneyForReminder, 'days').toDate()
  const endDateFirst = moment(dateCreated).endOf('day').subtract(numberOfDaysAfterDateOfJourneyForReminder, 'days').toDate()

  const startDateSecond = moment(dateCreated).startOf('day').subtract(numberOfDaysAfterDateOfJourneyForSecondReminder, 'days').toDate()
  const endDateSecond = moment(dateCreated).endOf('day').subtract(numberOfDaysAfterDateOfJourneyForSecondReminder, 'days').toDate()

  return Promise.all([
    getAllOpenAdvanceClaimsForDateOfJourneyRangeWithEmail(startDateFirst, endDateFirst)
      .then(function (openAdvanceClaims) {
        return insertTasksToSendAdvanceClaimEvidenceReminderNotification(openAdvanceClaims, reminderEnum.FIRST)
      }),
    getAllOpenAdvanceClaimsForDateOfJourneyRangeWithEmail(startDateSecond, endDateSecond)
      .then(function (openAdvanceClaims) {
        return insertTasksToSendAdvanceClaimEvidenceReminderNotification(openAdvanceClaims, reminderEnum.SECOND)
      })
  ])
}

function insertTasksToSendAdvanceClaimEvidenceReminderNotification (openAdvanceClaims, reminder) {
  const promises = []

  openAdvanceClaims.forEach(function (claim) {
    promises.push(insertTaskToSendAdvanceClaimEvidenceReminderNotification(claim, reminder))
  })

  return Promise.all(promises)
}

function insertTaskToSendAdvanceClaimEvidenceReminderNotification (claim, reminder) {
  return insertTask(claim.Reference, claim.EligibilityId, claim.ClaimId, tasksEnum.ADVANCE_CLAIM_EVIDENCE_REMINDER_NOTIFICATION, `${claim.EmailAddress}~~${reminder}`)
}
