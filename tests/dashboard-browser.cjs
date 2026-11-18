const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const quoteTime=Date.parse('2026-11-13T21:00:00Z')/1000;
const idea={symbol:'QQQ',companyName:'Nasdaq 100 ETF',direction:'LONG',price:102,entry:100,stopLoss:95,target:110,previousClose:101,change:1,changePercent:0.99,setup:'Pullback',setupType:'Long swing',holdingPeriod:'3–10 sessions',riskReward:2,confidenceScore:75,confidenceStars:4,tradeBias:'Bullish',chart:[]};
await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;let data={success:false,error:'Fixture: unavailable'};let status=503;
 if(path==='/api/market-score'){status=200;data={success:true,score:41,rawScore:41.4,label:'Bearish',snapshotStatus:'provisional',scoreAsOf:'2026-11-13',explanation:'The market backdrop remains bearish while M122 participation is healthier.',environment:{bias:'Bearish',riskLevel:'Elevated',approach:'Require confirmation.'},components:{trend:{score:4,maxScore:40},momentum:{score:13,maxScore:25},sectorStrength:{score:15.4,maxScore:20},volatility:{score:9,maxScore:15}},fiveDayAverage:null,fiveDayAverageSampleSize:1,fiveDayAverageDates:['2026-11-13'],updatedAt:'2026-11-13T19:41:58Z'};}
 if(path==='/api/market-ticker'){status=200;data={success:true,data:['SPY','QQQ','DIA','IWM','VIX'].map(symbol=>({symbol,price:100,changePercent:symbol==='VIX'?3.21:-0.63,session:'REGULAR',sessionLabel:null,quoteTime,regularSource:'Yahoo Finance'})),updatedAt:'2026-11-13T21:01:00Z'};}
 if(path==='/api/trade-idea'){status=200;data={success:true,hasQualifiedSetup:true,idea,weekly:{status:'WAITING_FOR_ENTRY',locked:true}};}
 if(path==='/api/market-pulse'){status=200;data={success:true,benchmarks:['SPY','QQQ','IWM','VIX'].map(symbol=>({symbol,name:symbol,status:'Watch',price:100,previousClose:101,change:-1,changePercent:-0.99,positive:false,description:'Require confirmation.',quoteTime})),summary:{bullish:0,neutral:0,watch:3,lowRisk:0,riskSignals:3,positiveBenchmarks:0,negativeBenchmarks:3,totalMarketBenchmarks:3,averageMarketChange:-0.99,marketTone:'Defensive'}};}
 if(path==='/api/economic-calendar'){status=200;data={success:true,events:[{date:'Thursday, Nov 19, 2026',time:'8:30 AM',title:'Initial Jobless Claims',impact:'High',status:'Scheduled'}]};}
 if(path==='/api/watchlist'){status=200;data={success:true,items:[{symbol:'QQQ',price:100,changePercent:-0.99,status:'Neutral'}]};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
for(const width of [1440,390]){
 await page.setViewportSize({width,height:1000});await page.goto(''+(process.env.TEST_BASE_URL || 'http://127.0.0.1:3101')+'/dashboard');await page.getByRole('button',{name:'Calculate My Position'}).waitFor();
 assert.equal(await page.getByText('RTH · prior close',{exact:true}).count(),10); // two equal copies form the seamless loop
 assert.equal(await page.locator('.market-ticker-track > [aria-hidden="true"]').count(),5);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`page overflow at ${width}`);
 await page.screenshot({path:`${process.env.SCREENSHOT_DIR || '/tmp'}/maicatrades-dashboard-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Calculate My Position'}).click();await page.getByRole('status').filter({hasText:'Planned levels for QQQ'}).waitFor();
 assert.match(page.url(),/symbol=QQQ/);const values=await page.locator('input').evaluateAll(inputs=>inputs.map(i=>i.value));assert.ok(values.includes('100')&&values.includes('95')&&values.includes('110'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`calculator overflow at ${width}`);
}
await page.goto(''+(process.env.TEST_BASE_URL || 'http://127.0.0.1:3101')+'/tools/position-size?symbol=QQQ&direction=short&entry=100&stop=105&target=90&status=ACTIVE');await page.getByRole('status').filter({hasText:'Planned levels for QQQ'}).waitFor();
const vals=await page.locator('input').evaluateAll(inputs=>inputs.map(i=>i.value));assert.ok(vals.includes('105')&&vals.includes('90'));assert.deepEqual(errors,[]);
console.log(JSON.stringify({desktop:1440,mobile:390,tickerInstruments:5,calculatorLong:'passed',calculatorShort:'passed',horizontalOverflow:false,pageErrors:errors}));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
