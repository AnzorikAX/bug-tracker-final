#!/bin/sh
set -eu

npm run dev -- --hostname 0.0.0.0 --port 3000 &
DEV_PID=$!

# Wait until dev server is reachable, then prewarm key routes.
node -e "
const targets=['http://127.0.0.1:3000/auth/login','http://127.0.0.1:3000/profile'];
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  for(let i=0;i<90;i++){
    try {
      const r=await fetch('http://127.0.0.1:3000/auth/login');
      if(r.ok){
        for(const t of targets){
          try { await fetch(t); } catch {}
        }
        console.log('[prewarm] completed');
        return;
      }
    } catch {}
    await sleep(1000);
  }
  console.log('[prewarm] skipped (timeout)');
})();
" >/proc/1/fd/1 2>/proc/1/fd/2 &

wait $DEV_PID
