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
  });

  const setHandProgress=(el,progress)=>{
    const chars=[...el.querySelectorAll(".handwrite-char")];
    const total=Math.max(chars.length,1);
    chars.forEach((char,index)=>{
      const start=index/total;
      const end=Math.min(1,start+.18);
      const local=Math.max(0,Math.min(1,(progress-start)/Math.max(.001,end-start)));
      char.style.opacity=local.toFixed(3);
      char.style.filter=`blur(${(2.4*(1-local)).toFixed(2)}px)`;
      char.style.transform=`translateY(${(5*(1-local)).toFixed(2)}px)`;
    });
  };

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
      const enter=1-Math.min(1,Math.max(0,(r.top-vh*.24)/(vh*.54)));
      const leave=Math.min(1,Math.max(0,(r.bottom-vh*.08)/(vh*.42)));
      setHandProgress(el,Math.max(0,Math.min(1,enter*leave)));
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
    handwritingTargets.forEach(el=>setHandProgress(el,1));
  }
})();