import test from 'node:test'
import assert from 'node:assert/strict'
import {mapEvidence,recommendTopic,TOPICS,LINKS} from '../src/lib/patternLearningMap.ts'
const read=value=>()=>JSON.stringify(value)
test('unsupported topics stay unassessed, malformed storage earns no pass',()=>{
 assert.equal(mapEvidence('heap',()=>null).status,'Unassessed')
 assert.equal(mapEvidence('two-pointers',()=>'{bad').status,'Not started')
 assert.equal(mapEvidence('two-pointers',read({completed:[4],lastCheck:{caseId:0,errors:0,assisted:true}})).status,'Practising')
})
test('independent results require completed evidence and an unassisted successful check',()=>{
 assert.equal(mapEvidence('two-pointers',read({completed:[0,1,2,3,4],lastCheck:{caseId:0,errors:0,assisted:false}})).status,'Independent example passed')
 assert.equal(mapEvidence('minimum-window',read({completed:[],last:{caseId:0,assisted:false}})).status,'Not started')
 assert.equal(mapEvidence('minimum-window',read({completed:[4],last:{caseId:0,assisted:false}})).status,'Independent example passed')
})
test('unfinished activities are recommended even after an independent case passed',()=>{
 const e=Object.fromEntries(TOPICS.map(t=>[t.id,mapEvidence(t.id,()=>null)]))
 e.arrays={status:'Independent example passed',completed:4,next:'Put the steps in order'}
 assert.equal(recommendTopic(e).id,'arrays')
})
test('every explained link targets a known topic and workshop links are distinct',()=>{
 const ids=new Set(TOPICS.map(t=>t.id))
 for(const [a,b,why] of LINKS){assert.ok(ids.has(a)&&ids.has(b));assert.ok(why.length>20)}
 assert.equal(new Set(TOPICS.filter(t=>t.slug).map(t=>t.slug)).size,4)
})
