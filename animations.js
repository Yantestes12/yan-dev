/* ============================================================
   YAN OLIVEIRA — v3 ANIMATION ENGINE
   Card mini-animations + Modal simulation system
   ============================================================ */

/* ==========================================================
   LINKS EXTERNOS — PRIORIDADE MÁXIMA
   Registrado ANTES do DOMContentLoaded para garantir que
   nenhum outro handler interfira no clique.
   ========================================================== */
;(function() {
  function bindExternalLink(id, url) {
    function attach() {
      const el = document.getElementById(id);
      if (!el) return;
      // Força abertura via window.open — não depende do href nativo
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }, true);
      // Também seta href como fallback
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
    // Tenta imediatamente E após DOM carregar
    attach();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    }
  }
  bindExternalLink('link-linkedin', 'https://www.linkedin.com/in/yan-oliveira-185922215');
  bindExternalLink('link-whatsapp', 'https://wa.me/5522997984140');
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     UTILITIES
     ========================================================== */
  const simTimers = { t: [], i: [] };
  function sT(fn, ms) { const id = setTimeout(fn, ms); simTimers.t.push(id); return id; }
  function sI(fn, ms) { const id = setInterval(fn, ms); simTimers.i.push(id); return id; }
  function clearSim() {
    simTimers.t.forEach(clearTimeout);
    simTimers.i.forEach(clearInterval);
    simTimers.t = []; simTimers.i = [];
  }

  function typeInto(el, text, speed = 28) {
    el.textContent = '';
    let i = 0;
    function tick() {
      if (i < text.length) { el.textContent += text[i]; i++; sT(tick, speed); }
    }
    tick();
    return text.length * speed;
  }

  function simBubble(container, type, text, opts = {}) {
    const b = document.createElement('div');
    b.className = `sim-bubble ${type}`;
    container.appendChild(b);
    requestAnimationFrame(() => {
      b.classList.add('show');
      if (text) typeInto(b, text, opts.speed || 26);
    });
    return b;
  }

  function simTyping(container) {
    const t = document.createElement('div');
    t.className = 'sim-typing-ind';
    t.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    return t;
  }


  /* ==========================================================
     NAVIGATION
     ========================================================== */
  const nav = document.getElementById('main-nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      // Só faz smooth scroll para âncoras internas (ex: #rpa, #contact)
      // Links externos (https://, mailto:, wa.me etc.) nunca devem ser bloqueados
      if (!href || href.length <= 1 || !document.querySelector(href)) return;
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });


  /* ==========================================================
     HERO — CANVAS NODE NETWORK
     ========================================================== */
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const nodePos = [
    {x:.10,y:.25},{x:.35,y:.13},{x:.60,y:.20},{x:.88,y:.30},
    {x:.22,y:.70},{x:.52,y:.76},{x:.78,y:.65},
  ];
  const conns = [[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,3],[1,5],[2,6],[1,4],[2,5]];

  class Particle {
    constructor(a,b){this.a=a;this.b=b;this.p=0;this.spd=.007+Math.random()*.013;this.sz=1.2+Math.random()*1.5;this.col=['#00ff88','#00d4ff','#8b5cf6'][Math.floor(Math.random()*3)];}
    update(){this.p+=this.spd;return this.p<1;}
    draw(n){const f=n[this.a],t=n[this.b],x=f.x+(t.x-f.x)*this.p,y=f.y+(t.y-f.y)*this.p;ctx.beginPath();ctx.arc(x,y,this.sz,0,Math.PI*2);ctx.fillStyle=this.col;ctx.fill();const g=ctx.createRadialGradient(x,y,0,x,y,this.sz*4);g.addColorStop(0,this.col+'40');g.addColorStop(1,this.col+'00');ctx.beginPath();ctx.arc(x,y,this.sz*4,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  }

  let particles=[], nodesPx=[], nodePulse=nodePos.map(()=>0);
  function calcNodes(){const w=canvas.offsetWidth,h=canvas.offsetHeight;nodesPx=nodePos.map(n=>({x:n.x*w,y:n.y*h}));}
  calcNodes(); window.addEventListener('resize',calcNodes);

  setInterval(()=>{const c=conns[Math.floor(Math.random()*conns.length)];const d=Math.random()>.5;particles.push(new Particle(d?c[0]:c[1],d?c[1]:c[0]));},350);
  setInterval(()=>{nodePulse[Math.floor(Math.random()*nodesPx.length)]=1;},1200);

  function drawNet(){
    ctx.clearRect(0,0,canvas.offsetWidth,canvas.offsetHeight);
    conns.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(nodesPx[a].x,nodesPx[a].y);ctx.lineTo(nodesPx[b].x,nodesPx[b].y);ctx.strokeStyle='rgba(255,255,255,0.035)';ctx.lineWidth=1;ctx.stroke();});
    nodesPx.forEach((n,i)=>{
      const p=nodePulse[i];
      if(p>0){const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,12);g.addColorStop(0,`rgba(0,212,255,${.15*p})`);g.addColorStop(1,'rgba(0,212,255,0)');ctx.beginPath();ctx.arc(n.x,n.y,12,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();nodePulse[i]=Math.max(0,p-.018);}
      ctx.beginPath();ctx.arc(n.x,n.y,2.5,0,Math.PI*2);ctx.fillStyle=`rgba(0,212,255,${.3+p*.7})`;ctx.fill();
      ctx.beginPath();ctx.arc(n.x,n.y,1.2,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${.4+p*.6})`;ctx.fill();
    });
    particles=particles.filter(p=>{const a=p.update();if(a)p.draw(nodesPx);return a;});
    requestAnimationFrame(drawNet);
  }
  drawNet();


  /* ==========================================================
     SCROLL REVEAL
     ========================================================== */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold:.08, rootMargin:'0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));


  /* ==========================================================
     CARD MINI-ANIMATIONS (always running)
     ========================================================== */

  // --- Card 1A: OCR Pipeline ---
  const ocrJson = `{"nf":"43210","vlr":12850,\n "status":"validated"}`;
  function runOcrMini() {
    const pdf=document.getElementById('ocr-pdf'), a1=document.getElementById('ocr-arrow1'),
      ai=document.getElementById('ocr-ai'), a2=document.getElementById('ocr-arrow2'),
      json=document.getElementById('ocr-json'), a3=document.getElementById('ocr-arrow3'),
      db=document.getElementById('ocr-db'), chk=document.getElementById('ocr-check');

    pdf.classList.remove('active'); a1.classList.remove('active'); ai.classList.remove('processing');
    a2.classList.remove('active'); json.classList.remove('active'); json.textContent='';
    a3.classList.remove('active'); db.classList.remove('active'); chk.classList.remove('active');
    document.querySelectorAll('#anim-ocr .data-pulse').forEach(p=>p.classList.remove('traveling'));

    const t = setTimeout;
    t(()=>pdf.classList.add('active'), 200);
    t(()=>{a1.classList.add('active');a1.querySelector('.data-pulse').classList.add('traveling');}, 700);
    t(()=>ai.classList.add('processing'), 1200);
    t(()=>{a2.classList.add('active');a2.querySelector('.data-pulse').classList.add('traveling');json.classList.add('active');miniType(json,ocrJson,18);}, 1700);
    t(()=>{a3.classList.add('active');a3.querySelector('.data-pulse').classList.add('traveling');db.classList.add('active');}, 3100);
    t(()=>chk.classList.add('active'), 3600);
    t(()=>runOcrMini(), 6500);
  }
  function miniType(el,text,spd){el.textContent='';let i=0;function tick(){if(i<text.length){el.textContent+=text[i];i++;setTimeout(tick,spd);}}tick();}
  runOcrMini();

  // --- Card 1B: Mini Chat ---
  function runMiniChat() {
    const area = document.getElementById('mini-chat-area');
    area.innerHTML = '';
    const msgs = [
      { type:'patient', text:'Preciso agendar consulta.', delay:300 },
      { type:'typing', delay:1600 },
      { type:'bot', text:'Buscando horários...', delay:2200 },
      { type:'success', text:'✅ Agendado com sucesso.', delay:3800 },
    ];
    msgs.forEach(m => {
      setTimeout(() => {
        if (m.type === 'typing') {
          const t = document.createElement('div');
          t.className = 'mini-typing';
          t.innerHTML = '<span></span><span></span><span></span>';
          area.appendChild(t);
          requestAnimationFrame(() => t.classList.add('show'));
          setTimeout(() => t.remove(), 500);
          return;
        }
        const b = document.createElement('div');
        b.className = `mini-bubble ${m.type}`;
        b.textContent = m.text;
        area.appendChild(b);
        requestAnimationFrame(() => b.classList.add('show'));
      }, m.delay);
    });
    setTimeout(() => runMiniChat(), 7000);
  }
  runMiniChat();

  // --- Card 2A: Funnel ---
  function runFunnel() {
    const crmFlash = document.getElementById('crm-flash');
    const stage = document.getElementById('anim-funnel');
    stage.querySelectorAll('.funnel-ball').forEach(b => b.remove());

    const total = 5, greenIdx = new Set([1,3]);
    let cur = 0;

    function drop() {
      if (cur >= total) { setTimeout(runFunnel, 1400); return; }
      const isGreen = greenIdx.has(cur);
      const ball = document.createElement('div');
      ball.className = 'funnel-ball gray';
      stage.appendChild(ball);
      const startX = 52 + Math.random() * 36;
      ball.style.left = startX + 'px';
      ball.style.top = '0px';
      ball.style.transition = 'top .55s cubic-bezier(.4,0,.8,1), left .55s ease, opacity .3s ease';

      requestAnimationFrame(() => {
        ball.style.top = '50px'; ball.style.left = (startX*.7+22)+'px';
        setTimeout(() => {
          ball.style.top = '88px'; ball.style.left = '68px';
          if (isGreen) {
            setTimeout(() => {
              ball.classList.remove('gray'); ball.classList.add('green');
              setTimeout(() => {
                ball.style.top = '120px';
                setTimeout(() => { crmFlash.classList.add('active'); setTimeout(()=>crmFlash.classList.remove('active'),180); }, 280);
                setTimeout(() => { ball.style.opacity = '0'; }, 450);
              }, 350);
            }, 280);
          } else {
            setTimeout(() => { ball.style.opacity = '0'; }, 380);
          }
        }, 550);
      });
      cur++;
      setTimeout(drop, 480);
    }
    drop();
  }
  runFunnel();

  // --- Card 2B: Loading Bar ---
  function runLoadingBar() {
    const fill = document.getElementById('loading-fill');
    const pct = document.getElementById('loading-percent');
    const status = document.getElementById('sla-status');
    fill.style.transition = 'none'; fill.style.width = '0%';
    pct.textContent = '0%'; status.classList.remove('active');

    setTimeout(() => {
      fill.style.transition = 'width .8s cubic-bezier(.4,0,.2,1)';
      fill.style.width = '100%';
      let c = 0;
      const iv = setInterval(() => {
        c += 2; if (c > 100) c = 100;
        pct.textContent = c + '%';
        if (c >= 100) { clearInterval(iv); setTimeout(()=>status.classList.add('active'),180); }
      }, 16);
    }, 200);
    setTimeout(runLoadingBar, 3500);
  }
  runLoadingBar();


  /* ==========================================================
     SIMULATION MODAL
     ========================================================== */
  const overlay = document.getElementById('sim-overlay');
  const simPanels = document.querySelectorAll('.sim-panel');
  const simTitle = document.getElementById('sim-title');
  const closeBtn = document.getElementById('sim-close');

  const simConfig = {
    health:     { title:'triagem_saude.exe — em execução', fn: runSimHealth },
    logistics:  { title:'ocr_backoffice.exe — em execução', fn: runSimLogistics },
    realestate: { title:'crm_qualificador.exe — em execução', fn: runSimRealEstate },
    auto:       { title:'credito_omnichannel.exe — em execução', fn: runSimAuto },
  };

  let simStartTimer = null; // Timer nativo rastreado separadamente

  function openSim(name) {
    // Cancela qualquer timer de início pendente
    if (simStartTimer) { clearTimeout(simStartTimer); simStartTimer = null; }
    clearSim();

    const cfg = simConfig[name];
    if (!cfg) return;

    // Mostra o overlay
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Ativa o painel correto
    simPanels.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('sim-' + name);
    if (!panel) return;
    panel.classList.add('active');
    simTitle.textContent = cfg.title;

    // Mostra loading spinner dentro do modal
    const loader = document.createElement('div');
    loader.className = 'sim-loader';
    loader.id = 'sim-active-loader';
    loader.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
        <svg class="btn-spinner" style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.2"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);">Iniciando simulação...</span>
      </div>`;
    loader.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:5;';
    panel.appendChild(loader);

    // Timer RASTREADO — será cancelado por clearSim ou ao trocar de simulação
    simStartTimer = setTimeout(() => {
      simStartTimer = null;
      const l = document.getElementById('sim-active-loader');
      if (l) l.remove();
      try { cfg.fn(); } catch(err) { console.error('Erro na simulação:', err); }
    }, 400);
  }

  function closeSim() {
    // Cancela timer de início pendente
    if (simStartTimer) { clearTimeout(simStartTimer); simStartTimer = null; }
    clearSim();
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    // Limpa todos os painéis e loaders
    simPanels.forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sim-loader').forEach(l => l.remove());
  }

  // Button listeners — simples e sem bloquear o botão
  document.querySelectorAll('.card-sim-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openSim(this.dataset.sim);
    });
  });
  closeBtn.addEventListener('click', closeSim);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSim(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSim(); });


  /* ==========================================================
     SIM: HEALTH — WhatsApp Triagem
     ========================================================== */
  function runSimHealth() {
    const chat = document.getElementById('sim-health-chat');
    const toast = document.getElementById('sim-health-toast');

    function cycle() {
      chat.innerHTML = ''; toast.classList.remove('show');

      sT(() => simBubble(chat, 'patient', 'Preciso de um cardiologista urgente.', { speed:24 }), 300);

      sT(() => {
        const t = simTyping(chat);
        sT(() => {
          t.remove();
          simBubble(chat, 'bot', 'Olá. Conectando ao sistema Unimed... Qual a sua matrícula?', { speed:20 });
        }, 600);
      }, 2200);

      sT(() => simBubble(chat, 'patient', '123456', { speed:40 }), 5800);

      sT(() => toast.classList.add('show'), 6600);

      sT(() => cycle(), 10500);
    }
    cycle();
  }


  /* ==========================================================
     SIM: LOGISTICS — OCR Scanner + SQL
     ========================================================== */
  function runSimLogistics() {
    const scanner = document.getElementById('sim-scanner');
    const sqlRows = document.getElementById('sim-sql-rows');
    const sla = document.getElementById('sim-sla');

    const data = [
      { k:'CNPJ_Remetente', v:'12.345.678/0001-90' },
      { k:'Razão_Social', v:'PETROBRÁS LTDA' },
      { k:'Peso_Bruto', v:'45.000 kg (45 Ton)' },
      { k:'Material', v:'Tubos de Aço Inox' },
      { k:'NF_Número', v:'000.456.789' },
      { k:'Valor_Total', v:'R$ 287.450,00' },
      { k:'Status', v:'✅ SALVO NO BANCO DE DADOS', saved:true },
    ];

    function cycle() {
      sqlRows.innerHTML = ''; scanner.classList.remove('active'); sla.classList.remove('show');

      sT(() => scanner.classList.add('active'), 400);

      data.forEach((row, i) => {
        sT(() => {
          const el = document.createElement('div');
          el.className = 'sim-sql-row';
          el.innerHTML = row.saved
            ? `<span class="k">${row.k}:</span> <span class="saved">${row.v}</span>`
            : `<span class="k">${row.k}:</span> ${row.v}`;
          sqlRows.appendChild(el);
          requestAnimationFrame(() => el.classList.add('show'));
        }, 900 + i * 400);
      });

      sT(() => sla.classList.add('show'), 900 + data.length * 400 + 300);
      sT(() => cycle(), 8500);
    }
    cycle();
  }


  /* ==========================================================
     SIM: REAL ESTATE — Chat + Kanban
     ========================================================== */
  function runSimRealEstate() {
    const chat = document.getElementById('sim-re-chat');
    const hot = document.getElementById('sim-kanban-hot');
    const bell = document.getElementById('sim-bell');

    function cycle() {
      chat.innerHTML = ''; hot.innerHTML = ''; bell.classList.remove('show');

      sT(() => simBubble(chat, 'bot', 'Para liberar o catálogo VIP, sua renda mensal é acima de R$ 10.000?', { speed:20 }), 300);
      sT(() => simBubble(chat, 'patient', 'Sim, e tenho FGTS liberado.', { speed:24 }), 3200);

      sT(() => {
        const card = document.createElement('div');
        card.className = 'sim-kanban-card';
        card.innerHTML = '<div class="name">👤 Carlos M. Silva</div><div class="tag">💰 Renda: >10k | FGTS ✓</div>';
        hot.appendChild(card);
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('landed')));
      }, 5000);

      sT(() => bell.classList.add('show'), 5800);
      sT(() => cycle(), 10000);
    }
    cycle();
  }


  /* ==========================================================
     SIM: AUTO — Instagram DM + Credit
     ========================================================== */
  function runSimAuto() {
    const chat = document.getElementById('sim-auto-chat');
    const phone = document.getElementById('sim-auto-phone');
    const creditOv = document.getElementById('sim-credit-overlay');
    const approved = document.getElementById('sim-approved');
    const flash = document.getElementById('sim-flash');

    function cycle() {
      chat.innerHTML = '';
      phone.classList.remove('fade-out'); phone.style.display = 'flex';
      creditOv.classList.remove('show'); approved.classList.remove('show'); flash.classList.remove('show');

      sT(() => simBubble(chat, 'patient', 'Aprova financiamento nesse SUV?', { speed:24 }), 300);

      sT(() => {
        const t = simTyping(chat);
        sT(() => { t.remove(); simBubble(chat, 'bot', 'Aprovamos na hora. Qual seu CPF para consultar o sistema?', { speed:20 }); }, 500);
      }, 2000);

      sT(() => simBubble(chat, 'patient', '021.456.789-10', { speed:34 }), 5000);

      sT(() => {
        phone.classList.add('fade-out');
        sT(() => creditOv.classList.add('show'), 500);
      }, 6200);

      sT(() => {
        creditOv.classList.remove('show');
        flash.classList.add('show');
        sT(() => { approved.classList.add('show'); sT(()=>flash.classList.remove('show'),600); }, 300);
      }, 8200);

      sT(() => cycle(), 12000);
    }
    cycle();
  }

});
