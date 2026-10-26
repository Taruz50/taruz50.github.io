(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = document.querySelector("[data-paint-stage]");
  const replay = document.querySelector("[data-ink-replay]");
  const image = document.querySelector(".paint-image");
  const brush = document.querySelector("[data-ink-brush]");

  const markImageMissing = () => stage?.classList.add("is-missing");
  if (image) {
    image.addEventListener("error", markImageMissing, { once:true });
    if (image.complete && image.naturalWidth === 0) markImageMissing();
  }

  const playInk = () => {
    if (!stage || !brush || reduced) return;
    stage.classList.remove("is-brushing");
    void stage.offsetWidth;
    stage.classList.add("is-brushing");
  };

  if (stage && brush && !reduced) requestAnimationFrame(() => requestAnimationFrame(playInk));
  replay?.addEventListener("click", playInk);

  const handState=new Map();

  const renderHandProgress=(el,progress)=>{
    const chars=[...el.querySelectorAll(".handwrite-char")];
    const total=Math.max(chars.length,1);
    chars.forEach((char,index)=>{
      const start=Math.max(0,index/total-.08);
      const end=Math.min(1,start+.34);
      const local=Math.max(0,Math.min(1,(progress-start)/Math.max(.001,end-start)));
      const eased=local*local*(3-2*local);
      char.style.opacity=eased.toFixed(3);
      char.style.filter=`blur(${(1.25*(1-eased)).toFixed(2)}px)`;
      char.style.transform=`translateY(${(2.2*(1-eased)).toFixed(2)}px)`;
    });
  };

  const setHandTarget=(el,progress)=>{
    const state=handState.get(el)||{current:0,target:0};
    state.target=Math.max(0,Math.min(1,progress));
    handState.set(el,state);
  };

  const animateHands=()=>{
    handState.forEach((state,el)=>{
      const delta=state.target-state.current;
      state.current=Math.abs(delta)>.001?state.current+delta*.16:state.target;
      renderHandProgress(el,state.current);
    });
    requestAnimationFrame(animateHands);
  };

  const handwritingTargets=[...document.querySelectorAll("[data-handwrite]")];
  handwritingTargets.forEach(el=>{
    if(el.dataset.handwriteReady) return;
    const text=el.textContent??"";
    el.textContent="";
    el.setAttribute("aria-label",text);
    [...text].forEach(char=>{
      const span=document.createElement("span");
      span.className="handwrite-char";
      span.textContent=char===" "?"\u00a0":char;
      el.appendChild(span);
    });
    el.dataset.handwriteReady="true";
    handState.set(el,{current:0,target:0});
  });
  requestAnimationFrame(animateHands);

  const blocks=[...document.querySelectorAll("[data-tribute-reveal]")];
  const update=()=>{
    if(reduced) return;
    const vh=window.innerHeight||1;

    blocks.forEach(block=>{
      const r=block.getBoundingClientRect();
      const enter=1-Math.min(1,Math.max(0,(r.top-vh*.14)/(vh*.72)));
      const leave=Math.min(1,Math.max(0,(r.bottom-vh*.08)/(vh*.56)));
      const strength=Math.max(.08,Math.min(1,Math.min(enter,leave)*1.08));
      block.style.setProperty("--tribute-scroll-opacity",strength.toFixed(3));
      block.classList.toggle("is-visible",strength>.12);
    });

    handwritingTargets.forEach(el=>{
      const r=el.getBoundingClientRect();
      const center=r.top+r.height/2;
      const writeStart=vh*.78, fullStart=vh*.58, fullEnd=vh*.34, eraseEnd=vh*.12;
      let progress=0;
      if(center<writeStart&&center>fullStart){
        progress=(writeStart-center)/(writeStart-fullStart);
      }else if(center<=fullStart&&center>=fullEnd){
        progress=1;
      }else if(center<fullEnd&&center>eraseEnd){
        progress=(center-eraseEnd)/(fullEnd-eraseEnd);
      }
      setHandTarget(el,Math.max(0,Math.min(1,progress)));
    });
  };

  let ticking=false;
  const onScroll=()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{update();ticking=false;});
  };
  update();
  addEventListener("scroll",onScroll,{passive:true});
  addEventListener("resize",onScroll);

  if(reduced){
    blocks.forEach(block=>{
      block.classList.add("is-visible");
      block.style.setProperty("--tribute-scroll-opacity","1");
    });
    handwritingTargets.forEach(el=>{
      const state=handState.get(el)||{current:1,target:1};
      state.current=1;state.target=1;handState.set(el,state);
      renderHandProgress(el,1);
    });
  }
})();