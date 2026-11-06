export const COMPLEXITY_EXAMPLES = [
 {id:'constant',title:'Read one value',time:'O(1)',space:'O(1)',rule:'One read',why:'Reading one array position takes one operation in this model, regardless of the number of values.',memory:'Only a single result is kept. The input array is not counted as extra space.',code:'function first(nums) {\n  return nums[0];\n}'},
 {id:'linear',title:'One pass',time:'O(n)',space:'O(1)',rule:'n visits',why:'Visit every value once. Doubling the input doubles the number of visits.',memory:'A running total uses a fixed amount of extra storage.',code:'function sum(nums) {\n  let total = 0;\n  for (const value of nums) total += value;\n  return total;\n}'},
 {id:'separate',title:'Two separate passes',time:'O(n)',space:'O(1)',rule:'2 × n visits',why:'Finish one pass, then start the second. Add their work: n + n = 2n. Big O drops the constant factor, giving O(n). These loops are not nested.',memory:'Each pass reuses a fixed number of variables.',code:'function inspect(nums) {\n  let total = 0, largest = -Infinity;\n  for (const value of nums) total += value;\n  for (const value of nums) largest = Math.max(largest, value);\n  return {total, largest};\n}'},
 {id:'nested',title:'Every pair of positions',time:'O(n²)',space:'O(1)',rule:'n × n checks',why:'For each of n positions, visit all n positions again. Multiply the work: n × n. Doubling n makes four times as many checks.',memory:'Only the two positions and a counter are kept.',code:'function countPairs(nums) {\n  let checks = 0;\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = 0; j < nums.length; j++) checks++;\n  }\n  return checks;\n}'},
 {id:'halving',title:'Keep halving the search',time:'O(log n)',space:'O(1)',rule:'Halve until 1 remains',why:'Each step discards roughly half the remaining possibilities. Doubling a power-of-two input adds just one halving step.',memory:'Only the remaining size and a step counter are kept.',code:'function halvingSteps(n) {\n  let steps = 0;\n  while (n > 1) { n = Math.floor(n / 2); steps++; }\n  return steps;\n}'},
 {id:'set',title:'Remember earlier numbers',time:'Expected O(n)',space:'O(n)',rule:'n membership calls',why:'With all values different, ask the Set once for each input value. Under average constant-time Set operations, total time grows linearly. A duplicate can make the scan stop early.',memory:'In the worst case all n values are different, so the Set stores n entries.',code:'function containsDuplicate(nums) {\n  const seen = new Set();\n  for (const value of nums) {\n    if (seen.has(value)) return true;\n    seen.add(value);\n  }\n  return false;\n}'},
] as const
export type ComplexityExampleId = typeof COMPLEXITY_EXAMPLES[number]['id']
export function workUnits(id:ComplexityExampleId,n:number):number {
 if(!Number.isSafeInteger(n)||n<1||n>1000000)throw Error('Use a whole input size between 1 and 1,000,000.')
 if(id==='constant')return 1
 if(id==='nested')return n*n
 if(id==='separate')return 2*n
 if(id==='halving'){let steps=0;while(n>1){n=Math.floor(n/2);steps++}return steps}
 return n
}
export function extraEntries(id:ComplexityExampleId,n:number):number{return id==='set'?n:1}
// Text clues only: never execute submitted code or infer a bound from loop count.
export function inspectCodeText(code:string){
 const text=code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,' ')
 const headers=(text.match(/\b(?:for|while)\s*\(/g)??[]).length
 const collections=[...new Set(text.match(/\bnew\s+(?:Map|Set|Array)\b/g)??[])]
 const methods=[...new Set(text.match(/\.(?:sort|map|filter|reduce|forEach|includes)\s*\(/g)??[])]
 return {headers,collections,methods,hasCode:!!text.trim()}
}
