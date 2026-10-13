import { experiences } from './data.js';

const $ = (id) => document.getElementById(id);
const storageKey = 'seunga-room-v1';
let saved = [];
try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(value)) saved = value; } catch {}
const collected = new Set(saved.filter(id => experiences.some(e => e.id === id)));
let room, currentExperience, toastTimer, departed = false, endingTimer;
const dialogs = [...document.querySelectorAll('dialog')];

export function itemIcon(type, color = '#9bc9d5') {
  const body = {
    phone: `<rect x="15" y="6" width="29" height="49" rx="6" fill="${color}" stroke="#638e9a" stroke-width="2"/><rect x="19" y="13" width="21" height="32" rx="2" fill="#fff9e6"/><rect x="23" y="16" width="13" height="8" rx="2" fill="#f0c870"/><path d="M23 29h13M23 34h9M23 39h12" stroke="${color}" stroke-width="2"/><circle cx="29.5" cy="50" r="2" fill="#fff9e6"/>`,
    monitor: `<rect x="7" y="9" width="46" height="31" rx="4" fill="${color}"/><rect x="11" y="13" width="38" height="22" rx="2" fill="#e5eee9"/><path d="M16 29l8-9 9 6 10-9" fill="none" stroke="#81ac9a" stroke-width="3"/><rect x="27" y="40" width="6" height="10" fill="#c5c3ae"/><rect x="18" y="50" width="24" height="4" rx="2" fill="#a5b9ad"/><path d="M19 30v-6M27 30v-3M35 30v-9M43 30v-5" stroke="#e9bc6d" stroke-width="3"/>`,
    laptop: `<rect x="9" y="10" width="42" height="32" rx="4" fill="${color}"/><rect x="13" y="14" width="34" height="24" rx="2" fill="#eaf0df"/><path d="M23 22l-5 4 5 4M37 22l5 4-5 4M33 20l-5 13" stroke="#8cab7d" stroke-width="2" fill="none"/><path d="M8 42h44l6 9H2z" fill="#c3cfb2"/><path d="M25 45h10l3 4H22z" fill="#edf2e3"/>`,
    notebook: `<rect x="13" y="7" width="35" height="47" rx="3" fill="${color}"/><rect x="19" y="7" width="3" height="47" fill="#ffffff55"/><rect x="27" y="17" width="14" height="16" rx="2" fill="#f9f5ea"/><path d="M30 22h8M30 26h6" stroke="${color}" stroke-width="2"/><path d="M10 14h6M10 24h6M10 34h6M10 44h6" stroke="#89768c" stroke-width="2" stroke-linecap="round"/><path d="M40 40l8 10 6-16" stroke="#e8c971" stroke-width="4" fill="none"/>`,
    badge: `<path d="M22 4l8 17 8-17" fill="none" stroke="${color}" stroke-width="5"/><rect x="12" y="19" width="36" height="35" rx="5" fill="#faf6e9" stroke="${color}" stroke-width="2"/><rect x="17" y="25" width="26" height="13" rx="2" fill="${color}"/><path d="M19 44h22M23 48h14" stroke="#c5ba9b" stroke-width="2"/><circle cx="30" cy="31.5" r="4" fill="#fff9e6"/>`,
    bag: `<path d="M20 18v-3c0-14 20-14 20 0v3" fill="none" stroke="#bba266" stroke-width="4"/><rect x="9" y="16" width="42" height="39" rx="11" fill="#efd085"/><path d="M9 27c10 9 32 9 42 0" fill="none" stroke="#ccae67" stroke-width="2"/><rect x="24" y="29" width="12" height="9" rx="3" fill="${color}"/><circle cx="39" cy="45" r="5" fill="${color}"/><circle cx="39" cy="45" r="2" fill="#f7d574"/>`
  }[type];
  return `<svg viewBox="0 0 60 60" aria-hidden="true">${body}</svg>`;
}

function showDialog(dialog) { dialogs.forEach(d => { if(d !== dialog && d.open) d.close(); }); if (!dialog.open) dialog.showModal(); }
dialogs.forEach(dialog => {
  dialog.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => { if(event.target === dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)dialog.close();} });
});

