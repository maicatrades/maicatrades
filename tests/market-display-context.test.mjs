import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSessionDate,formatContextTime,equalWeightContext,benchmarkSessionContext,recordedBreadthBaseline} from '../src/lib/market-display-context.ts';
test('session labels retain calendar dates and reject invalid or missing dates',()=>{
 assert.match(formatSessionDate('2026-11-18'),/Wed, Nov 18, 2026/);
 for(const date of [null,undefined,'not-a-date','2026-02-30'])assert.equal(formatSessionDate(date),'Session date unavailable');
});
test('snapshot times use ET and preserve distinct source timestamps including DST',()=>{
 assert.match(formatContextTime('2026-11-18T15:38:54.355+00:00'),/Nov 18, 10:38:54 AM EST/);
 assert.match(formatContextTime('2026-11-18T15:33:36.666Z'),/Nov 18, 10:33:36 AM EST/);
 assert.match(formatContextTime('2026-07-08T14:00:00Z'),/10:00:00 AM EDT/);
 assert.match(formatContextTime('2026-11-19T01:00:00Z'),/Nov 18, 8:00:00 PM EST/);
 for(const value of [null,'invalid','2026-11-18'])assert.equal(formatContextTime(value),'Timestamp unavailable');
});
test('equal-weight comparison does not claim that overall participation is broad',()=>{
 const message=equalWeightContext({leader:'RSP',relativePerformance:.2});assert.match(message,/RSP ahead of SPY by 0.20 percentage points/);assert.doesNotMatch(message,/Broad participation/);
 assert.match(equalWeightContext({leader:'SPY',relativePerformance:-.15}),/SPY ahead of RSP/);
 assert.match(equalWeightContext({leader:'Equal',relativePerformance:.03}),/Similar performance/);
 assert.equal(equalWeightContext(null),'Comparison unavailable');
});
test('positive sessions remain positive in prose even with a weak market backdrop',()=>{
 const message=benchmarkSessionContext('QQQ',.21,4);assert.match(message,/QQQ is up 0.21%/);assert.match(message,/separate market backdrop is 4\/100/);assert.doesNotMatch(message,/down|Weak price action/);
 assert.match(benchmarkSessionContext('SPY',-.21,4),/SPY is down 0.21%/);
 assert.match(benchmarkSessionContext('IWM',0,null),/unchanged/);
 assert.match(benchmarkSessionContext('IWM',.69,null),/backdrop is unavailable/);
});
test('breadth comparisons do not mislabel available records as consecutive trading sessions',()=>{
 assert.equal(recordedBreadthBaseline(5),'average of 5 recorded sessions');assert.equal(recordedBreadthBaseline(1),'last recorded session');assert.equal(recordedBreadthBaseline(0),'recorded history unavailable');
});
