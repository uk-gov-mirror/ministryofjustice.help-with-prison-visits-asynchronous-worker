const knexConfig = require('../../../knexfile').asyncworker
const knex = require('knex')(knexConfig)

module.exports = function (startDateOfStatus, endDateOfStatus) {
  return knex('IntSchema.Claim')
    .join('IntSchema.Visitor', 'IntSchema.Claim.EligibilityId', '=', 'IntSchema.Visitor.EligibilityId')
    .whereBetween('Claim.DateOfStatus', [startDateOfStatus, endDateOfStatus])
    .andWhere({ 'Claim.ReminderSent': true })
    .select('IntSchema.Claim.*', 'IntSchema.Visitor.EmailAddress')
}
