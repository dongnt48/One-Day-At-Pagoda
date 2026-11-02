// Browser-test entry point only: start within the first minute of a gathering.
// Production startup never imports this module.
const realNow=Date.now;
const now=realNow(),offset=15*60_000-(now%(15*60_000))+30_000;
Date.now=()=>realNow()+offset;
await import('../dist/server.js');
