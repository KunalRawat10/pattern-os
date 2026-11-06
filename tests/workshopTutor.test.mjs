import test from 'node:test'
import assert from 'node:assert/strict'
import { generateLessonTurn } from '../src/lib/lessonTutor.ts'
import { PROBLEMS } from '../src/data/problems.ts'
test('workshop question uses current state without the generic assessment or lesson shortcut',async()=>{
 const problem=PROBLEMS.find(p=>p.slug==='contains-duplicate')
 let calls=0
 const result=await generateLessonTurn([{role:'user',content:'What should I check next?'}],problem,'concepts',async messages=>{
 calls++
 assert.ok(messages.some(m=>m.content.includes('Seen [4]')))
 return {choices:[{message:{content:'Check whether 7 is already in [4]. It is not, so it is new.'}}]}
 },'CURRENT WORKSHOP: Contains Duplicate / Check each number. Input [4,7,4]. Seen [4]. Phase predict.')
 assert.equal(calls,1)
 assert.match(result.reply,/7/)
 assert.doesNotMatch(result.reply,/complete/)
})
