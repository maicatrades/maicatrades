// Local-only, browser-intercepted integration test. No app source or database edits.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const origin = new URL(base);
if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) {
  throw Error('This test may only run against localhost.');
}
function fixtures(direction) {
  const short = direction === 'SHORT';
  const stamp = new Date().toISOString();
  const idea = {
    symbol: 'TEST', companyName: 'Fictional browser-test setup', direction,
    price: 100, selectedPrice: 100, previousClose: 100, change: 0, changePercent: 0,
    setup: 'Fictional test only', setupType: 'UI verification', holdingPeriod: 'Test only',
    entry: 100, stopLoss: short ? 105 : 95, target: short ? 90 : 110,
    riskReward: 2, confidenceScore: 75, confidenceStars: 4,
    tradeBias: short ? 'Bearish' : 'Bullish',
    chart: Array.from({length: 12}, (_, i) => ({date: `2026-11-${String(i + 1).padStart(2, '0')}`, close: 98 + i / 6, ema20: 99})),
  };
  return {
    '/api/trade-idea': {success: true, hasQualifiedSetup: true, hasActiveTradeIdea: true, idea,
      weekly: {locked: true, status: 'WAITING_FOR_ENTRY', entryTriggeredAt: null}, updatedAt: stamp},
    '/api/market-score': {success: true, score: 50, rawScore: 50, label: 'Neutral',
      snapshotStatus: 'provisional', scoreAsOf: '2026-11-17',
      environment: {bias: 'Neutral', riskLevel: 'Moderate', approach: 'Fictional test context.'},
      components: {trend: {score:20,maxScore:40},momentum:{score:12,maxScore:25},sectorStrength:{score:10,maxScore:20},volatility:{score:8,maxScore:15}},
      fiveDayAverage: null, fiveDayAverageSampleSize: 0, fiveDayAverageDates: [], updatedAt: stamp},
    '/api/market-ticker': {success:true, updatedAt:stamp, data:['SPY','QQQ','DIA','IWM','VIX'].map(symbol=>({symbol,price:100,changePercent:0,session:'REGULAR',sessionLabel:null,quoteTime:Date.now()/1000,regularSource:'Fictional test'}))},
    '/api/market-pulse': {success:true, benchmarks:['SPY','QQQ','IWM','VIX'].map(symbol=>({symbol,name:symbol,status:'Neutral',price:100,previousClose:100,change:0,changePercent:0,positive:true,description:'Fictional test',quoteTime:Date.now()/1000})),
      summary:{bullish:0,neutral:3,watch:0,lowRisk:0,riskSignals:0,positiveBenchmarks:0,negativeBenchmarks:0,totalMarketBenchmarks:3,averageMarketChange:0,marketTone:'Mixed'}},
    '/api/economic-calendar': {success:true,events:[],updatedAt:stamp},
    '/api/watchlist': {success:true,items:[],updatedAt:stamp},
  };
}
(async () => {
  let browser;
  try {
    console.log('Checking the local Trade Idea button with fictional data.');
    browser = await chromium.launch({channel: 'chrome', headless: true});
    for (const direction of ['LONG', 'SHORT']) {
      const context = await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
      const data = fixtures(direction);
      let tradeRequests = 0;
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== origin.origin) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        if (request.method() !== 'GET') return route.fulfill({status:405,body:'Test disallows API mutations'});
        if (url.pathname === '/api/trade-idea') tradeRequests++;
        const payload = data[url.pathname];
        return route.fulfill({status:payload ? 200 : 503,contentType:'application/json',body:JSON.stringify(payload || {success:false,error:'Unavailable in fictional test'})});
      });
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      await page.goto(new URL('/dashboard', base).href);
      const button = page.getByRole('button',{name:'Calculate My Position',exact:true});
      await button.waitFor({state:'visible'});
      assert.ok(tradeRequests > 0, 'Trade Idea must be loaded from the intercepted fixture');
      await button.click();
      await page.waitForURL(url => url.pathname === '/tools/position-size');
      const params = new URL(page.url()).searchParams;
      assert.equal(params.get('symbol'),'TEST');
      assert.equal(params.get('direction'),direction.toLowerCase());
      assert.equal(params.get('entry'),'100');
      assert.equal(params.get('stop'),direction === 'SHORT' ? '105' : '95');
      assert.equal(params.get('target'),direction === 'SHORT' ? '90' : '110');
      assert.equal(params.get('status'),'WAITING_FOR_ENTRY');
      assert.equal(params.has('account'),false);
      await page.getByRole('status').filter({hasText:'Planned levels for TEST'}).waitFor();
      const notice = await page.getByRole('status').filter({hasText:'Planned levels for TEST'}).innerText();
      assert.match(notice,/Entry has not been recorded as triggered/);
      await page.waitForFunction(({stop,target}) => {
        const values = Array.from(document.querySelectorAll('input'), input => input.value);
        return values.includes('100') && values.includes(stop) && values.includes(target);
      },{stop:direction==='SHORT'?'105':'95',target:direction==='SHORT'?'90':'110'});
      const summary = page.getByText('Trade Summary',{exact:true}).locator('..').locator('..');
      assert.equal(await summary.getByText('20',{exact:true}).count(),1);
      assert.equal(await summary.getByText('$2,000.00',{exact:true}).count(),1);
      assert.equal(await summary.getByText('$100.00',{exact:true}).count(),1);
      assert.equal(await summary.getByText('$200.00',{exact:true}).count(),1);
      console.log(`PASS ${direction}: actual dashboard button opens calculator with TEST, correct levels, untriggered notice and 20-share sizing.`);
      await context.close();
    }
    console.log('PASS: both Trade Idea button click-through tests completed. No production API requests or database writes were made.');
  } finally {
    if (browser) await browser.close();
  }
})().catch(error => {
  console.error('NOT VERIFIED:', error.message);
  console.error('Keep npm start running in the first terminal. This test needs Playwright and installed Google Chrome.');
  process.exitCode = 1;
});
