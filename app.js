import { experiences, featuredIds, supportingIds } from './data.js?v=7';

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
  $('progress-label').textContent = `가방에 챙긴 경험 · ${collected.size}개`;
  $('progress-bar').style.width = `${collected.size/6*100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', collected.size);
  $('depart-button').disabled = collected.size !== 6;
  $('depart-button').innerHTML = collected.size === 6 ? '꿈을 향해 출발하기 <span>↗</span>' : '출발 준비 중 <span>↗</span>';
  $('mission-title').textContent = collected.size === 6 ? '외출 준비 완료! 찾은 꿈을 향해 나아가요' : '여섯 가지 경험으로 외출을 준비해요';
  $('mission-copy').textContent = collected.size === 6 ? '현관문이나 출발 버튼을 눌러주세요.' : '경험 상세에서 ‘가방에 챙기기’를 눌러주세요.';
  $('start-button').innerHTML = collected.size===6 ? '꿈을 향해 출발하기 ↗' : '방 둘러보기 ↗';
  room?.updateCollection(collected);
}

function openExperience(id) {
  currentExperience=experiences.find(e=>e.id===id); if(!currentExperience)return;
  const e=currentExperience;
  const order=[...featuredIds,...supportingIds];
  const next=experiences.find(item=>item.id===order[(order.indexOf(id)+1)%order.length]);
  $('story-content').innerHTML=`
    <header class="story-hero">
      <p class="eyebrow">${e.featured?'대표 프로젝트':'경험 기록'} / ${e.category}</p>
      <h2 id="story-title">${e.label}</h2><p class="story-headline">${e.title}</p><p class="story-summary">${e.summary}</p>
      <dl class="project-meta"><div><dt>기간·활동</dt><dd>${e.duration}</dd></div><div><dt>담당 역할</dt><dd>${e.role}</dd></div></dl>
      <ul class="skill-tags">${e.skills.map(s=>`<li>${s}</li>`).join('')}</ul>
    </header>
    <div class="story-body">
      <section class="case-section"><span class="section-number">01</span><div><h3>어떤 문제를 발견했나요?</h3><p>${e.problem}</p></div></section>
      <section class="case-section"><span class="section-number">02</span><div><h3>어떻게 접근했나요?</h3><p>${e.approach}</p></div></section>
      <section class="case-section"><span class="section-number">03</span><div><h3>제가 맡은 일</h3><ul class="contribution-list">${e.contributions.map(c=>`<li><h4>${c.title}</h4><p>${c.text}</p></li>`).join('')}</ul></div></section>
      <section class="case-section"><span class="section-number">04</span><div><h3>산출물과 성과</h3><div class="result-columns"><div><h4>만든 결과물</h4><ul>${e.outputs.map(o=>`<li>${o}</li>`).join('')}</ul></div><div><h4>성과·활동</h4><ul>${e.outcomes.map(o=>`<li>${o}</li>`).join('')}</ul></div></div></div></section>
      <section class="case-section reflection"><span class="section-number">05</span><div><h3>이 경험이 남긴 것</h3><p>${e.takeaway}</p></div></section>
      <button class="next-experience" data-open-experience="${next.id}"><span>다음 경험 읽기</span><b>${next.label} ↗</b></button>
    </div>
    <div class="story-actions"><span>${collected.has(id)?'✓ 가방에 챙긴 경험':'외출 가방에 이 경험을 담아보세요'}</span><button id="collect-button" class="collect-button ${collected.has(id)?'already':''}">${collected.has(id)?'읽기 마치기 ✓':'이 경험을 가방에 챙기기 +'}</button></div>`;
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
  const group=(title,ids)=>`<h3 class="index-heading">${title}</h3>${ids.map(id=>{const e=experiences.find(item=>item.id===id);return `<button class="journal-entry" data-open-experience="${e.id}"><span class="journal-icon">${itemIcon(e.icon,e.color)}</span><span><small>${e.period} · ${e.category}</small><b>${e.label}</b><p>${e.role}</p></span><span class="entry-arrow" aria-hidden="true">↗</span></button>`;}).join('')}`;
  $('journal-list').innerHTML=group('대표 프로젝트',featuredIds)+group('다른 경험',supportingIds);
}

function renderPortfolio(){
  const flows={care:['요양 생활기록','AI로 정보 구조화','가족이 함께 확인'],focus:['온라인 학습','집중도 분석','학습 패턴 리포트']};
  const intentions={care:'돌봄의 정보를<br>가족이 함께 볼 수 있도록.',focus:'보이지 않던 몰입을<br>돌아볼 수 있는 정보로.'};
  $('featured-projects').innerHTML=featuredIds.map((id,index)=>{
    const e=experiences.find(item=>item.id===id);
    return `<article class="project-feature ${id}">
      <div class="project-visual"><div class="visual-top"><span>${e.period} / ${e.category}</span><span aria-hidden="true">0${index+1}</span></div><div class="project-symbol">${itemIcon(e.icon,e.color)}</div><p class="visual-statement">${intentions[id]}</p><div class="service-flow" aria-label="${e.label} 서비스 흐름">${flows[id].map((s,i)=>`<span><small>0${i+1}</small>${s}</span>`).join('')}</div><p class="visual-caption">기획한 핵심 서비스 흐름</p></div>
      <div class="project-info"><p class="eyebrow">${e.duration} · ${e.role}</p><h3>${e.label}</h3><p class="project-subtitle">${e.subtitle}</p><p class="project-summary">${e.summary}</p><dl class="feature-facts"><div><dt>핵심 기여</dt><dd>${e.skills.join(' · ')}</dd></div><div><dt>주요 결과</dt><dd>${e.highlight}</dd></div></dl><button class="project-link" data-open-experience="${id}" aria-label="${e.label} 프로젝트 자세히 보기">프로젝트 자세히 보기 <span aria-hidden="true">↗</span></button></div>
    </article>`;
  }).join('');
  $('experience-list').innerHTML=supportingIds.map(id=>{const e=experiences.find(item=>item.id===id);return `<button class="experience-row" data-open-experience="${id}" aria-label="${e.label} 상세 보기"><span class="experience-kind">${e.category}</span><span class="experience-main"><strong>${e.label}</strong><span>${e.summary}</span></span><span class="experience-role">${e.role}</span><span class="entry-arrow" aria-hidden="true">↗</span></button>`;}).join('');
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-open-experience]');if(target)openExperience(target.dataset.openExperience);});
function setSpeech(text){$('speech').textContent=text;}
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
function depart(){
  if(collected.size!==6){toast('여섯 개의 경험을 먼저 챙겨주세요.');return;}
  if(departed)return;departed=true;setSpeech('좋아, 내 꿈을 향해 가보자!');
  $('scene-shell').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  room?.depart();endingTimer=setTimeout(()=>showDialog($('ending-dialog')),room?4500:200);
}
$('depart-button').addEventListener('click',depart);
$('start-button').addEventListener('click',()=>{
  if(collected.size===6){depart();return;}
  $('scene-shell').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  if(collected.size){toast('방의 숫자 또는 경험 가방에서 물건을 골라주세요.');setSpeech('다음 물건은 어디 있을까?');}
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
renderPortfolio();renderJournal();renderUI();

async function initRoom(){
  try{
    const { createRoom }=await import('./scene.js?v=5');
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
    $('loading').innerHTML='<span class="loading-flower">✳</span><p>이 환경에서는 3D 방을 열지 못했어요.<br>프로젝트와 경험은 아래에서 읽을 수 있습니다.</p><button id="fallback-journal" class="primary-button">포트폴리오 전체 보기 ↗</button>';
    $('fallback-journal').addEventListener('click',()=>showDialog($('journal-dialog')));$('speech').hidden=true;$('view-button').hidden=true;
  }
}
initRoom();
