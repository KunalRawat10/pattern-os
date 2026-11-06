import test from 'node:test'
import assert from 'node:assert/strict'
import {generateTeachingReply} from '../src/lib/teachingPolicy.ts'
test('comparison-only request rejects a new-task question and accepts a focused rewrite',async()=>{
 let calls=0
 const reply=await generateTeachingReply([{role:'system',content:'Teach membership.'},{role:'user',content:'How does a list differ from a Set? Explain only this comparison.'}],'How does a list differ from a Set? Explain only this comparison.',async payload=>{
  assert.match(payload[0].content,/COMPARISON ONLY/)
  calls++
  return {choices:[{message:{content:calls===1?'A list may scan all values. A Set offers fast lookup. Shall we add a value now?':'An unsorted list may scan up to n values. A hash-based Set has expected O(1) lookup, which describes growth rather than exactly one comparison.'}}]}
 })
 assert.equal(calls,2);assert.doesNotMatch(reply,/\?/);assert.match(reply,/expected O\(1\)/)
})
test('numeric one-comparison claim is rewritten while an explicit disclaimer is allowed',async()=>{
 let calls=0
 const reply=await generateTeachingReply([{role:'system',content:'Teach Set cost.'}],'Compare a list and a Set. Explain only the comparison.',async()=>({choices:[{message:{content:++calls===1?'A list may search all values. A Set uses about 1 comparison on average.':'A list may scan up to n entries. A hash-based Set has expected O(1) lookup; this does not mean one comparison.'}}]}))
 assert.equal(calls,2);assert.match(reply,/does not mean one comparison/)
})
