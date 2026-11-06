import { readWorkshopRecord, STAGES, STAGE_NAMES } from './duplicateWorkshop'
export const TOPICS = [
 {id:'arrays',name:'Arrays',group:0,x:.08,y:.15,desc:'An ordered row of values. Positions tell us where each value lives.',use:'Use when you need to scan, compare or rearrange a collection.',example:'[4, 7, 4] has a repeated 4.',slug:'contains-duplicate',lesson:'Contains Duplicate'},
 {id:'two-pointers',name:'Two Pointers',group:0,x:.34,y:.15,desc:'Keep track of two positions and move them with a clear rule.',use:'Use when a pair of boundaries can reduce repeated searching.',example:'Two walls: area = distance × shorter height.',slug:'container-with-most-water',lesson:'Container With Most Water'},
 {id:'sliding-window',name:'Sliding Window',group:0,x:.62,y:.15,desc:'Grow or shrink a continuous part of an array or string.',use:'Use for questions about neighbouring values or consecutive letters.',example:'In abba, shrink the window before adding the second b.',slug:'longest-substring-no-repeat',lesson:'Longest Substring Without Repeating Characters'},
 {id:'minimum-window',name:'Minimum Window',group:0,x:.90,y:.15,desc:'Find the shortest continuous section that contains the required letter counts.',use:'Use when repeated required letters matter, not just their presence.',example:'CABBA with target AAB → ABBA.',slug:'minimum-window-substring',lesson:'Minimum Window · Hard'},
 {id:'stack',name:'Stack',group:1,x:.08,y:.49,desc:'The last item added is the first one removed.',use:'Useful for undo actions, brackets and remembering unfinished work.',example:'Open a bracket: save it. Close it: match the latest saved bracket.'},
 {id:'queue',name:'Queue',group:1,x:.34,y:.49,desc:'The first item added is the first one removed.',use:'Useful when work must be handled in arrival order.',example:'Explore a tree one level at a time.'},
 {id:'linked-list',name:'Linked List',group:1,x:.62,y:.49,desc:'Each item stores a link to the next item.',use:'Useful when connections between items change often; finding a position still takes traversal.',example:'4 → 7 → 9 → end.'},
 {id:'heap',name:'Heap',group:1,x:.90,y:.49,desc:'A tree-shaped structure that keeps the highest-priority item easy to reach.',use:'Useful for repeatedly choosing the smallest or largest remaining item.',example:'A priority queue returns the most urgent task first.'},
 {id:'tree',name:'Tree',group:2,x:.08,y:.84,desc:'A hierarchy of connected items with no cycles.',use:'Useful for nested relationships such as folders.',example:'A folder has children; each child may have more children.'},
 {id:'bst',name:'BST',group:2,x:.34,y:.84,desc:'A binary search tree places smaller keys on the left and larger keys on the right.',use:'Useful for ordered lookup. Performance depends on the tree height.',example:'At 7, search left for 4 and right for 9.'},
 {id:'graph',name:'Graph',group:2,x:.62,y:.84,desc:'A network of items joined by connections.',use:'Useful for routes, dependencies and relationships.',example:'Cities are nodes; roads are edges.'},
 {id:'dp',name:'Dynamic Programming',group:2,x:.90,y:.84,desc:'Save answers to smaller repeated problems and combine them.',use:'Useful when the same subproblem appears many times.',example:'Remember the number of ways to reach each stair.'},
 {id:'greedy',name:'Greedy',group:2,x:.90,y:1.13,desc:'Choose the best-looking next move using a rule you can justify.',use:'Useful only when local choices can be proved to give a correct overall solution.',example:'Choose the earliest finishing compatible meeting.'},
]
export const LINKS: [string,string,string][] = [
 ['arrays','two-pointers','Two pointers mark positions in an array, so you need to understand indexing first.'],
 ['two-pointers','sliding-window','Sliding Window uses two boundaries to track a continuous section.'],
 ['sliding-window','minimum-window','Minimum Window adds required letter counts to the grow-and-shrink idea.'],
 ['stack','queue','Both store pending work; a Stack takes the newest first, a Queue the oldest first.'],
 ['queue','linked-list','A linked list can implement a Queue, with links at its front and back.'],
 ['queue','heap','A normal Queue uses arrival order; a priority queue can use a Heap to choose by priority.'],
 ['tree','bst','A BST is a Tree with an ordering rule for its keys.'],
 ['tree','graph','A Tree is a special Graph: connected and without cycles.'],
 ['graph','dp','Some acyclic dependency graphs can be solved by combining saved subproblem answers.'],
 ['dp','greedy','Both solve larger decisions, but Greedy needs a safe local-choice proof; DP compares subproblem results.'],
]
export type MapEvidence = {status:'Not started'|'Practising'|'Independent example passed'|'Unassessed';completed:number;next:string}
export function mapEvidence(id:string, read:(key:string)=>string|null):MapEvidence {
 const empty={status:'Not started' as const,completed:0,next:'Start the first activity'}
 try {
  if(id==='arrays') {
   const r=readWorkshopRecord(read('patternos-duplicate-workshop-v1')), independent=r.evidence.some(e=>e.id==='challenge'&&!e.mistakes&&!e.hintUsed)
   return {status:independent?'Independent example passed':r.evidence.length||r.stage!=='trace'?'Practising':'Not started',completed:r.evidence.length,next:STAGE_NAMES[STAGES.find(s=>!r.evidence.some(e=>e.id===s))??'challenge']}
  }
  const key=id==='two-pointers'?'patternos-journey-pointers-v1':id==='sliding-window'?'patternos-journey-window-v1':id==='minimum-window'?'patternos-minimum-window-v1':null
  if(!key)return {status:'Unassessed',completed:0,next:'Explore the topic; no checked workshop is available yet'}
  const r=JSON.parse(read(key)??'null')
  if(!r||!Array.isArray(r.completed))return empty
  const completed=[...new Set(r.completed.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<5))] as number[]
  const last=id==='minimum-window'?r.last:r.lastCheck
  const independent=completed.includes(4)&&last&&Number.isInteger(last.caseId)&&last.caseId>=0&&last.assisted===false&&(id==='minimum-window'||last.errors===0)
  return {status:independent?'Independent example passed':completed.length||r.stage>0?'Practising':'Not started',completed:completed.length,next:completed.length===5?'Try another fresh example':'Continue activity '+([0,1,2,3,4].find(i=>!completed.includes(i))!+1)}
 }catch{return empty}
}
export function recommendTopic(evidence:Record<string,MapEvidence>) {
 const available=TOPICS.filter(t=>t.slug)
 return available.find(t=>evidence[t.id]?.completed>0&&evidence[t.id].completed<5)??available.find(t=>evidence[t.id]?.status==='Not started')??available.find(t=>evidence[t.id]?.completed<5)??available[0]
}
