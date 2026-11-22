/* quiz-public.js — tests publiés : commande « run a test », déroulement du test, bilan « Quiz public N »
   À charger APRÈS le script principal du site (voir la ligne à ajouter avant </body>). */
(function(){
  const KEY = "braintest_public_bilans";
  const $id = id => document.getElementById(id);
  const norm = s => String(s).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function load(){
    try{ const d = JSON.parse(localStorage.getItem(KEY)); return d && Array.isArray(d.items) ? d : { items: [], next: 1 }; }
    catch(e){ return { items: [], next: 1 }; }
  }
  function save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }

  const st = document.createElement("style");
  st.textContent = `
.bilan-item.pb{background:#d0d0cd;color:#26261f;border-radius:0;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,0 100%)}
.opt-btn.qp-sel{background:#FFBA6B;border-color:#e8a04f}
.qp-val{display:block;margin:16px auto 0;border:none;border-radius:14px;padding:12px 22px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:.95rem;cursor:pointer;background:var(--accent);color:#3a2408}
.qp-val:hover{background:var(--accent-dark)}
.qp-quit{text-align:center;font-size:.78rem;font-weight:600;color:#6b6b67;text-decoration:underline;cursor:pointer;margin:14px 0 0}
.qp-rec{text-align:left;font-size:.88rem;padding:10px 12px;margin-bottom:10px;border-radius:10px;border:1.5px solid}
.qp-rec.ok{background:#e3f3da;border-color:#3f7a2b}
.qp-rec.ko{background:#f8dcdc;border-color:#c0342c}`;
  document.head.appendChild(st);

  /* ---------- Bilans « Quiz public » dans la colonne Bilan ---------- */
  const baseRender = renderBilanList;
  renderBilanList = function(){
    baseRender();
    const d = load();
    if(!d.items.length) return;
    const empty = bilanList.querySelector(".bilan-empty");
    if(empty) empty.remove();
    d.items.forEach(b => {
      const el = document.createElement("div");
      el.className = "bilan-item pb";
      el.innerHTML = '<span class="trash" title="Supprimer">🗑</span>Quiz public ' + b.n;
      el.querySelector(".trash").onclick = e => {
        e.stopPropagation();
        const x = load(); x.items = x.items.filter(i => i.id !== b.id); save(x);
        renderBilanList();
      };
      el.onclick = () => openRecap(b);
      bilanList.appendChild(el);
    });
  };

  function openRecap(b){
    sheet.innerHTML = '<span class="close-x" id="closeSheet">✕</span><h2>Quiz public ' + b.n + '</h2>'
      + '<p class="subtitle">' + escapeHtml(b.name) + '</p>'
      + '<div class="result-block"><h3>Score : ' + b.good + ' / ' + b.total + '</h3></div>'
      + b.rec.map((r, i) => '<div class="qp-rec ' + (r.ok ? "ok" : "ko") + '"><b>' + (i + 1) + '. ' + escapeHtml(r.q) + '</b><br>Ta réponse : '
        + escapeHtml(r.given || "—") + (r.ok ? "" : '<br>Bonne réponse : ' + escapeHtml(r.correct)) + '</div>').join("");
    overlay.classList.add("show");
    $id("closeSheet").addEventListener("click", () => overlay.classList.remove("show"));
  }

  /* ---------- Déroulement du test ---------- */
  let qz = null;

  function playQ(i){
    const cur = qz, q = cur.questions[i], n = cur.questions.length, card = $id("card");
    let body;
    if(q.type === "text"){
      body = '<div class="field" style="width:78%;margin:0 auto"><input type="text" id="qpIn" maxlength="80" autocomplete="off" placeholder="Ta réponse"></div><button class="qp-val" id="qpVal">Valider</button>';
    } else {
      body = '<div class="options">' + q.choices.map((c, k) => '<button class="opt-btn" data-k="' + k + '">' + escapeHtml(c.t) + '</button>').join("") + '</div>'
        + (q.type === "multi" ? '<button class="qp-val" id="qpVal">Valider</button>' : "");
    }
    card.innerHTML = '<div class="quiz-progress">' + escapeHtml(cur.name) + ' · Question ' + (i + 1) + ' / ' + n + '</div>'
      + '<p class="question-text">' + escapeHtml(q.text) + '</p>' + body
      + '<p class="feedback-flash" id="qpFb"></p><p class="qp-quit" id="qpQuit">Quitter le test</p>';
    $id("qpQuit").onclick = () => { qz = null; renderRegistration(); };

    const btns = [...card.querySelectorAll(".opt-btn")];
    const goods = q.type === "text" ? q.answer : q.choices.filter(c => c.ok).map(c => c.t).join(", ");
    let done = false;
    const next = (ok, given, fb) => {
      done = true;
      cur.rec.push({ q: q.text, ok, given, correct: goods });
      const f = $id("qpFb"); f.style.color = ok ? "#4a7a3a" : "#c0342c"; f.textContent = fb;
      setTimeout(() => { if(qz !== cur) return; i + 1 < n ? playQ(i + 1) : endQuiz(); }, 1100);
    };

    if(q.type === "single"){
      btns.forEach(btn => btn.onclick = () => {
        if(done) return;
        const c = q.choices[btn.dataset.k], ok = !!c.ok;
        btns.forEach(x => { x.classList.add("disabled"); if(q.choices[x.dataset.k].ok) x.classList.add("correct"); });
        if(!ok) btn.classList.add("wrong");
        next(ok, c.t, ok ? "Bonne réponse !" : "Pas tout à fait…");
      });
    } else if(q.type === "multi"){
      btns.forEach(btn => btn.onclick = () => { if(!done) btn.classList.toggle("qp-sel"); });
      $id("qpVal").onclick = () => {
        if(done) return;
        let ok = true; const given = [];
        btns.forEach(x => {
          const c = q.choices[x.dataset.k], sel = x.classList.contains("qp-sel");
          if(!!c.ok !== sel) ok = false;
          if(sel) given.push(c.t);
          x.classList.remove("qp-sel"); x.classList.add("disabled");
          if(c.ok) x.classList.add("correct"); else if(sel) x.classList.add("wrong");
        });
        next(ok, given.join(", "), ok ? "Bonne réponse !" : "Pas tout à fait…");
      };
    } else {
      const inp = $id("qpIn");
      const go = () => {
        if(done) return;
        const ok = norm(inp.value) === norm(q.answer);
        inp.disabled = true;
        next(ok, inp.value.trim(), ok ? "Bonne réponse !" : "La réponse était : " + q.answer);
      };
      $id("qpVal").onclick = go;
      inp.onkeydown = e => { if(e.key === "Enter") go(); };
      inp.focus();
    }
  }

  function endQuiz(){
    const d = load(), good = qz.rec.filter(r => r.ok).length;
    const b = { id: Date.now().toString(36), n: d.next, name: qz.name, good, total: qz.rec.length, rec: qz.rec };
    d.items.unshift(b); d.next++; save(d);
    qz = null;
    renderRegistration(); renderBilanList(); openRecap(b);
  }

  async function startQuiz(id){
    if(maintenanceActive){ termPrint("Test indisponible pour le moment (maintenance).", "err"); return; }
    if(step !== 0){ termPrint("Termine d’abord le test en cours.", "err"); return; }
    termPrint("Chargement du test…");
    try{
      const { data, error } = await sb.rpc("get_quiz", { p_id: id });
      if(error || !data || !data[0]){ termPrint("Test introuvable (il a peut-être été retiré).", "err"); return; }
      termPanel.classList.remove("show");
      qz = { name: data[0].name, questions: data[0].questions, rec: [] };
      step = 99;
      playQ(0);
    } catch(e){ termPrint("Erreur de connexion, réessaie.", "err"); }
  }

  /* ---------- Commande « run a test » ---------- */
  async function listQuizzes(){
    termPrint("Chargement des tests publiés…");
    try{
      const { data, error } = await sb.rpc("list_quizzes");
      if(error){ termPrint("Erreur serveur : " + (error.message || "inconnue"), "err"); return; }
      if(!data || !data.length){ termPrint("Aucun test publié pour le moment."); return; }
      termPrint("Tests publiés (clique sur un test pour le lancer) :", "ok");
      data.forEach((t, i) => {
        const line = document.createElement("p");
        line.className = "term-line";
        line.style.cursor = "pointer"; line.style.textDecoration = "underline";
        line.textContent = "  " + (i + 1) + ". " + t.name + " (" + t.nb + " question" + (t.nb > 1 ? "s" : "") + ")";
        line.onclick = () => startQuiz(t.id);
        termLog.appendChild(line);
      });
      termLog.scrollTop = termLog.scrollHeight;
    } catch(e){ termPrint("Erreur de connexion, réessaie.", "err"); }
  }

  const baseRun = termRun;
  termRun = async function(raw){
    const cmd = raw.trim();
    if(!termAwaitingRestore && /^run a test$/i.test(cmd)){
      termPrint("> " + cmd, "cmd");
      await listQuizzes();
      return;
    }
    return baseRun(raw);
  };
  TERM_COMMANDS.push({ usage: "run a test", desc: "liste les tests publiés et lance celui que tu choisis" });

  renderBilanList();
})();
