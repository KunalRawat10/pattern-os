import test from 'node:test'
import assert from 'node:assert/strict'
import { checkedTraceHelp } from '../src/lib/checkedWorkshopHelp.ts'
import { freshTrace,predictMembership,recordCurrent } from '../src/lib/duplicateWorkshop.ts'
import { generateLessonTurn } from '../src/lib/lessonTutor.ts'
import { generateSmallModelTurn } from '../src/lib/smallModel.ts'
import { PROBLEMS } from '../src/data/problems.ts'
const problem=PROBLEMS.find(p=>p.slug==='contains-duplicate')
test('checked help follows the photographed successive states rather than substituting another input',()=>{
 const values=[4,7,4];let trace=freshTrace()
 trace=recordCurrent(values,predictMembership(values,trace,false))
 let help=checkedTraceHelp(values,trace)
 assert.match(help.body,/current number is 7/);assert.match(help.body,/\[4\]/);assert.match(help.next,/No, a new value/)
 trace=recordCurrent(values,predictMembership(values,trace,false))
 help=checkedTraceHelp(values,trace)
 assert.match(help.body,/current number is 4/);assert.match(help.body,/\[4,7\]/);assert.match(help.next,/Yes, already seen/)
 trace=predictMembership(values,trace,true)
 assert.match(checkedTraceHelp(values,trace).next,/Compare two methods/)
})
test('new non-repeated values get a separate save action; strings and zero retain identity',()=>{
 const values=[0,'0'];let t=recordCurrent(values,predictMembership(values,freshTrace(),false))
 assert.match(checkedTraceHelp(values,t).body,/not saved/)
 t=predictMembership(values,t,false)
 assert.match(checkedTraceHelp(values,t).title,/Save/)
 assert.match(checkedTraceHelp(values,t).body,/check is already done/)
})
test('long retrieved notes cannot push current exercise state out of either tutor payload',async()=>{
 const context='CURRENT WORKSHOP: Contains Duplicate. Input [4,7,4]. Current value 7; saved [4]. Phase predict.'
 for(const generate of [generateLessonTurn,generateSmallModelTurn]){
  let calls=0
  const result=await generate([{role:'user',content:'What do I check next?'}],problem,'concepts',async payload=>{
   calls++;assert.ok(payload[0].content.includes(context))
   return {choices:[{message:{content:'Check whether 7 is already among the saved values [4]. It is new.'}}]}
  },'reference note '.repeat(2000),context)
  assert.equal(calls,1);assert.match(result.reply,/7/)
 }
})
test('compact workshop failures remain explicit instead of silently substituting a generic canned answer',async()=>{
 const reply='The solution is: use a Set, loop through every value, return true for repeats and return false afterwards.'
 await assert.rejects(()=>generateSmallModelTurn([{role:'user',content:'Show just one step.'}],problem,'concepts',async()=>({choices:[{message:{content:reply}}]}),'','CURRENT WORKSHOP: current value 7, saved [4].'),/checked workshop help/)
})
