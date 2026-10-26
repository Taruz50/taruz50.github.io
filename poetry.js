(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handwritingTargets = [...document.querySelectorAll("[data-handwrite]")];
  const prepareHandwriting = (el) => {
    if (el.dataset.handwriteReady) return;
    const text = el.textContent ?? "";
    el.textContent = "";
    el.setAttribute("aria-label", text);
    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "handwrite-char";
      span.textContent = char === " " ? "\u00a0" : char;
      el.appendChild(span);
    });
    el.dataset.handwriteReady = "true";
  };
  handwritingTargets.forEach(prepareHandwriting);

  const setHandProgress = (el, progress) => {
    const chars = [...el.querySelectorAll(".handwrite-char")];
    const total = Math.max(chars.length, 1);
    chars.forEach((char,index) => {
      const start = index / total;
      const end = Math.min(1, start + 0.18);
      const local = Math.max(0, Math.min(1, (progress - start) / Math.max(.001, end - start)));
      char.style.opacity = local.toFixed(3);
      char.style.filter = `blur(${(2.2 * (1-local)).toFixed(2)}px)`;
      char.style.transform = `translateY(${(5 * (1-local)).toFixed(2)}px)`;
    });
  };

  const updateScrollWriting = () => {
    if (reduced) return;
    const vh = window.innerHeight || 1;

    document.querySelectorAll("[data-scroll-note]").forEach((section) => {
      const rect = section.getBoundingClientRect();
      const enter = 1 - Math.min(1, Math.max(0, (rect.top - vh * .18) / (vh * .72)));
      const leave = Math.min(1, Math.max(0, (rect.bottom - vh * .08) / (vh * .58)));
      const strength = Math.max(.10, Math.min(1, Math.min(enter, leave) * 1.08));
      section.style.setProperty("--scroll-opacity", strength.toFixed(3));

      section.querySelectorAll("[data-handwrite]").forEach((el) => {
        const er = el.getBoundingClientRect();
        const p = 1 - Math.min(1, Math.max(0, (er.top - vh * .26) / (vh * .52)));
        const reverse = Math.min(1, Math.max(0, (er.bottom - vh * .08) / (vh * .42)));
        setHandProgress(el, Math.max(0, Math.min(1, p * reverse)));
      });
    });
  };

  let ticking=false;
  const onScroll=()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{updateScrollWriting();ticking=false;});
  };
  updateScrollWriting();
  addEventListener("scroll",onScroll,{passive:true});
  addEventListener("resize",onScroll);

  const pages=[
    {number:"01",kicker:"FIRST ENTRY",title:"A page waiting for its poem.",copy:"The writing itself has not been added yet. This page is here to establish the reading experience without inventing words that are not yours."},
    {number:"02",kicker:"FRAGMENT",title:"For the unfinished things.",copy:"This volume is reserved for fragments, smaller thoughts and pieces that are intentionally incomplete."},
    {number:"03",kicker:"PRIVATE LANGUAGE",title:"Some writing stays difficult on purpose.",copy:"This page is reserved for writing that keeps its ambiguity instead of translating itself for everyone."}
  ];

  const reader=document.querySelector("[data-reader]");
  const page=document.querySelector("[data-reader-page]");
  const under=document.querySelector("[data-reader-under]");
  const fold=document.querySelector("[data-page-fold]");
  const curl=document.querySelector("[data-page-curl]");
  const close=document.querySelector("[data-reader-close]");
  const topFields={
    number:document.querySelector("[data-reader-number]"),
    kicker:document.querySelector("[data-reader-kicker]"),
    title:document.querySelector("[data-reader-title]"),
    copy:document.querySelector("[data-reader-copy]")
  };
  const underFields={
    number:document.querySelector("[data-under-number]"),
    kicker:document.querySelector("[data-under-kicker]"),
    title:document.querySelector("[data-under-title]"),
    copy:document.querySelector("[data-under-copy]")
  };
  let pageIndex=0, dragging=false, startX=0, startY=0, peel=0;

  const fill=(fields,data)=>{
    fields.number.textContent=data.number;
    fields.kicker.textContent=data.kicker;
    fields.title.textContent=data.title;
    fields.copy.textContent=data.copy;
  };
  const render=()=>{
    fill(topFields,pages[pageIndex]);
    fill(underFields,pages[(pageIndex+1)%pages.length]);
    peel=0;
    page.style.clipPath="";
    page.style.transform="";
    page.style.opacity="1";
    curl.style.opacity="0";
    curl.style.width="0px";
    curl.style.height="0px";
  };
  const openReader=(index)=>{
    pageIndex=index;render();
    reader.classList.add("is-open");
    reader.setAttribute("aria-hidden","false");
    document.body.classList.add("reader-open");
  };
  const closeReader=()=>{
    reader.classList.remove("is-open");
    reader.setAttribute("aria-hidden","true");
    document.body.classList.remove("reader-open");
  };
  document.querySelectorAll("[data-book]").forEach(book=>book.addEventListener("click",()=>openReader(Number(book.dataset.book||0))));
  close?.addEventListener("click",closeReader);
  reader?.addEventListener("click",e=>{if(e.target===reader) closeReader();});

  const applyPeel=(clientX,clientY)=>{
    const r=page.getBoundingClientRect();
    const dx=Math.max(0,r.right-clientX);
    const dy=Math.max(0,clientY-r.top);
    peel=Math.min(Math.max(dx,dy*.72),Math.min(r.width*.58,420));
    const pct=Math.min(92,(peel/r.width)*100);
    page.style.clipPath=`polygon(0 0, calc(100% - ${pct}%) 0, 100% ${Math.min(100,pct*1.05)}%, 100% 100%, 0 100%)`;
    curl.style.opacity=Math.min(1,peel/80).toFixed(3);
    curl.style.width=`${Math.max(24,peel)}px`;
    curl.style.height=`${Math.max(24,peel*1.08)}px`;
    curl.style.transform=`rotate(${Math.min(18,peel*.04)}deg)`;
    return peel;
  };

  const completeTurn=()=>{
    const r=page.getBoundingClientRect();
    const currentClip=getComputedStyle(page).clipPath;
    const anim=page.animate([
      {clipPath:currentClip,opacity:1},
      {clipPath:"polygon(0 0, 0 0, 0 100%, 0 100%)",opacity:.92}
    ],{
      duration:520,
      easing:"cubic-bezier(.2,.72,.18,1)",
      fill:"forwards"
    });
    curl.animate([
      {opacity:1,transform:curl.style.transform||"rotate(0deg)"},
      {opacity:.15,transform:"translate(-18vw,18vh) rotate(28deg)"}
    ],{duration:500,easing:"ease-out",fill:"forwards"});
    anim.onfinish=()=>{
      pageIndex=(pageIndex+1)%pages.length;
      render();
    };
  };

  const resetPeel=()=>{
    const start=peel;
    const a={value:start};
    const duration=260,startTime=performance.now();
    const tick=(now)=>{
      const t=Math.min(1,(now-startTime)/duration);
      const eased=1-Math.pow(1-t,3);
      const v=start*(1-eased);
      const r=page.getBoundingClientRect();
      const pct=Math.min(92,(v/r.width)*100);
      page.style.clipPath=v<1?"":`polygon(0 0, calc(100% - ${pct}%) 0, 100% ${Math.min(100,pct*1.05)}%, 100% 100%, 0 100%)`;
      curl.style.width=`${Math.max(0,v)}px`;
      curl.style.height=`${Math.max(0,v*1.08)}px`;
      curl.style.opacity=(v/Math.max(80,start)).toFixed(3);
      if(t<1) requestAnimationFrame(tick);
      else render();
    };
    requestAnimationFrame(tick);
  };

  fold?.addEventListener("pointerdown",e=>{
    dragging=true;startX=e.clientX;startY=e.clientY;
    fold.setPointerCapture(e.pointerId);
  });
  fold?.addEventListener("pointermove",e=>{if(dragging) applyPeel(e.clientX,e.clientY);});
  const finish=e=>{
    if(!dragging) return;
    dragging=false;
    const moved=Math.hypot(e.clientX-startX,e.clientY-startY);
    if(peel>150||moved>150) completeTurn();
    else resetPeel();
  };
  fold?.addEventListener("pointerup",finish);
  fold?.addEventListener("pointercancel",finish);
  fold?.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ") return;
    e.preventDefault();
    peel=180;
    completeTurn();
  });

  if(reduced){
    document.querySelectorAll("[data-scroll-note]").forEach(el=>el.style.setProperty("--scroll-opacity","1"));
    handwritingTargets.forEach(el=>setHandProgress(el,1));
  }
})();