# Contains Duplicate — final functional rehearsal

Date: 6 November 2026. Isolated test origin: http://127.0.0.1:5194/practice?problem=contains-duplicate. This was an agent-run software rehearsal, not a human learning study or a certification of the user's ability.

## Browser results

1. Checked and saved 4, checked and saved 7, then identified the repeated 4 in [4,7,4]. Trace checkpoint recorded.
2. Inspected number 5 in the comparison: 10 saved-list comparisons versus 5 Set membership calls. Selected Set and passed the choice checkpoint. These are different operation units, not a speed benchmark.
3. Predicted the add-before-check self-match, ran the buggy version, then traversed the repaired check-before-add version. Repair checkpoint recorded.
4. Moved the check card above the save card. The plan passed all six examples: [4,7,4], [4,7,9], [7], [-2,0,-2], [0,0] and []. Plan checkpoint recorded.
5. On fresh case [43,21,-5,43], submitted the repeat result, Set choice, check-first order, earlier-values invariant and linear time/space answers. The case passed without help or corrections.
6. Opened the learning report: five of five checkpoints, zero corrections in retained attempts, and one bounded independent example. Guided drafts restarted during development hot reloads; recorded evidence was retained and the remaining checkpoints were completed through the interface.

## Actual installed model check

Model: qwen2.5:7b via Ollama. The script scripts/check-core-tutor.mjs calls the application's generateLessonTurn and desktopCompletion adapter through the local Vite proxy. This is a real model pipeline test, not a simulated browser chat. Exact final questions, replies and response times are saved in docs/reviews/real-tutor-check.json.

The saved-[4]/next-7 question was answered with the relevant membership check. The comparison question produced relevant but sometimes imprecise wording about average Set lookup. Earlier real drafts equated lookup with one comparison and offered an unwanted next activity. Added bounded rewrite checks for comparison-only follow-up questions and explicit one-operation/comparison claims. These checks do not prove factual correctness or cover every possible misleading phrasing. The latest recorded comparison remains qualitative rather than a precise Big O explanation; the app-checked workshop explanation is the reliable teaching reference.

Observed first cold request took about 69 seconds; subsequent observed requests took roughly 1–3 seconds on this machine. These are observations, not minimum hardware specifications or performance guarantees. Ollama initially stopped; it was restarted persistently before successful checks. Desktop inference is a local development configuration and is not hosted by the public Vercel site.

## Changes from this rehearsal

- Comparison-only prompts now request an explanation without a new task; bounded rewrites respect that instruction too.
- Explicit single-comparison claims about Set lookup are withheld for rewrite, while disclaimers such as 'does not mean one comparison' are allowed.
- Comparison and independent-answer selects now have explicit accessible labels.

See final-flow test/build logs in scratch for local verification. This rehearsal does not verify arbitrary student code or guarantee every generated AI reply is correct.
