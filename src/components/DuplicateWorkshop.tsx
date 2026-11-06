import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { BLOCKS, STARTING_BLOCKS, STAGES, STAGE_NAMES, PRACTICE_CASES, freshTrace, predictMembership, recordCurrent,
  compareApproaches, comparisonInput, orderExperiment, checkProgram, challengeCase, emptyChallengeAnswers, checkChallenge,
  explainBlockOrder, newWorkshopRecord, readWorkshopRecord, saveStageEvidence, type WorkshopRecord, type WorkshopStage, type BlockId, type ChallengeAnswers,
} from '../lib/duplicateWorkshop'
import '../workshop.css'
import MistakeClinic from './MistakeClinic'
import ApproachWalkthrough from './ApproachWalkthrough'
import { checkedTraceHelp } from '../lib/checkedWorkshopHelp'
import { workshopSummary, workshopSummaryText } from '../lib/workshopSummary'

const STORAGE = 'patternos-duplicate-workshop-v1'
const display = (values: readonly (number | string)[]) => `[${values.map(value => typeof value === 'string' ? `"${value}"` : value).join(', ')}]`
export interface WorkshopHelpHandle { markTutorUsed: () => void; showCheckedHelp?: () => void }
interface Props { onAskTutor: () => void; onContextChange: (context: string) => void; tutorOpen: boolean; ref?: Ref<WorkshopHelpHandle> }
const HINTS: Record<WorkshopStage, string> = {
  trace: 'The seen list starts empty. Check only the current value against earlier values. If it is new, record it; if it is already present, return true.',
  compare: 'A saved list compares a number with earlier numbers one by one. A Set lets us ask whether the number is already saved, without writing that search ourselves.',
  order: 'Adding before checking puts the current value into the Set. The very first check then finds that same occurrence, even though no earlier occurrence exists.',
  build: 'Start with nothing saved. For each number, check first, then save it if it is new. Say “no repeat” only after checking every number.',
  challenge: 'Check for an earlier matching value. For the Set approach, check before adding; a single pass takes expected O(n) time and up to O(n) extra space.',
}