function renderUI() {
  $('inventory').innerHTML = experiences.map(e => `<button class="inventory-item ${collected.has(e.id)?'collected':''}" data-id="${e.id}" aria-label="${e.label} ${collected.has(e.id)?'챙긴 경험 다시 보기':'경험 찾아보기'}"><span class="item-number">${e.number}</span><span class="item-check">${collected.has(e.id)?'✓':''}</span><span class="item-art">${itemIcon(e.icon,e.color)}</span><b>${e.short}</b><small>${e.label}</small></button>`).join('');
  $('inventory').querySelectorAll('button').forEach(b => b.addEventListener('click', () => openExperience(b.dataset.id)));
  document.querySelectorAll('.hotspot').forEach(b => { const has=collected.has(b.dataset.id);b.classList.toggle('collected',has);b.querySelector('.pin').textContent=has?'✓':experiences.find(e=>e.id===b.dataset.id).number; });
  $('progress-number').textContent = `${collected.size} / 6`;
  $('progress-label').textContent = collected.size ? `가방에 챙긴 ${collected.size}개의 경험` : '아직 비어 있는 가방 · 0개의 경험';
  $('progress-bar').style.width = `${collected.size/6*100}%`;
  $('depart-button').disabled = collected.size !== 6;
  $('depart-button').innerHTML = collected.size === 6 ? '꿈을 향해 출발하기 <span>↗</span>' : '출발 준비 중 <span>↗</span>';
  $('mission-title').textContent = collected.size === 6 ? '외출 준비 완료! 이제 다음 꿈을 만나러 가요' : '방 안의 반짝이는 물건을 찾아주세요';
  $('mission-copy').textContent = collected.size === 6 ? '현관문이나 아래 출발 버튼을 눌러주세요.' : '물건마다 승아의 이야기가 담겨 있어요.';
  $('start-button').innerHTML = collected.size===6 ? '출발할 준비가 됐어요 <span>↗</span>' : collected.size ? '계속 둘러보기 <span>↗</span>' : '외출 준비 도와주기 <span>↗</span>';
  room?.updateCollection(collected);
}

function openExperience(id) {
  currentExperience=experiences.find(e=>e.id===id); if(!currentExperience)return;
  const e=currentExperience;
  const detail=e.detail?`<div class="case-detail">${e.detail.map((d,i)=>`<div><span>0${i+1}</span><b>${d.label}</b><p>${d.text}</p></div>`).join('')}</div>`:'';
  $('story-content').innerHTML=`<div class="story-hero" style="--story-tint:${e.color}25"><span class="eyebrow">${e.number} / ${e.period}</span><h2 id="story-title">${e.title}</h2><p>${e.subtitle}</p><div class="story-big-art">${itemIcon(e.icon,e.color)}</div></div><div class="story-body"><p class="narrative">${e.story}</p>${detail}<div class="story-facts"><div><span>MY ROLE · 내가 한 일</span><p>${e.role}</p></div><div><span>WHAT REMAINS · 남은 것</span><p>${e.result}</p></div></div><div class="story-takeaway"><span>✦</span><p>${e.takeaway}</p></div><ul class="memory-notes">${e.notes.map(n=>`<li>${n}</li>`).join('')}</ul><div class="story-actions"><span>${e.tags.join(' · ')}</span><button id="collect-button" class="collect-button ${collected.has(id)?'already':''}">${collected.has(id)?'이미 챙긴 경험 · 방으로 돌아가기 ✓':'이 경험을 가방에 챙기기 +'}</button></div></div>`;
  $('collect-button').addEventListener('click',()=>{
    if(!collected.has(e.id)) {
      collected.add(e.id);try{localStorage.setItem(storageKey,JSON.stringify([...collected]));}catch{}
      renderUI();room?.celebrate(e.id);setSpeech(e.speech);toast(`${e.short}, 가방에 챙겼어요! (${collected.size}/6)`);
    }
    $('story-dialog').close();
  });
  showDialog($('story-dialog'));$('story-dialog').scrollTop=0;
}

