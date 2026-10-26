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

  const handState = new Map();

  const renderHandProgress = (el, progress) => {
    const chars = [...el.querySelectorAll(".handwrite-char")];
    const total = Math.max(chars.length, 1);
    chars.forEach((char,index) => {
      const start = Math.max(0, index / total - 0.08);
      const end = Math.min(1, start + 0.34);
      const local = Math.max(0, Math.min(1, (progress - start) / Math.max(.001, end - start)));
      const eased = local * local * (3 - 2 * local);
      char.style.opacity = eased.toFixed(3);
      char.style.filter = `blur(${(1.25 * (1-eased)).toFixed(2)}px)`;
      char.style.transform = `translateY(${(2.2 * (1-eased)).toFixed(2)}px)`;
    });
  };

  const setHandTarget = (el, progress) => {
    const state = handState.get(el) || { current: 0, target: 0 };
    state.target = Math.max(0, Math.min(1, progress));
    handState.set(el, state);
  };

  const animateHands = () => {
    let active = false;
    handState.forEach((state, el) => {
      const delta = state.target - state.current;
      if (Math.abs(delta) > 0.001) {
        state.current += delta * 0.16;
        active = true;
      } else {
        state.current = state.target;
      }
      renderHandProgress(el, state.current);
    });
    requestAnimationFrame(animateHands);
  };

  handwritingTargets.forEach((el) => {
    prepareHandwriting(el);
    handState.set(el, { current: 0, target: 0 });
  });
  requestAnimationFrame(animateHands);

  const progressForElement = (el, vh) => {
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const writeStart = vh * .78;
    const fullStart = vh * .58;
    const fullEnd = vh * .34;
    const eraseEnd = vh * .12;

    if (center >= writeStart) return 0;
    if (center <= eraseEnd) return 0;
    if (center <= fullStart && center >= fullEnd) return 1;

    if (center < writeStart && center > fullStart) {
      const t = (writeStart - center) / (writeStart - fullStart);
      return Math.max(0, Math.min(1, t));
    }

    const t = (center - eraseEnd) / (fullEnd - eraseEnd);
    return Math.max(0, Math.min(1, t));
  };

  const updateScrollWriting = () => {
    if (reduced) return;
    const vh = window.innerHeight || 1;

    document.querySelectorAll("[data-scroll-note]").forEach((section) => {
      const r = section.getBoundingClientRect();
      const center = r.top + r.height/2;
      const distance = Math.abs(center - vh*.5);
      const strength = Math.max(.28, Math.min(1, 1 - distance/(vh*.78)));
      section.style.setProperty("--scroll-opacity", strength.toFixed(3));
    });

    handwritingTargets.forEach((el) => {
      setHandTarget(el, progressForElement(el, vh));
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
  const shell=document.querySelector(".reader-shell");
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

  let pageIndex=0, dragging=false, peel=0, pointerId=null;

  const fill=(fields,data)=>{
    fields.number.textContent=data.number;
    fields.kicker.textContent=data.kicker;
    fields.title.textContent=data.title;
    fields.copy.textContent=data.copy;
  };

  const resetVisuals=()=>{
    peel=0;
    page.style.clipPath="";
    page.style.transform="";
    page.style.opacity="1";
    page.style.setProperty("--peel-shadow","0");
    curl.style.opacity="0";
    curl.style.width="0px";
    curl.style.height="0px";
    curl.style.transform="";
  };

  const render=()=>{
    fill(topFields,pages[pageIndex]);
    fill(underFields,pages[(pageIndex+1)%pages.length]);
    resetVisuals();
  };

  const morphBookToReader=(book,index)=>{
    pageIndex=index;
    render();
    const start=book.getBoundingClientRect();
    reader.classList.add("is-open","is-entering");
    reader.setAttribute("aria-hidden","false");
    document.body.classList.add("reader-open");
    requestAnimationFrame(()=>{
      const end=page.getBoundingClientRect();
      const clone=book.cloneNode(true);
      clone.classList.add("book-morph-clone");
      Object.assign(clone.style,{
        left:`${start.left}px`,top:`${start.top}px`,width:`${start.width}px`,height:`${start.height}px`
      });
      document.body.appendChild(clone);
      const dx=end.left-start.left,dy=end.top-start.top;
      const sx=end.width/start.width,sy=end.height/start.height;
      const anim=clone.animate([
        {transform:"translate(0,0) scale(1)",borderRadius:"2px 10px 10px 2px",opacity:1},
        {transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`,borderRadius:"2px",opacity:.96}
      ],{duration:520,easing:"cubic-bezier(.18,.72,.2,1)",fill:"forwards"});
      anim.onfinish=()=>{
        clone.remove();
        reader.classList.remove("is-entering");
      };
    });
  };

  const closeReader=()=>{
    reader.classList.remove("is-open","is-entering");
    reader.setAttribute("aria-hidden","true");
    document.body.classList.remove("reader-open");
  };

  document.querySelectorAll("[data-book]").forEach(book=>book.addEventListener("click",()=>morphBookToReader(book,Number(book.dataset.book||0))));
  close?.addEventListener("click",closeReader);
  reader?.addEventListener("click",e=>{if(e.target===reader) closeReader();});

  const applyPeel=(clientX,clientY)=>{
    const r=page.getBoundingClientRect();
    const localX=Math.max(0,Math.min(r.width,r.right-clientX));
    const localY=Math.max(0,Math.min(r.height,clientY-r.top));
    peel=Math.min(Math.max(localX,localY*.82),Math.min(r.width*.62,460));

    const px=Math.max(30,peel);
    const pct=Math.min(96,(peel/r.width)*100);
    const foldY=Math.min(100,Math.max(8,(localY/r.height)*100));
    page.style.clipPath=`polygon(0 0, calc(100% - ${pct}%) 0, 100% ${foldY}%, 100% 100%, 0 100%)`;
    page.style.setProperty("--peel-shadow",Math.min(1,peel/180).toFixed(3));

    curl.style.opacity=Math.min(1,peel/55).toFixed(3);
    curl.style.width=`${px}px`;
    curl.style.height=`${Math.max(34,px*.92)}px`;
    curl.style.transform=`translate(${Math.min(0,-localX*.08)}px,${Math.max(0,localY*.05)}px) rotate(${Math.min(28,peel*.055)}deg)`;

    under.style.transform=`translateY(${Math.max(0,8-peel*.018)}px) scale(${(.992+Math.min(.008,peel/60000)).toFixed(4)})`;
    under.style.filter=`brightness(${(.97+Math.min(.03,peel/6000)).toFixed(3)})`;
  };

  const animatePeelTo=(target,duration,onDone)=>{
    const start=peel;
    const startTime=performance.now();
    const tick=(now)=>{
      const t=Math.min(1,(now-startTime)/duration);
      const eased=1-Math.pow(1-t,3);
      const value=start+(target-start)*eased;
      const r=page.getBoundingClientRect();
      const x=r.right-value;
      const y=r.top+Math.min(r.height*.72,value*.72);
      applyPeel(x,y);
      if(t<1) requestAnimationFrame(tick);
      else onDone?.();
    };
    requestAnimationFrame(tick);
  };

  const completeTurn=()=>{
    const max=Math.min(page.getBoundingClientRect().width*.96,760);
    animatePeelTo(max,420,()=>{
      const fade=page.animate([{opacity:1},{opacity:.02}],{duration:160,easing:"ease-out",fill:"forwards"});
      fade.onfinish=()=>{
        pageIndex=(pageIndex+1)%pages.length;
        render();
        page.animate([{opacity:.7},{opacity:1}],{duration:220,easing:"ease-out"});
      };
    });
  };

  const resetPeel=()=>animatePeelTo(0,260,resetVisuals);

  fold?.addEventListener("pointerdown",e=>{
    dragging=true;
    pointerId=e.pointerId;
    fold.setPointerCapture(e.pointerId);
    applyPeel(e.clientX,e.clientY);
  });
  fold?.addEventListener("pointermove",e=>{if(dragging&&e.pointerId===pointerId) applyPeel(e.clientX,e.clientY);});
  const finish=e=>{
    if(!dragging) return;
    dragging=false;
    if(peel>Math.min(180,page.getBoundingClientRect().width*.28)) completeTurn();
    else resetPeel();
  };
  fold?.addEventListener("pointerup",finish);
  fold?.addEventListener("pointercancel",finish);
  fold?.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ") return;
    e.preventDefault();
    peel=Math.min(220,page.getBoundingClientRect().width*.35);
    completeTurn();
  });

  if(reduced){
    document.querySelectorAll("[data-scroll-note]").forEach(el=>el.style.setProperty("--scroll-opacity","1"));
    handwritingTargets.forEach(el=>{
      const state=handState.get(el)||{current:1,target:1};
      state.current=1; state.target=1; handState.set(el,state);
      renderHandProgress(el,1);
    });
  }
})();