export default function DuplicateWorkshop({ onAskTutor, onContextChange, tutorOpen, ref }: Props) {
  const [record, setRecord] = useState<WorkshopRecord>(() => {
    try { return readWorkshopRecord(localStorage.getItem(STORAGE)) } catch { return newWorkshopRecord() }
  })
  const [reportOpen, setReportOpen] = useState(false)
  const reportFrame = useRef<HTMLIFrameElement>(null)
  const [storageWarning, setStorageWarning] = useState('')
  const [checkedHelpOpen, setCheckedHelpOpen] = useState(false)
  const [hintStage, setHintStage] = useState<WorkshopStage | null>(null)
  const [hintsUsed, setHintsUsed] = useState<WorkshopStage[]>([])
  const [practiceCase, setPracticeCase] = useState(0)
  const [trace, setTrace] = useState(freshTrace)
  const [size, setSize] = useState(5)
  const [repeatInput, setRepeatInput] = useState(false)
  const [compared, setCompared] = useState(false)
  const [approach, setApproach] = useState('')
  const [choiceFeedback, setChoiceFeedback] = useState('')
  const [choiceMistakes, setChoiceMistakes] = useState(0)
  const [reverseOrder, setReverseOrder] = useState(true)
  const [orderPrediction, setOrderPrediction] = useState('')
  const [orderMistakes, setOrderMistakes] = useState(0)
  const [orderRan, setOrderRan] = useState(false)
  const [orderIndex, setOrderIndex] = useState(0)
  const [testedBroken, setTestedBroken] = useState(false)
  const [blocks, setBlocks] = useState<BlockId[]>([...STARTING_BLOCKS])
  const [programResult, setProgramResult] = useState<ReturnType<typeof checkProgram> | null>(null)
  const [programMistakes, setProgramMistakes] = useState(0)
  const [answers, setAnswers] = useState<ChallengeAnswers>(emptyChallengeAnswers)
  const [assessment, setAssessment] = useState<ReturnType<typeof checkChallenge> | null>(null)
  const stageHeading = useRef<HTMLDivElement>(null)
  const stage = record.stage, values = PRACTICE_CASES[practiceCase].values
  const comparison = useMemo(() => compareApproaches(comparisonInput(size, repeatInput)), [size, repeatInput])
  const finishComparison = useCallback(()=>{if(size===5)setCompared(true)},[size])
  const frames = useMemo(() => orderExperiment([4, 7, 4], reverseOrder), [reverseOrder])
  const frame = frames[orderIndex]
  const challengeValues = useMemo(() => challengeCase(record.challenge.caseId), [record.challenge.caseId])
  const currentEvidence = record.evidence.find(item => item.id === stage)

  const save = useCallback((next: WorkshopRecord) => {
    setRecord(next)
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); setStorageWarning('') }
    catch { setStorageWarning('Your progress is available for this visit, but this browser could not save it.') }
  }, [])
  useImperativeHandle(ref, () => ({ showCheckedHelp: () => { setCheckedHelpOpen(true); setHintsUsed(previous => previous.includes(stage) ? previous : [...previous, stage]); if (stage === 'challenge') save({ ...record, challenge: { ...record.challenge, hintUsed: true } }) }, markTutorUsed: () => {
    setHintsUsed(previous => previous.includes(stage) ? previous : [...previous, stage])
    if (record.stage === 'challenge' && !record.challenge.hintUsed) save({ ...record, challenge: { ...record.challenge, hintUsed: true } })
  } }), [record, save, stage])
  const mark = (id: WorkshopStage, mistakes: number, hintUsed = hintsUsed.includes(id)) => save(saveStageEvidence(record, id, mistakes, hintUsed))
  const go = (id: WorkshopStage) => {
    save({ ...record, stage: id, challenge: id === 'challenge' && tutorOpen ? { ...record.challenge, hintUsed: true } : record.challenge }); setHintStage(null); setCheckedHelpOpen(false)
    requestAnimationFrame(() => {
      stageHeading.current?.focus({ preventScroll: true })
      stageHeading.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    })
  }
  const exportRecord = () => {
    const url = URL.createObjectURL(new Blob([workshopSummaryText(record)], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'PatternOS-learning-record.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const advance = () => go(STAGES[Math.min(STAGES.indexOf(stage) + 1, STAGES.length - 1)])
  const showHint = () => {
    setHintStage(stage)
    setHintsUsed(previous => previous.includes(stage) ? previous : [...previous, stage])
    if (stage === 'challenge') save({ ...record, challenge: { ...record.challenge, hintUsed: true } })
  }
  const context = stage === 'trace' ? `Input ${display(values)}. Current index ${trace.index}. Seen ${display(trace.seen)}. Phase ${trace.phase}. Last feedback: ${trace.feedback}`
      : stage === 'compare' ? `${size} input values. Comparison ${compared ? `run: ${comparison.listComparisons} actual list equality comparisons; ${comparison.setMembershipCalls} Set membership API calls (not internal operations or timings).` : 'not run yet.'} Selected approach: ${approach || 'none'}. ${choiceFeedback}`
      : stage === 'order' ? `Student is testing ${reverseOrder ? 'add then check (buggy)' : 'check then add'}. Run ${orderRan ? `at index ${orderIndex}; current ${frame.value}, before ${display(frame.before)}, membership ${frame.checkFound}, actual earlier occurrence ${frame.actualEarlier}` : 'not started'}.`
      : stage === 'build' ? `Student-assembled pseudocode order: ${blocks.map(id => BLOCKS[id].text).join(' / ')}. Executed checks: ${programResult ? `${programResult.cases.filter(item => item.passed).length}/${programResult.cases.length} passing` : 'not run'}.`
      : `Fresh independent case ${record.challenge.caseId + 1}: ${display(challengeValues)}. ${assessment ? assessment.passed ? 'Check passed.' : `Needs work: ${assessment.errors.join(' ')}` : 'Not submitted.'} Corrected attempts ${record.challenge.mistakes}; hint or tutor opened ${record.challenge.hintUsed}.`
  const checkedHelp = stage === 'trace' ? checkedTraceHelp(values, trace) : stage === 'compare' ? {title:'Choose storage for the operation you repeat',body:'A list checks saved numbers one by one. A Set supports a fast average lookup for “have I seen this value?”. Both are valid ways to remember earlier values.',next:'Compare the checks, then choose the method that avoids searching the saved list. With average constant-time Set operations, n values take expected O(n) time and up to O(n) extra space.'} : stage === 'build' ? {title:'Build a plan with a clear ending',body:explainBlockOrder(blocks),next:'Move the cards, then run the six examples. Reading this help does not complete the checkpoint.'} : stage === 'order' ? {title:'Keep earlier values separate from the current one',body:'If you save the first 4 before checking, the Set already contains that same 4. It falsely looks like an earlier repeat.',next:'Test Add → check, then compare it with Check → add. The first check in the fixed version must use an empty Set.'} : {title:'A reminder for your fresh attempt',body:'A Set remembers earlier distinct values. Check before adding, and say no repeat only after the whole input is checked.',next:'Apply the rule to your displayed input. This attempt now records help opened. For a fresh independent check, close help and choose Give me a new case.'}
  const tutorContext = `CURRENT WORKSHOP: Contains Duplicate / ${STAGE_NAMES[stage]}. ${context}\nAPP-CHECKED STEP GUIDANCE: ${checkedHelp.body} Next: ${checkedHelp.next}\nBEST VERIFIED CHECKPOINT RECORD (may refer to an earlier case): ${record.evidence.map(item => `${item.id}${item.caseId === undefined ? '' : ` case ${item.caseId + 1}`}: ${item.mistakes} corrections, help ${item.hintUsed}; ${item.id === 'challenge' && !item.mistakes && !item.hintUsed ? 'one bounded check without feedback' : 'guided practice, not independent mastery'}`).join('; ') || 'none yet'}. Use the current input, saved values and phase above as the source of truth. Answer the latest question directly in at most one small teaching step. If checking a value, compare it only with values saved BEFORE it; explain the check before any save. If the student understands this example, bridge to choosing the structure: a list searches earlier values one by one, while a Set supports fast average membership checks. Then explain expected O(n) time and O(n) extra space when requested. Basic example completion does not mean the technical lesson is finished. Never invent another input, claim unexecuted code passed, or restart a completed exercise unless asked.`
  useEffect(() => { onContextChange(tutorContext) }, [tutorContext, onContextChange])
  const predict = (answer: boolean) => {
    const next = predictMembership(values, trace, answer)
    setTrace(next)
    if (next.phase === 'complete') mark('trace', next.mistakes)
  }
  const add = () => { const next = recordCurrent(values, trace); setTrace(next); if (next.phase === 'complete') mark('trace', next.mistakes) }
  const chooseApproach = () => {
    if (approach === 'set') { setChoiceFeedback('Yes. A Set helps us ask whether a number was saved earlier. Always check first, then save a new number.'); mark('compare', choiceMistakes) }
    else { setChoiceMistakes(value => value + 1); setChoiceFeedback(approach === 'list' ? 'A list works, but you may have to compare with every saved number. Which option lets you ask whether the number is saved?' : 'Sorting can also reveal adjacent equal values, but usually costs O(n log n) and may change the input order. Here we are practising the one-pass membership approach.') }
  }
  const runOrder = () => { setOrderRan(true); setOrderIndex(0); if (reverseOrder && orderPrediction === 'true') setTestedBroken(true) }
  const stepOrder = () => {
    const next = Math.min(orderIndex + 1, frames.length - 1); setOrderIndex(next)
    if (!reverseOrder && testedBroken && next === frames.length - 1) mark('order', orderMistakes)
  }
  const move = (index: number, direction: number) => {
    const next = [...blocks], target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setBlocks(next); setProgramResult(null)
  }
  const runProgram = () => {
    const result = checkProgram(blocks); setProgramResult(result)
    if (result.passed) mark('build', programMistakes)
    else setProgramMistakes(value => value + 1)
  }
  const submitChallenge = () => {
    const result = checkChallenge(challengeValues, answers); setAssessment(result)
    if (result.passed) mark('challenge', record.challenge.mistakes, record.challenge.hintUsed)
    else save({ ...record, challenge: { ...record.challenge, mistakes: record.challenge.mistakes + 1 } })
  }
  const newCase = () => {
    setCheckedHelpOpen(false)
    save({ ...record, challenge: { caseId: record.challenge.caseId + 1, mistakes: 0, hintUsed: tutorOpen } })
    setAnswers(emptyChallengeAnswers()); setAssessment(null); setHintStage(null)
  }
  const selectAnswer = (key: keyof ChallengeAnswers, label: string, options: [string, string][]) => <label className="lab-question" key={key}><span>{label}</span><select aria-label={label} value={answers[key]} onChange={event => { setAnswers({ ...answers, [key]: event.target.value }); setAssessment(null) }}><option value="">Choose an answer</option>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>

  return <section className="duplicate-lab" aria-label="Contains Duplicate interactive workshop">
    <div className="lab-heading"><div><p className="lab-eyebrow">FIELDWORK / 01</p><h3>Contains Duplicate</h3><p>Find a repeated number · five hands-on checkpoints · no AI download needed</p></div><span className="lab-progress" aria-label={`${record.evidence.length} of 5 checkpoints recorded`}>{record.evidence.length}<span> / 5 recorded</span></span></div>
    <p className="lab-caption">Your route: understand the example → choose a data structure → check the rule → build a plan → try a fresh example. You can complete this journey without writing code.</p><nav className="lab-stages" aria-label="Workshop stages">{STAGES.map((id, index) => <button key={id} aria-current={stage === id ? 'step' : undefined} onClick={() => go(id)}><span>{record.evidence.some(item => item.id === id) ? '✓' : `0${index + 1}`}</span>{STAGE_NAMES[id]}</button>)}</nav>
    <div key={stage} className="lesson-stage-motion"><div ref={stageHeading} tabIndex={-1} className="lab-stage-title" aria-label={STAGE_NAMES[stage]}><div><p className="lab-eyebrow">CHECKPOINT 0{STAGES.indexOf(stage) + 1}</p><h4>{STAGE_NAMES[stage]}</h4></div><button className="lab-text-button" onClick={onAskTutor}>Ask the tutor about this step ↗</button></div>

    <div className="lab-checked-help"><button className="lab-text-button" aria-expanded={checkedHelpOpen} onClick={()=>{if(!checkedHelpOpen){setHintsUsed(previous=>previous.includes(stage)?previous:[...previous,stage]);if(stage==='challenge')save({...record,challenge:{...record.challenge,hintUsed:true}})}setCheckedHelpOpen(value=>!value)}}>{checkedHelpOpen?'Close checked help':'Help with this step · no AI needed'}</button>{checkedHelpOpen&&<aside className="lab-explainer" aria-label="App-checked workshop help"><p className="lab-eyebrow">APP-CHECKED HELP / NOT AN AI REPLY</p><h5>{checkedHelp.title}</h5><p>{checkedHelp.body}</p><p><strong>Next action:</strong> {checkedHelp.next}</p><small>Opening help counts as assistance. It never awards a checkpoint.</small></aside>}</div>
    {stage === 'trace' && <div className="lab-stage-body">
      <p>Look at one number at a time. First ask: “Did this number appear earlier?” If it is new, save it. If it appeared before, we found a repeat.</p>
      <label className="lab-inline-label">Practice input<select value={practiceCase} onChange={event => { setPracticeCase(Number(event.target.value)); setTrace(freshTrace()); setHintStage(null) }}>{PRACTICE_CASES.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}</select></label>
      <div className="lab-values" aria-label="Workshop input values">{values.map((value, index) => <div key={index} className={index === trace.index && trace.phase !== 'complete' ? 'is-current' : index < trace.index ? 'is-processed' : ''}><small>position {index + 1}</small><strong>{value}</strong></div>)}</div>
      <div className="lab-seen"><span>NUMBERS SAVED SO FAR</span><strong key={display(trace.seen)}>{display(trace.seen)}</strong></div>
      {trace.phase === 'predict' && <div className="lab-decision"><p>Is <strong>{values[trace.index]}</strong> already in {display(trace.seen)}?</p><div className="lab-actions"><button onClick={() => predict(true)}>Yes, already seen</button><button onClick={() => predict(false)}>No, a new value</button></div></div>}
      {trace.phase === 'add' && <button className="lab-primary" onClick={add}>Save {values[trace.index]} →</button>}
      <p className="lab-feedback" role="status">{trace.feedback}</p>
      {trace.phase === 'complete' && <div className="lab-feedback"><p>You found what the answer means. Next, learn how to choose the tool that solves it efficiently.</p><button className="lab-primary" onClick={()=>go('compare')}>Why use a Set? Compare the methods →</button></div>}
      {trace.phase === 'complete' && <div className="lab-outcome"><strong>Result: {String(trace.result)}</strong><span>{trace.mistakes ? `Guided practice · ${trace.mistakes} corrected predictions` : 'Guided practice · no corrected predictions in this run'}</span></div>}
      <button className="lab-text-button" onClick={() => setTrace(freshTrace())}>Restart this exercise</button>
    </div>}

    {stage === 'compare' && <div className="lab-stage-body">
      <p>We want to find a repeated number. Here are two ways to remember the numbers we have already checked.</p>
      <ApproachWalkthrough key={String(repeatInput)} repeats={repeatInput} onFinish={finishComparison}/>
      <details className="lab-explainer"><summary>Try more numbers or add a repeat</summary>
      <div className="lab-actions"><label className="lab-inline-label">How many numbers?<select value={size} onChange={event => { setSize(Number(event.target.value)); setCompared(false); setChoiceFeedback('') }}>{[5, 20, 100, 1000].map(n => <option key={n} value={n}>{n} values</option>)}</select></label><label className="lab-inline-label">Example type<select value={String(repeatInput)} onChange={event => { setRepeatInput(event.target.value === 'true'); setCompared(false) }}><option value="false">Every number is different</option><option value="true">Last number repeats the first</option></select></label><button className="lab-primary" onClick={() => setCompared(true)}>Count the checks</button></div>
      {compared && <><div className="lab-comparison" role="status"><article><p>SAVED LIST</p><strong>{comparison.listComparisons.toLocaleString()}</strong><span>number pairs compared</span><small>Looks through the saved numbers one by one.</small></article><article><p>SET</p><strong>{comparison.setMembershipCalls.toLocaleString()}</strong><span>“already saved?” questions</span><small>One question for each number checked.</small></article></div><p className="lab-caption">Both answers: {comparison.result?'a repeat was found (true)':'no repeat was found (false)'}. Both checked {comparison.visited} numbers. These counters count different activities, not elapsed time or all the work inside a Set.</p></>}
      </details>
      <details className="lab-explainer"><summary>Why does the list do more checking?</summary><p>For five different numbers, the saved list makes 0, then 1, then 2, then 3, then 4 comparisons: 10 altogether. A Set gets one “already saved?” question for each number: 5 questions. It is built for this kind of lookup, so it usually scales better as the list grows.</p><details><summary>Technical names, when you are ready</summary><p>The list uses O(n²) comparisons in the no-repeat case. With average constant-time Set operations, the Set approach takes expected O(n) time. Both may store O(n) numbers. A Set lookup is called a membership check; it is not guaranteed to be exactly one internal operation.</p></details></details>
      <div className="lab-choice"><label className="lab-question"><span>Which method avoids checking saved numbers one by one?</span><select aria-label="Choose a comparison method" value={approach} onChange={event => setApproach(event.target.value)}><option value="">Choose a method</option><option value="list">Compare with each saved number</option><option value="set">Ask a Set if the number is saved</option><option value="sort">Sort, then check nearby numbers</option></select></label><button disabled={!compared || !approach} onClick={chooseApproach}>Check my answer</button></div><p role="status" className="lab-feedback">{choiceFeedback}</p>
    </div>}

    {stage === 'order' && <div className="lab-stage-body">
      <p>Should we check a number before saving it, or save it first? Try the first 4 in <strong>[4, 7, 4]</strong> and see what goes wrong.</p>
      <div className="lab-order-switch" aria-label="Operation order"><button aria-pressed={reverseOrder} onClick={() => { setReverseOrder(true); setOrderRan(false); setOrderIndex(0) }}>Add → check <span>version with a mistake</span></button><button aria-pressed={!reverseOrder} onClick={() => { setReverseOrder(false); setOrderRan(false); setOrderIndex(0) }}>Check → add <span>fixed version</span></button></div>
      {reverseOrder && <div className="lab-decision"><p>If we save the first 4 and then look for 4, will we find it?</p><div className="lab-actions"><button onClick={() => setOrderPrediction('true')} aria-pressed={orderPrediction === 'true'}>Yes, it will</button><button onClick={() => { setOrderPrediction('false'); setOrderMistakes(value => value + 1) }} aria-pressed={orderPrediction === 'false'}>No, it will not</button></div>{orderPrediction === 'false' && <p role="status">Adding 4 changes the empty Set to {'{4}'}. What will checking for 4 find now?</p>}</div>}
      <button className="lab-primary" disabled={reverseOrder && orderPrediction !== 'true'} onClick={runOrder}>Run this order</button>
      {orderRan && <><div className="lab-order-frames"><article><small>BEFORE · value {frame.value}</small><strong>{display(frame.before)}</strong></article><article><small>CHECK ANSWERS</small><strong>{String(frame.checkFound)}</strong></article><article><small>AFTER THIS VALUE</small><strong>{display(frame.after)}</strong></article></div><p className={`lab-feedback ${reverseOrder ? 'lab-warning' : ''}`} role="status">{reverseOrder ? 'Wrong answer: the first 4 finds itself because we saved it too soon. It is not a repeat. Check first, then save.' : frame.checkFound ? 'This 4 matches a genuinely earlier 4. The repaired version correctly returns true here.' : 'This value was not present before the check. Record it, then continue.'}</p>{!reverseOrder && orderIndex < frames.length - 1 && <button onClick={stepOrder}>Inspect the next value →</button>}{!reverseOrder && !testedBroken && <p className="lab-caption">Try the version with a mistake too, so you can see why the repair matters.</p>}</>}
    </div>}

    {stage === 'build' && <div className="lab-stage-body">
      <p>Build the full plan. First prepare an empty Set. Next, take one number at a time and do two actions: check it, then save it if it is new. Only say “no repeat” after checking the whole input. Use the arrows to move the cards.</p>
      <ol className="lab-code-blocks" aria-label="Your steps">{blocks.map((id, index) => <li data-step={id} key={id} className={(id === 'check' || id === 'add') ? 'is-nested' : ''}><span className="lab-line-number">{index + 1}</span><div><small>{BLOCKS[id].scope}</small><strong>{BLOCKS[id].text}</strong></div><div className="lab-move-buttons"><button disabled={index === 0} aria-label={`Move ${BLOCKS[id].text} up`} onClick={() => move(index, -1)}>↑</button><button disabled={index === blocks.length - 1} aria-label={`Move ${BLOCKS[id].text} down`} onClick={() => move(index, 1)}>↓</button></div></li>)}</ol>
      <div className="lab-actions"><button className="lab-primary" onClick={runProgram}>Try my steps on 6 examples</button><button onClick={() => { setBlocks([...STARTING_BLOCKS]); setProgramResult(null); setProgramMistakes(0) }}>Start these steps again</button></div>
      {programResult && !programResult.passed && <p className="lab-feedback">{explainBlockOrder(blocks)} The explanation question below does not move your cards. Use the ↑ / ↓ arrows above, then click “Try my steps on 6 examples” again.</p>}
      {programResult && <div className="lab-test-results"><h5 role="status">{programResult.passed ? 'Your steps worked on all six examples' : programResult.cases.some(item => item.error) ? 'Fix the card positions before running the examples' : 'Your plan gives a wrong answer'}</h5>{programResult.cases.some(item => item.error) ? <p role="status">{explainBlockOrder(blocks)} The examples have not run yet.</p> : <div className="lab-table-scroll"><table><thead><tr><th>Example input</th><th>Correct answer</th><th>Your plan’s answer</th></tr></thead><tbody>{programResult.cases.map((item, index) => <tr key={index}><td>{display(item.values)}</td><td>{String(item.expected)}</td><td>{item.error ?? `${String(item.result)} · ${item.passed ? 'pass' : 'needs repair'}`}</td></tr>)}</tbody></table></div>}<p className="lab-caption">When the card positions are valid, the app follows your steps on six examples. This does not check every possible input or code you wrote yourself.</p></div>}
      {programResult?.passed && <details className="lab-explainer"><summary>Optional: see a JavaScript reference</summary><p>This is a reference implementation of the approach you assembled. Your own coding has not been assessed.</p><pre>{`function containsDuplicate(nums) {
  const seen = new Set();
  for (const value of nums) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}`}</pre></details>}
    </div>}

    {stage === 'challenge' && <div className="lab-stage-body">
      <p>Try a new example on your own. We will use a Set to remember numbers. Answer the short questions below.</p>
      <div className="lab-challenge-input" aria-label="Independent challenge input">{display(challengeValues)}</div>
      <p className="lab-caption">Case {record.challenge.caseId + 1} · {record.challenge.mistakes} answers corrected · {record.challenge.hintUsed ? 'hint or tutor opened' : 'no hint or tutor opened'}</p>
      <div className="lab-answer-grid">
        {selectAnswer('repeats', 'Does this input contain a repeat?', [['true', 'Yes — return true'], ['false', 'No — return false']])}
        {selectAnswer('structure', 'What helps us quickly ask whether a number appeared before?', [['list', 'An ordinary seen list'], ['set', 'A Set'], ['sort', 'Sorting the input']])}
        {selectAnswer('order', 'For each number, what should we do first?', [['add-first', 'Add, then check membership'], ['check-first', 'Check membership, then add if new']])}
        {selectAnswer('reason', 'When we check a number, what should already be saved?', [['current', 'The current value and earlier values'], ['earlier', 'Only values from earlier positions'], ['all', 'Every value in the entire input']])}
        {selectAnswer('time', 'If we check n numbers once, how does the total work grow?', [['constant', 'O(1) for the whole input'], ['linear', 'O(n): more numbers mean proportionally more work'], ['quadratic', 'O(n²) for one pass']])}
        {selectAnswer('space', 'How many different numbers might we need to save?', [['constant', 'O(1), regardless of input size'], ['linear', 'O(n): we may save one entry per number'], ['quadratic', 'O(n²), storing every possible pair']])}
      </div>
      <div className="lab-actions"><button className="lab-primary" disabled={Object.values(answers).some(value => !value)} onClick={submitChallenge}>Check my understanding</button><button onClick={newCase}>Give me a new case</button></div>
      {assessment && <div className={`lab-assessment ${assessment.passed ? 'is-passed' : ''}`} role="status">{assessment.passed ? <><strong>{record.challenge.mistakes || record.challenge.hintUsed ? 'Completed with feedback, a hint, or the tutor open' : 'You solved this example without help'}</strong><p>You connected the example, Set choice, check-before-add rule and complexity. This checks your understanding of this example. Your coding has not been checked.</p></> : <><strong>Some parts need another look</strong><ul>{assessment.errors.map(error => <li key={error}>{error}</li>)}</ul><p>Your next submission on this case will be recorded as practice with feedback. Close the tutor and choose a new case to start a fresh independent check.</p></>}</div>}
    </div>}

    {((stage==='trace'&&trace.mistakes>0)||(stage==='compare'&&choiceMistakes>0)||(stage==='order'&&orderMistakes>0)||(stage==='build'&&programResult&&!programResult.passed)||(stage==='challenge'&&assessment&&!assessment.passed))&&<div className="lab-stage-body"><MistakeClinic key={stage} topic={stage==='build'?(programResult?.cases.some(item=>item.error)?'plan':'order'):stage==='trace'?'presence':stage==='compare'||(stage==='challenge'&&(answers.time!=='linear'||answers.space!=='linear'))?'cost':'order'}/></div>}
    </div><div className="lab-stage-footer"><div className="lab-actions"><button className="lab-text-button" onClick={showHint}>Show a hint</button>{stage !== 'challenge' && <button className="lab-primary" onClick={advance}>{currentEvidence ? 'Continue →' : 'Look at the next step →'}</button>}</div>{hintStage === stage && <p className="lab-hint" role="status">{HINTS[stage]}</p>}</div>
    <div className="lab-stage-body"><h4>Your learning evidence</h4><p>{record.evidence.length} of 5 activities recorded. Next: {STAGE_NAMES[STAGES.find(id => !record.evidence.some(item => item.id === id)) ?? 'challenge']}. A fresh independent case helps you check whether you can apply the idea again.</p><p>Use this summary to see what you completed, what needs revision, and which fresh example you solved without help. You can include it as evidence in your project report.</p><button className="lab-primary" onClick={()=>setReportOpen(true)}>View learning report</button>{reportOpen && <section className="learning-report-preview" aria-label="Learning report preview"><div className="lab-actions"><button onClick={()=>reportFrame.current?.contentWindow?.print()}>Print / Save as PDF</button><button onClick={exportRecord}>Download text copy</button><button onClick={()=>setReportOpen(false)}>Close report</button></div><iframe ref={reportFrame} title="Your learning report" srcDoc={workshopSummary(record)} style={{width:'100%',height:'650px',border:'1px solid #d6d2c3',background:'white'}} /></section>}</div><details className="lab-record"><summary>Your workshop record · {record.evidence.length} / 5 checkpoints</summary><p>Best completed attempts are retained in this browser. Viewing an explanation is not proof of understanding. Guided exercises restart on reload; completed evidence and independent-check feedback counts are preserved.</p><ul>{STAGES.map(id => { const evidence = record.evidence.find(item => item.id === id); return <li key={id}><strong>{STAGE_NAMES[id]}{evidence?.caseId !== undefined ? ` · case ${evidence.caseId + 1}` : ''}</strong><span>{evidence ? id === 'challenge' && !evidence.mistakes && !evidence.hintUsed ? 'One example passed without help' : `Completed practice · ${evidence.mistakes} corrections${evidence.hintUsed ? ' · hint used' : ''}` : 'Not demonstrated yet'}</span></li> })}</ul><p>Coding: not assessed by this workshop.</p></details>
    {storageWarning && <p role="status" className="lab-warning">{storageWarning}</p>}
  </section>
}
