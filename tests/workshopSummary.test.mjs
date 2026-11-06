import test from 'node:test'
import assert from 'node:assert/strict'
import { workshopSummary } from '../src/lib/workshopSummary.ts'
import { newWorkshopRecord, saveStageEvidence } from '../src/lib/duplicateWorkshop.ts'
test('export separates best completed evidence from a later assisted fresh case', () => {
 let record = saveStageEvidence(newWorkshopRecord(), 'challenge', 0, false)
 record = {...record, challenge:{caseId:2,mistakes:1,hintUsed:true}}
 const html=workshopSummary(record)
 assert.match(html,/One example passed independently/)
 assert.match(html,/Current fresh case: 3; corrections: 1; help opened: yes/)
 assert.match(html,/Coding has not been assessed/)
 assert.match(html,/Not demonstrated yet/)
})
test('assisted completed cases are never exported as independent', () => {
 const html=workshopSummary(saveStageEvidence(newWorkshopRecord(),'challenge',0,true))
 assert.doesNotMatch(html,/One example passed independently/)
 assert.match(html,/Completed with practice/)
})
