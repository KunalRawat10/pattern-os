import test from 'node:test'
import assert from 'node:assert/strict'
import {workUnits,extraEntries,inspectCodeText} from '../src/lib/complexityLab.ts'
test('separate and nested counts match instrumented iterations, not total loop count',()=>{
 for(let n=1;n<=30;n++){
  let separate=0,nested=0
  for(let i=0;i<n;i++)separate++
  for(let j=0;j<n;j++)separate++
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)nested++
  assert.equal(workUnits('separate',n),separate)
  assert.equal(workUnits('nested',n),nested)
 }
 assert.equal(workUnits('separate',16)/workUnits('separate',8),2)
 assert.equal(workUnits('nested',16)/workUnits('nested',8),4)
})
test('halving terminates at one and handles non-power-of-two input',()=>{
 assert.equal(workUnits('halving',1),0)
 assert.equal(workUnits('halving',8),3)
 assert.equal(workUnits('halving',9),3)
 assert.equal(workUnits('halving',100),6)
 assert.equal(workUnits('halving',200),7)
 assert.throws(()=>workUnits('linear',0))
})
test('Set no-repeat model counts one membership call and stored entry per distinct input',()=>{
 for(const n of [4,8,100]){
  const seen=new Set();let calls=0
  for(let i=0;i<n;i++){calls++;if(seen.has(i))break;seen.add(i)}
  assert.equal(workUnits('set',n),calls)
  assert.equal(extraEntries('set',n),seen.size)
 }
})
test('code clues ignore ordinary comments and strings, and do not issue a Big O verdict',()=>{
 const clue=inspectCodeText('/* for (;;) {} */ const text = "while (x)"; for(let i=0;i<n;i++) {} for(let j=0;j<n;j++) {}')
 assert.equal(clue.headers,2)
 assert.equal('timeComplexity' in clue,false)
 assert.equal(inspectCodeText('// just a comment').hasCode,false)
})