function renderJournal(){
  $('journal-list').innerHTML=experiences.map(e=>`<button class="journal-entry" data-id="${e.id}"><span class="journal-icon">${itemIcon(e.icon,e.color)}</span><span><small>${e.period}</small><b>${e.label}</b><p>${e.role}</p></span><span class="entry-arrow">↗</span></button>`).join('');
  $('journal-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openExperience(b.dataset.id)));
}
function setSpeech(text){$('speech').textContent=text;}
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
function depart(){
  if(collected.size!==6){toast('여섯 개의 경험을 먼저 챙겨주세요.');return;}
  if(departed)return;departed=true;setSpeech('좋아, 다음 꿈을 만나러 가자!');
  $('scene-shell').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  room?.depart();endingTimer=setTimeout(()=>showDialog($('ending-dialog')),room?4500:200);
}
$('depart-button').addEventListener('click',depart);
$('start-button').addEventListener('click',()=>{
  if(collected.size===6){depart();return;}
  if(collected.size){toast('방의 숫자 또는 아래 가방에서 경험을 골라주세요.');setSpeech('다음 물건은 어디 있을까?');}
  else{showDialog($('help-dialog'));setSpeech('같이 외출 준비해줄래?');}
});
$('help-button').addEventListener('click',()=>showDialog($('help-dialog')));
$('journal-button').addEventListener('click',()=>showDialog($('journal-dialog')));
$('view-button').addEventListener('click',()=>room?.toggleView());
$('reset-button').addEventListener('click',()=>{
  clearTimeout(endingTimer);collected.clear();try{localStorage.removeItem(storageKey);}catch{}departed=false;room?.reset();renderUI();setSpeech('오늘은 어디로 가볼까?');$('journal-dialog').close();toast('가방을 비웠어요. 새롭게 둘러볼까요?');
});
$('replay-button').addEventListener('click',()=>{$('ending-dialog').close();departed=false;room?.reset();room?.updateCollection(collected);setSpeech('다음 이야기도 기대해줘!');});
$('ending-journal').addEventListener('click',()=>showDialog($('journal-dialog')));
$('ending-dialog').addEventListener('close',()=>{departed=false;room?.reset();room?.updateCollection(collected);setSpeech('다음 이야기도 기대해줘!');});
renderJournal();renderUI();

async function initRoom(){
  try{
    const { createRoom }=await import('./scene.js?v=2');
    room=createRoom({canvas:$('room-canvas'),shell:$('scene-shell'),onSelect:openExperience,onDoor:depart,experiences,collected,
      onProject:(points,character)=>{
        points.forEach(({id,x,y,visible})=>{const b=document.querySelector(`.hotspot[data-id="${id}"]`);if(b){b.style.left=`${x}px`;b.style.top=`${y}px`;b.style.visibility=visible?'visible':'hidden';}});
        $('speech').style.left=`${character.x}px`;$('speech').style.top=`${character.y}px`;
      }});
    $('hotspots').innerHTML=experiences.map(e=>`<button class="hotspot ${collected.has(e.id)?'collected':''}" data-id="${e.id}" aria-label="${e.label} 경험 보기"><span class="pin">${collected.has(e.id)?'✓':e.number}</span><span class="pin-label">${e.label}</span></button>`).join('');
    $('hotspots').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openExperience(b.dataset.id)));
    $('loading').classList.add('hidden');$('loading').setAttribute('aria-hidden','true');renderUI();
  }catch(error){
    console.error('Room unavailable',error);$('loading').classList.add('failed');
    $('loading').innerHTML='<span class="loading-flower">✳</span><p>이 환경에서는 3D 방을 열지 못했어요.<br>아래 가방에서 모든 이야기를 둘러볼 수 있어요.</p><button id="fallback-journal" class="primary-button">경험 노트 펼치기 ↗</button>';
    $('fallback-journal').addEventListener('click',()=>showDialog($('journal-dialog')));$('speech').hidden=true;$('view-button').hidden=true;
  }
}
initRoom();
