import test from 'node:test'
import assert from 'node:assert/strict'
import {groupNotes,prepareNote,exportNotes,parseNoteBackup} from '../src/lib/noteDocuments.ts'
test('notes with the same title keep distinct identities and exact original formatting',()=>{
 const text='A Set checks earlier values.\n\n  Keep my spacing.'
 const docs=groupNotes([...prepareNote('one','Same title',text,'Arrays & Sets'),...prepareNote('two','Same title','Different content','General')])
 assert.equal(docs.length,2);assert.equal(docs.find(n=>n.id==='one').text,text)
 assert.deepEqual(parseNoteBackup(exportNotes(docs)).find(n=>n.text===text),{title:'Same title',text,topic:'Arrays & Sets'})
})
test('legacy title groups preserve every passage and safe titles',()=>{
 const docs=groupNotes([{id:'old-10',sourceTitle:'__proto__',text:'last',embedding:[]},{id:'old-2',sourceTitle:'__proto__',text:'first',embedding:[]}])
 assert.equal(docs.length,1);assert.equal(docs[0].text,'first\n\nlast')
})
test('backup validation rejects invalid entries before any save',()=>{
 assert.throws(()=>parseNoteBackup('{}'))
 assert.throws(()=>parseNoteBackup(JSON.stringify({format:'patternos-notes',version:1,notes:[{title:'ok',text:'valid'},{title:'bad',text:3}]})))
})
