import fs from 'node:fs/promises'
import {generateLessonTurn} from '../src/lib/lessonTutor.ts'
import {desktopCompletion} from '../src/lib/desktopTutor.ts'
import {PROBLEMS} from '../src/data/problems.ts'
const testBase=process.env.PATTERNOS_TEST_URL??'http://127.0.0.1:5173'
const model=process.env.PATTERNOS_TEST_MODEL??'qwen2.5:7b'
const originalFetch=globalThis.fetch
globalThis.fetch=(url,options)=>originalFetch(typeof url==='string'&&url.startsWith('/')?testBase+url:url,options)
const problem=PROBLEMS.find(p=>p.slug==='contains-duplicate')
const checks=[
 {text:'I wrote down 4, so my seen list is [4]. The next number is 7. What should I check before writing it down?',context:'CURRENT WORKSHOP: Contains Duplicate / Check each number. Input [4,7,4]. Current index 1. Seen [4]. Phase predict. APP-CHECKED STEP GUIDANCE: Current number 7 is not in saved [4]. Check before saving.'},
 {text:'Suppose my seen list contains 1,000 different numbers. To check whether 7 is already there, would an ordinary list need to search through them? How would checking a Set differ? Explain only this comparison, without tracing [4,7,4] again.',context:'CURRENT WORKSHOP: Contains Duplicate / Compare two methods. Student asks about lookup cost in a saved list of 1,000 values. An unsorted list may compare up to all 1,000 values. A common hash-based Set has expected average O(1) lookup; this is not literally one comparison. Answer only this comparison.'}
]
const results=[]
for(const check of checks){const start=Date.now();try{const result=await generateLessonTurn([{role:'user',content:check.text}],problem,'concepts',async(messages,options)=>desktopCompletion(model,messages,options),'',check.context);results.push({question:check.text,reply:result.reply,seconds:(Date.now()-start)/1000})}catch(e){results.push({question:check.text,error:String(e),seconds:(Date.now()-start)/1000})};console.log(JSON.stringify(results.at(-1)))}
await fs.writeFile('docs/reviews/real-tutor-check.json',JSON.stringify({model,results},null,2))
