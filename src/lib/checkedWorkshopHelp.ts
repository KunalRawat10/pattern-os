import type { TraceState, Value } from './duplicateWorkshop'
const display=(values:readonly Value[])=>JSON.stringify(values)
export function checkedTraceHelp(values: readonly Value[], trace: TraceState):{title:string;body:string;next:string}{
 if(trace.phase==='complete')return {title:'The example is finished. Now choose the tool.',body:trace.result?'An earlier value matched, so this input contains a repeat.':'All values were checked without an earlier match, so this input has no repeat.',next:'Open Compare two methods. Learn why a Set supports fast average lookups, then explain the time and extra-space costs.'}
 const value=values[trace.index]
 if(value===undefined)return {title:'Restart this example',body:'No current value is available in this trace.',next:'Choose Restart this exercise.'}
 if(trace.phase==='add')return {title:'Save the new number',body:display(trace.seen)+' does not contain '+JSON.stringify(value)+'. The check is already done; this number is new.',next:'Choose Save '+value+', then check the next number.'}
 const present=trace.seen.includes(value)
 return {title:'Check before saving',body:'The current number is '+JSON.stringify(value)+'. Earlier saved values: '+display(trace.seen)+'. '+(present?'It is already saved, so an earlier matching value exists.':'It is not saved, so it has not appeared in an earlier position.'),next:present?'Choose Yes, already seen.':'Choose No, a new value. Saving is a separate action afterwards.'}
}
