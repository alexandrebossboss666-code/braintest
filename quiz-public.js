/* quiz-public.js — tests publiés : commande « run a test », déroulement du test, bilan « Quiz public N »
   À charger APRÈS le script principal du site (voir la ligne à ajouter avant </body>). */
(function(){
  const KEY = "braintest_public_bilans";
  // Commande secrète (non listée dans les suggestions ni dans « help ») et lien du logiciel
  const SECRET_CMD = "get the editor";
  const EDITOR_URL = "https://github.com/alexandrebossboss666-code/braintest/releases/latest/download/Editeur-de-tests-Setup.exe";
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
.qp-rec.ko{background:#f8dcdc;border-color:#c0342c}
.dl-box{position:relative;width:min(340px,100%);aspect-ratio:1/1;background:#fff;border:2px solid #1c1c18;border-radius:10px;padding:22px;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:'Inter',sans-serif;color:#26261f}
.dl-x{position:absolute;top:10px;right:14px;cursor:pointer;font-size:1.1rem;color:#666}
.dl-text{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:.88rem;line-height:1.5}
.dl-text h2{font-family:'Space Grotesk',sans-serif;margin:0 0 10px;font-size:1.2rem}
.dl-text p{margin:0 0 8px}
.dl-text small{color:#6b6b67;font-size:.74rem;line-height:1.4}
.dl-btn{display:flex;align-items:center;justify-content:center;border-radius:14px;padding:12px;background:var(--accent);color:#3a2408;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:.95rem;text-decoration:none}
.dl-btn:hover{background:var(--accent-dark)}
.dl-arrow{position:relative;display:inline-block;width:16px;height:18px;margin-left:10px}
.dl-arrow::before{content:"";position:absolute;left:6px;top:0;width:3px;height:14px;background:currentColor}
.dl-arrow::after{content:"";position:absolute;left:3px;top:4px;width:10px;height:10px;border:solid currentColor;border-width:0 3px 3px 0;transform:rotate(45deg)}
.qp-hb{position:absolute;bottom:20px;width:44px;height:44px;border:2px solid #d4a800;background:#fff8d6;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.qp-hb.l{left:30px}
.qp-hb.r{right:30px}
.qp-bulb{position:relative;display:inline-block;width:18px;height:26px}
.qp-bulb::before{content:"";position:absolute;left:0;top:0;width:18px;height:18px;border-radius:50%;background:#FFD43B;box-shadow:0 0 6px rgba(255,200,0,.7)}
.qp-bulb::after{content:"";position:absolute;left:4px;top:18px;width:10px;height:6px;background:#8f8f8a;border-radius:0 0 3px 3px}`;
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
      body = '<div class="options">' + q.choices.map((c, k) => { const m = q.type === "single" && q.mask === k; return '<button class="opt-btn' + (m ? ' mystery-card' : '') + '" data-k="' + k + '">' + (m ? "?" : escapeHtml(c.t)) + '</button>'; }).join("") + '</div>'
        + (q.type === "multi" ? '<button class="qp-val" id="qpVal">Valider</button>' : "");
    }
    const hh = q.hint && typeof q.hint.text === "string" && q.hint.text.trim();
    const hintP = hh ? '<p id="qpHint" style="display:none;text-align:center;color:#8a6d00;font-size:.85rem;font-weight:600;margin:-8px 6px 14px">Indice : ' + escapeHtml(q.hint.text) + '</p>' : "";
    const hintBtn = hh ? '<button class="qp-hb ' + (q.hint.pos === "r" ? "r" : "l") + '" id="qpBulb" aria-label="Voir l’indice"><span class="qp-bulb"></span></button>' : "";
    card.innerHTML = '<div class="quiz-progress">' + escapeHtml(cur.name) + ' · Question ' + (i + 1) + ' / ' + n + '</div>'
      + '<p class="question-text">' + escapeHtml(q.text) + '</p>' + hintP + body
      + '<p class="feedback-flash" id="qpFb"></p><p class="qp-quit" id="qpQuit">Quitter le test</p>' + hintBtn;
    $id("qpQuit").onclick = () => { qz = null; renderRegistration(); };
    const bb = $id("qpBulb");
    if(bb) bb.onclick = () => { const h = $id("qpHint"); h.style.display = h.style.display === "none" ? "block" : "none"; };

    const btns = [...card.querySelectorAll(".opt-btn")];
    const goods = q.type === "text" ? q.answer : q.choices.filter(c => c.ok).map(c => c.t).join(", ");
    let done = false;
    const next = (ok, given, fb) => {
      done = true;
      cur.rec.push({ q: q.text, ok, given, correct: goods });
      const f = $id("qpFb"); if(f){ f.style.color = ok ? "#4a7a3a" : "#c0342c"; f.textContent = fb; }
      setTimeout(() => { if(qz !== cur) return; i + 1 < n ? playQ(i + 1) : endQuiz(); }, 1100);
    };

    if(q.type === "single"){
      btns.forEach(btn => btn.onclick = () => {
        if(done) return;
        done = true;
        const c = q.choices[btn.dataset.k], ok = !!c.ok;
        btns.forEach(x => x.classList.add("disabled"));
        const my = card.querySelector(".mystery-card");
        const reveal = my ? flipButton(my, () => { my.textContent = q.choices[my.dataset.k].t; my.classList.remove("mystery-card"); }, 300) : Promise.resolve();
        reveal.then(() => {
          btns.forEach(x => { if(q.choices[x.dataset.k].ok) x.classList.add("correct"); });
          if(!ok) btn.classList.add("wrong");
          next(ok, c.t, ok ? "Bonne réponse !" : "Pas tout à fait…");
        });
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

  /* ---------- Fenêtre de téléchargement du logiciel ---------- */
  function openDownload(){
    if($id("dlOv")) return;
    const ov = document.createElement("div");
    ov.id = "dlOv";
    ov.style.cssText = "position:fixed;inset:0;background:rgba(20,20,18,.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px";
    ov.innerHTML = '<div class="dl-box"><span class="dl-x" id="dlX">✕</span>'
      + '<div class="dl-text"><h2>Éditeur de tests</h2>'
      + '<p>Crée tes propres tests, puis publie-les sur le site : tout le monde pourra les lancer avec la commande « run a test ».</p>'
      + '<small>Pour Windows, mises à jour automatiques. Si Windows affiche un avertissement, clique sur « Informations complémentaires » puis « Exécuter quand même ».</small></div>'
      + '<a class="dl-btn" href="' + EDITOR_URL + '">Télécharger<span class="dl-arrow"></span></a></div>';
    const close = () => ov.remove();
    ov.onclick = e => { if(e.target === ov) close(); };
    document.body.appendChild(ov);
    $id("dlX").onclick = close;
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
    if(!termAwaitingRestore && cmd.toLowerCase() === SECRET_CMD){
      termPrint("> " + cmd, "cmd");
      openDownload();
      return;
    }
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
