import test from 'node:test'
import assert from 'node:assert/strict'
import { explainBlockOrder, checkProgram } from '../src/lib/duplicateWorkshop.ts'
test('photographed plan explains both premature false and saving before checking',()=>{
 const order=['init','loop','finish','add','check']
 const feedback=explainBlockOrder(order)
 assert.match(feedback,/position 3 to position 5/)
 assert.match(feedback,/match itself/)
 assert.equal(checkProgram(order).passed,false)
 assert.equal(checkProgram(['init','loop','check','add','finish']).passed,true)
})
