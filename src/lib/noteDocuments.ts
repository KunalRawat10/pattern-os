import { chunkText, type NoteChunk } from './notesStore'
export interface NoteDocument {id:string;title:string;text:string;topic:string;updatedAt:string;chunks:NoteChunk[]}
export function groupNotes(chunks:NoteChunk[]):NoteDocument[]{
 const groups=new Map<string,NoteChunk[]>()
 for(const chunk of chunks){const key=chunk.documentId??'legacy:'+chunk.sourceTitle;groups.set(key,[...(groups.get(key)??[]),chunk])}
 return [...groups.entries()].map(([id,items])=>{items.sort((a,b)=>(a.part??0)-(b.part??0)||a.id.localeCompare(b.id,undefined,{numeric:true}));return {id,title:items[0].sourceTitle,text:items.find(c=>c.originalText!==undefined)?.originalText??items.map(c=>c.text).join('\n\n'),topic:items[0].topic??'General',updatedAt:items[0].updatedAt??'',chunks:items}}).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
}
export function prepareNote(id:string,title:string,text:string,topic:string):NoteChunk[]{
 return chunkText(text).map((piece,part)=>({id:id+':'+part,documentId:id,sourceTitle:title.trim()||'Untitled note',text:piece,embedding:[],topic,updatedAt:new Date().toISOString(),part,...(part===0?{originalText:text}:{})}))
}
export function exportNotes(notes:NoteDocument[]):string{return JSON.stringify({format:'patternos-notes',version:1,notes:notes.map(n=>({title:n.title,text:n.text,topic:n.topic}))},null,2)}
export function parseNoteBackup(raw:string):{title:string;text:string;topic:string}[]{
 const data=JSON.parse(raw)
 if(data?.format!=='patternos-notes'||data.version!==1||!Array.isArray(data.notes)||data.notes.length>200)throw Error('Choose a PatternOS notes backup containing up to 200 notes.')
 return data.notes.map((n:unknown)=>{
  if(!n||typeof n!=='object'||!('title' in n)||!('text' in n)||typeof n.title!=='string'||typeof n.text!=='string'||!n.text.trim()||n.text.length>100000||n.title.length>200)throw Error('The backup contains an invalid or oversized note.')
  return {title:n.title,text:n.text,topic:'topic' in n&&typeof n.topic==='string'?n.topic.slice(0,100):'General'}
 })
}
