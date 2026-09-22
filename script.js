(() => {
"use strict";
const $=id=>document.getElementById(id);
const money=n=>"₹"+new Intl.NumberFormat("en-IN",{maximumFractionDigits:0}).format(Math.max(0,Math.round(n)));
let unit="years", latestRows=[];

function emi(P, annualRate, months){
 if(months<=0)return 0;
 if(annualRate===0)return P/months;
 const r=annualRate/12/100, f=Math.pow(1+r,months);
 return P*r*f/(f-1);
}
function buildSchedule(P, annualRate, months, extra=0){
 let balance=P, base=emi(P,annualRate,months), rows=[];
 const r=annualRate/12/100;
 for(let m=1;m<=months && balance>0.005;m++){
   const interest=annualRate===0?0:balance*r;
   let payment=base+Math.max(0,extra);
   let principal=payment-interest;
   if(principal<=0) principal=0;
   if(principal>balance){principal=balance;payment=principal+interest}
   balance=Math.max(0,balance-principal);
   rows.push({m,payment,principal,interest,balance});
 }
 return rows;
}
function values(){
 const P=parseFloat(String($("amount").value).replace(/[^0-9.]/g,""));
 const R=parseFloat($("rate").value), T=parseFloat($("tenure").value);
 const extra=Math.max(0,parseFloat(String($("extraMonthly").value||0).replace(/[^0-9.]/g,""))||0);
 const months=unit==="years"?T*12:T;
 if(!Number.isFinite(P)||P<100000||P>100000000||!Number.isFinite(R)||R<0||R>30||!Number.isFinite(T)||T<1)return null;
 return {P,R,T,months,extra};
}
function update(){
 const v=values(); if(!v)return;
 const rows=buildSchedule(v.P,v.R,v.months,v.extra);
 latestRows=rows;
 const total=rows.reduce((s,x)=>s+x.payment,0), interest=rows.reduce((s,x)=>s+x.interest,0);
 const base=emi(v.P,v.R,v.months);
 $("emi").textContent=money(base+v.extra);
 $("principal").textContent=money(v.P);
 $("interest").textContent=money(interest);
 $("total").textContent=money(total);
 $("ratio").textContent=(v.P?interest/v.P*100:0).toFixed(1)+"%";
 $("legendPrincipal").textContent=money(v.P);
 $("legendInterest").textContent=money(interest);
 const ps=total?Math.min(100,v.P/total*100):100,is=100-ps;
 $("interestShare").textContent=Math.round(is)+"%";
 $("principalArc").style.strokeDasharray=`${ps} ${100-ps}`;
 $("interestArc").style.strokeDasharray=`${is} ${100-is}`;
 $("interestArc").style.strokeDashoffset=-ps;
 const years=Math.max(1,Math.ceil(rows.length/12));
 $("interestMessage").textContent=interest>v.P?"Interest principal से अधिक है":"Interest cost principal से कम है";
 $("interestMessageText").textContent=`इस scenario में लगभग ${money(interest)} interest बनता है। Tenure या rate बदलकर total cost compare करें।`;
 renderSchedule(rows);
 updateUrl(v);
}
function renderSchedule(rows){
 const body=$("scheduleBody"); body.textContent="";
 const years=Math.ceil(rows.length/12);
 for(let y=0;y<years;y++){
   const chunk=rows.slice(y*12,y*12+12);
   const p=chunk.reduce((s,x)=>s+x.principal,0), i=chunk.reduce((s,x)=>s+x.interest,0), t=chunk.reduce((s,x)=>s+x.payment,0), b=chunk.at(-1)?.balance||0;
   const tr=document.createElement("tr"); tr.className="year-row";
   tr.innerHTML=`<td><strong>Year ${y+1}</strong></td><td>${money(p)}</td><td>${money(i)}</td><td>${money(t)}</td><td>${money(b)}</td><td><button class="expand-btn" type="button" aria-expanded="false">+</button></td>`;
   const detail=document.createElement("tr"); detail.className="month-row"; detail.hidden=true;
   const td=document.createElement("td"); td.colSpan=6;
   const sc=document.createElement("div"); sc.className="table-scroll";
   const table=document.createElement("table"); table.innerHTML="<thead><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody></tbody>";
   chunk.forEach(x=>{const m=document.createElement("tr");m.innerHTML=`<td>${x.m}</td><td>${money(x.payment)}</td><td>${money(x.principal)}</td><td>${money(x.interest)}</td><td>${money(x.balance)}</td>`;table.querySelector("tbody").appendChild(m)});
   sc.appendChild(table);td.appendChild(sc);detail.appendChild(td);body.append(tr,detail);
 }
}
function syncRange(){
 $("amountRange").value=Math.min(100000000,Math.max(100000,parseFloat(String($("amount").value).replace(/[^0-9.]/g,""))||3000000));
 $("rateRange").value=Math.min(30,Math.max(0,parseFloat($("rate").value)||8.5));
 const max=unit==="years"?30:360;
 $("tenureRange").min=1;$("tenureRange").max=max;
 $("tenureRange").value=Math.min(max,Math.max(1,parseFloat($("tenure").value)||20));
 update();
}
function updateUrl(v){
 const p=new URLSearchParams({amount:Math.round(v.P),rate:v.R,tenure:v.T,unit});
 history.replaceState(null,"",location.pathname+"?"+p.toString()+"#calculator");
}
function loadUrl(){
 const q=new URLSearchParams(location.search);
 if(q.has("amount"))$("amount").value=q.get("amount");
 if(q.has("rate"))$("rate").value=q.get("rate");
 if(q.has("unit"))unit=q.get("unit")==="months"?"months":"years";
 if(q.has("tenure"))$("tenure").value=q.get("tenure");
 document.querySelectorAll(".toggle button").forEach(b=>b.classList.toggle("active",b.dataset.unit===unit));
 $("tenureUnit").textContent=unit==="years"?"years":"months";
 $("minTenure").textContent=unit==="years"?"1 year":"1 month";
 $("maxTenure").textContent=unit==="years"?"30 years":"360 months";
 syncRange();
}
$("amountRange").addEventListener("input",e=>{$("amount").value=e.target.value;update()});
$("rateRange").addEventListener("input",e=>{$("rate").value=e.target.value;update()});
$("tenureRange").addEventListener("input",e=>{$("tenure").value=e.target.value;update()});
$("amount").addEventListener("input",syncRange);$("rate").addEventListener("input",syncRange);$("tenure").addEventListener("input",syncRange);$("extraMonthly").addEventListener("input",update);
document.querySelectorAll(".toggle button").forEach(btn=>btn.addEventListener("click",()=>{
 unit=btn.dataset.unit;
 let old=parseFloat($("tenure").value)||20;
 let val=unit==="years"?Math.max(1,Math.min(30,Math.round(old/12))):Math.max(1,Math.min(360,Math.round(old*12)));
 $("tenure").value=val;$("tenureUnit").textContent=unit==="years"?"years":"months";
 $("minTenure").textContent=unit==="years"?"1 year":"1 month";$("maxTenure").textContent=unit==="years"?"30 years":"360 months";
 document.querySelectorAll(".toggle button").forEach(x=>x.classList.toggle("active",x===btn));syncRange();
}));
$("resetBtn").addEventListener("click",()=>{unit="years";$("amount").value=3000000;$("rate").value=8.5;$("tenure").value=20;$("extraMonthly").value=0;document.querySelectorAll(".toggle button").forEach(x=>x.classList.toggle("active",x.dataset.unit==="years"));$("tenureUnit").textContent="years";$("minTenure").textContent="1 year";$("maxTenure").textContent="30 years";syncRange()});
$("togglePrepay").addEventListener("click",()=>{$("prepayBox").hidden=!$("prepayBox").hidden;$("togglePrepay").textContent=$("prepayBox").hidden?"Add extra payment +":"Hide extra payment −"});
$("scheduleBody").addEventListener("click",e=>{const b=e.target.closest(".expand-btn");if(!b)return;const d=b.closest("tr").nextElementSibling;const open=d.hidden;d.hidden=!open;b.textContent=open?"−":"+";b.setAttribute("aria-expanded",String(open))});
$("expandAll").addEventListener("click",()=>{const rows=[...document.querySelectorAll(".month-row")],open=rows.some(r=>r.hidden);rows.forEach(r=>r.hidden=!open);document.querySelectorAll(".expand-btn").forEach(b=>{b.textContent=open?"−":"+";b.setAttribute("aria-expanded",String(open))});$("expandAll").textContent=open?"Collapse all":"Expand all"});
$("downloadCsv").addEventListener("click",()=>{if(!latestRows.length)return;const lines=[["Month","EMI","Principal","Interest","Balance"],...latestRows.map(x=>[x.m,Math.round(x.payment),Math.round(x.principal),Math.round(x.interest),Math.round(x.balance)])];const csv=lines.map(r=>r.join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="emi-amortization-schedule.csv";a.click();URL.revokeObjectURL(a.href)});
$("printBtn").addEventListener("click",()=>window.print());
$("shareBtn").addEventListener("click",async()=>{const url=location.href;if(navigator.share){try{await navigator.share({title:"EMIWala EMI Calculation",url})}catch(e){}}else{try{await navigator.clipboard.writeText(url);$("shareBtn").textContent="✓ Link copied"}catch(e){prompt("Copy this calculation link:",url)}}});
$("menuBtn").addEventListener("click",()=>{const n=$("navMenu"),open=n.classList.toggle("open");$("menuBtn").setAttribute("aria-expanded",String(open))});
$("year").textContent=new Date().getFullYear();
loadUrl();
})();