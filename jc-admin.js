/* ============================================================
   J Cookies — Painel Admin (Supabase)
   ============================================================ */
(function () {
  const sb = window.sb;
  const esc = (window.JC && window.JC.esc) || (s => String(s == null ? '' : s));
  const brl = (window.JC && window.JC.brl) || (n => 'R$ ' + Number(n || 0).toFixed(2).replace('.', ','));
  const toast = window.showToast || (m => alert(m));
  const $ = id => document.getElementById(id);
  let session = null, currentTab = 'pedidos';

  /* Rota secreta do painel (troque por outra se quiser).
     O painel SÓ abre acessando: https://seusite.com/#admin-jcookies-2026 */
  const ADMIN_ROUTE = '#admin-jcookies-2026';
  window.JC_ADMIN_ROUTE = ADMIN_ROUTE;

  /* Limite de tentativas de login: 4 a cada 30 minutos */
  const LOGIN_MAX = 4, LOGIN_WINDOW = 30 * 60 * 1000;
  function getFails() { try { return JSON.parse(localStorage.getItem('jc_login_fails') || '[]'); } catch (e) { return []; } }
  function setFails(a) { try { localStorage.setItem('jc_login_fails', JSON.stringify(a)); } catch (e) {} }
  function recentFails() { const now = Date.now(); const a = getFails().filter(t => now - t < LOGIN_WINDOW); setFails(a); return a; }
  function lockMsRemaining() { const a = recentFails(); if (a.length < LOGIN_MAX) return 0; return Math.max(0, a[0] + LOGIN_WINDOW - Date.now()); }

  function noSb() { if (!sb) { alert('Sem conexão com o Supabase neste momento.'); return true; } return false; }
  function requireAuth() { if (session) return true; toast('🔒 Sua sessão expirou. Faça login novamente.'); showLogin(); return false; }

  /* ---------- AUTH ---------- */
  async function checkSession() { if (!sb) return null; try { const { data } = await sb.auth.getSession(); session = data.session; } catch (e) { session = null; } return session; }
  async function openAdmin() {
    $('adminOverlay').classList.add('open'); document.body.classList.add('no-scroll');
    await checkSession();
    if (session) showPanel(); else showLogin();
  }
  function closeAdmin() {
    $('adminOverlay').classList.remove('open'); document.body.classList.remove('no-scroll');
    if (location.hash === ADMIN_ROUTE) history.replaceState(null, '', location.pathname + location.search);
  }
  function showLogin() { $('admin-login').style.display = 'block'; $('admin-panel').style.display = 'none'; }
  function showPanel() { $('admin-login').style.display = 'none'; $('admin-panel').style.display = 'flex'; loadTab(currentTab); }
  async function doLogin() {
    if (noSb()) return;
    const email = $('login-email').value.trim(), senha = $('login-senha').value, err = $('login-err');
    err.textContent = '';
    // bloqueio por excesso de tentativas
    const lock = lockMsRemaining();
    if (lock > 0) { err.textContent = '🔒 Muitas tentativas. Tente novamente em ' + Math.ceil(lock / 60000) + ' min.'; return; }
    if (!email || !senha) { err.textContent = 'Preencha e-mail e senha.'; return; }
    const b = $('login-btn'); b.disabled = true; b.textContent = 'Entrando…';
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    b.disabled = false; b.textContent = 'Entrar';
    if (error) {
      const a = getFails(); a.push(Date.now()); setFails(a);
      const lock2 = lockMsRemaining();
      if (lock2 > 0) { err.textContent = '🔒 Limite de tentativas atingido. Acesso bloqueado por ' + Math.ceil(lock2 / 60000) + ' min.'; }
      else {
        const restantes = LOGIN_MAX - recentFails().length;
        err.textContent = (error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message) + ' (' + restantes + ' tentativa' + (restantes === 1 ? '' : 's') + ' restante' + (restantes === 1 ? '' : 's') + ')';
      }
      return;
    }
    setFails([]); // sucesso: zera o contador
    session = data.session; showPanel();
  }
  async function doLogout() { if (sb) await sb.auth.signOut(); session = null; showLogin(); }

  /* ---------- TABS ---------- */
  function loadTab(t) {
    currentTab = t;
    document.querySelectorAll('.atab').forEach(x => x.classList.toggle('active', x.dataset.tab === t));
    document.querySelectorAll('.apane').forEach(p => p.classList.toggle('active', p.dataset.pane === t));
    if (t === 'pedidos') loadPedidos();
    if (t === 'produtos') loadProdAdmin();
    if (t === 'cupons') loadCupomAdmin();
    if (t === 'avaliacoes') loadAvalAdmin();
    if (t === 'faq') loadFaqAdmin();
    if (t === 'passos') loadPassoAdmin();
    if (t === 'textos') loadTextos();
    if (t === 'mensagens') loadMensagens();
    if (t === 'loja') loadConfigAdmin();
  }

  /* ---------- PRODUTOS ---------- */
  async function loadProdAdmin() {
    loadEstoque();
    const l = $('a-prod-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    const { data, error } = await sb.from('produtos').select('*').order('categoria').order('ordem');
    if (error) { l.innerHTML = '<p style="color:#b23b22;">' + esc(error.message) + '</p>'; return; }
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhum produto ainda. Clique em "+ Novo".</p>'; return; }
    const catName = c => c === 'especiais' ? 'Especiais' : 'Cookies';
    l.innerHTML = data.map(p =>
      '<div class="a-row" data-id="' + p.id + '">' +
        '<div class="a-thumb">' + (p.foto_url ? '<img src="' + esc(p.foto_url) + '">' : '🍪') + '</div>' +
        '<div class="a-info"><div class="a-name">' + esc(p.nome) +
          (p.disponivel === false ? '<span class="a-pill sold">esgotado</span>' : '') +
          ((p.estoque !== null && p.estoque !== undefined && p.estoque <= 0) ? '<span class="a-pill sold">sem estoque</span>' : '') +
          (p.destaque ? '<span class="a-pill star">destaque</span>' : '') +
          (p.ativo === false ? '<span class="a-pill off">oculto</span>' : '') +
        '</div><div class="a-meta">' + brl(p.preco) + ' · ' + (p.peso || '—') + ' · ' + catName(p.categoria) +
          ((p.estoque !== null && p.estoque !== undefined) ? ' · estoque: ' + p.estoque : '') +
        '</div></div>' +
        '<div class="a-actions"><button class="a-btn-sm" data-a="e">Editar</button><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div>' +
      '</div>'
    ).join('');
    l.querySelectorAll('[data-a="e"]').forEach(b => b.onclick = () => editProd(b.closest('.a-row').dataset.id));
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = () => delProd(b.closest('.a-row').dataset.id));
  }
  function editProd(id) { sb.from('produtos').select('*').eq('id', id).single().then(({ data }) => openProdForm(data)); }
  function openProdForm(p) {
    $('a-prod-modal').classList.add('open');
    $('a-prod-title').textContent = p ? 'Editar produto' : 'Novo produto';
    $('a-f-id').value = p && p.id || '';
    $('a-f-nome').value = p && p.nome || '';
    $('a-f-descricao').value = p && p.descricao || '';
    $('a-f-preco').value = p && p.preco || '';
    $('a-f-peso').value = p && p.peso || '';
    $('a-f-badge').value = p && p.badge || '';
    $('a-f-badge-cor').value = p && p.badge_cor || 'cls';
    $('a-f-categoria').value = p && p.categoria || 'cardapio';
    $('a-f-ordem').value = p && p.ordem || 0;
    $('a-f-estoque').value = (p && p.estoque !== null && p.estoque !== undefined) ? p.estoque : '';
    $('a-f-disponivel').checked = !p || p.disponivel !== false;
    $('a-f-destaque').checked = !!(p && p.destaque);
    $('a-f-ativo').checked = !p || p.ativo !== false;
    const pv = $('a-f-foto-preview');
    if (p && p.foto_url) { pv.src = p.foto_url; pv.style.display = 'block'; } else pv.style.display = 'none';
    $('a-f-foto').value = ''; $('a-f-err').textContent = '';
  }
  function closeProdForm() { $('a-prod-modal').classList.remove('open'); }
  async function saveProd() {
    if (noSb() || !requireAuth()) return;
    const err = $('a-f-err'); err.textContent = '';
    const id = $('a-f-id').value, nome = $('a-f-nome').value.trim(), preco = parseFloat($('a-f-preco').value);
    if (!nome) { err.textContent = 'Nome é obrigatório.'; return; }
    if (isNaN(preco) || preco < 0) { err.textContent = 'Preço inválido.'; return; }
    const payload = {
      nome, descricao: $('a-f-descricao').value.trim(), preco, peso: $('a-f-peso').value.trim(),
      badge: $('a-f-badge').value.trim() || null, badge_cor: $('a-f-badge-cor').value,
      categoria: $('a-f-categoria').value, ordem: parseInt($('a-f-ordem').value) || 0,
      estoque: $('a-f-estoque').value === '' ? null : Math.max(0, parseInt($('a-f-estoque').value) || 0),
      disponivel: $('a-f-disponivel').checked, destaque: $('a-f-destaque').checked, ativo: $('a-f-ativo').checked
    };
    const b = $('a-f-save'); b.disabled = true; b.textContent = 'Salvando…';
    const file = $('a-f-foto').files[0];
    if (file) {
      try {
        const ext = file.name.split('.').pop(), path = 'produto-' + Date.now() + '.' + ext;
        const { error: ue } = await sb.storage.from('fotos-produtos').upload(path, file, { upsert: true });
        if (ue) throw ue;
        payload.foto_url = sb.storage.from('fotos-produtos').getPublicUrl(path).data.publicUrl;
      } catch (e) { err.textContent = 'Erro no upload: ' + e.message; b.disabled = false; b.textContent = 'Salvar'; return; }
    }
    const r = id ? await sb.from('produtos').update(payload).eq('id', id) : await sb.from('produtos').insert(payload);
    b.disabled = false; b.textContent = 'Salvar';
    if (r.error) { err.textContent = r.error.message; return; }
    closeProdForm(); loadProdAdmin(); window.JC && window.JC.reloadProducts(); toast('✓ Produto salvo!');
  }
  async function delProd(id) {
    if (!requireAuth()) return;
    if (!confirm('Excluir esse produto? Essa ação não pode ser desfeita.')) return;
    const { error } = await sb.from('produtos').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    loadProdAdmin(); window.JC && window.JC.reloadProducts(); toast('🗑 Produto excluído');
  }

  /* ---------- FAQ ---------- */
  async function loadFaqAdmin() {
    const l = $('a-faq-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    const { data } = await sb.from('faqs').select('*').order('ordem');
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhuma pergunta ainda.</p>'; return; }
    l.innerHTML = data.map(f =>
      '<div class="a-row" data-id="' + f.id + '"><div class="a-thumb">❓</div><div class="a-info"><div class="a-name">' + esc(f.pergunta) + (f.ativo === false ? '<span class="a-pill off">oculta</span>' : '') + '</div><div class="a-meta">' + esc((f.resposta || '').slice(0, 70)) + '…</div></div><div class="a-actions"><button class="a-btn-sm" data-a="e">Editar</button><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div></div>'
    ).join('');
    l.querySelectorAll('[data-a="e"]').forEach(b => b.onclick = () => editFaq(b.closest('.a-row').dataset.id));
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = () => delFaq(b.closest('.a-row').dataset.id));
  }
  function editFaq(id) { sb.from('faqs').select('*').eq('id', id).single().then(({ data }) => openFaqForm(data)); }
  function openFaqForm(f) {
    $('a-faq-modal').classList.add('open');
    $('a-faq-title').textContent = f ? 'Editar pergunta' : 'Nova pergunta';
    $('fq-id').value = f && f.id || '';
    $('fq-pergunta').value = f && f.pergunta || '';
    $('fq-resposta').value = f && f.resposta || '';
    $('fq-ordem').value = f && f.ordem || 0;
    $('fq-ativo').checked = !f || f.ativo !== false;
    $('fq-err').textContent = '';
  }
  function closeFaq() { $('a-faq-modal').classList.remove('open'); }
  async function saveFaq() {
    if (noSb() || !requireAuth()) return;
    const err = $('fq-err'); err.textContent = '';
    const id = $('fq-id').value, perg = $('fq-pergunta').value.trim(), resp = $('fq-resposta').value.trim();
    if (!perg || !resp) { err.textContent = 'Pergunta e resposta são obrigatórias.'; return; }
    const payload = { pergunta: perg, resposta: resp, ordem: parseInt($('fq-ordem').value) || 0, ativo: $('fq-ativo').checked };
    const r = id ? await sb.from('faqs').update(payload).eq('id', id) : await sb.from('faqs').insert(payload);
    if (r.error) { err.textContent = r.error.message; return; }
    closeFaq(); loadFaqAdmin(); window.JC && window.JC.reloadFaqs(); toast('✓ Pergunta salva!');
  }
  async function delFaq(id) { if (!requireAuth()) return; if (!confirm('Excluir essa pergunta?')) return; await sb.from('faqs').delete().eq('id', id); loadFaqAdmin(); window.JC && window.JC.reloadFaqs(); toast('🗑 Excluída'); }

  /* ---------- PASSOS (Como pedir) ---------- */
  async function loadPassoAdmin() {
    const l = $('a-passo-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    const { data } = await sb.from('passos').select('*').order('ordem');
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhum passo ainda. Clique em "+ Novo passo".</p>'; return; }
    l.innerHTML = data.map((p, i) =>
      '<div class="a-row" data-id="' + p.id + '"><div class="a-thumb">' + (i + 1) + '</div><div class="a-info"><div class="a-name">' + esc(p.titulo) + (p.ativo === false ? '<span class="a-pill off">oculto</span>' : '') + '</div><div class="a-meta">' + esc(p.texto || '') + '</div></div><div class="a-actions"><button class="a-btn-sm" data-a="e">Editar</button><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div></div>'
    ).join('');
    l.querySelectorAll('[data-a="e"]').forEach(b => b.onclick = () => editPasso(b.closest('.a-row').dataset.id));
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = () => delPasso(b.closest('.a-row').dataset.id));
  }
  function editPasso(id) { sb.from('passos').select('*').eq('id', id).single().then(({ data }) => openPassoForm(data)); }
  function openPassoForm(p) {
    $('a-passo-modal').classList.add('open');
    $('a-passo-title').textContent = p ? 'Editar passo' : 'Novo passo';
    $('ps-id').value = p && p.id || '';
    $('ps-titulo').value = p && p.titulo || '';
    $('ps-texto').value = p && p.texto || '';
    $('ps-ordem').value = p && p.ordem || 0;
    $('ps-ativo').checked = !p || p.ativo !== false;
    $('ps-err').textContent = '';
  }
  function closePasso() { $('a-passo-modal').classList.remove('open'); }
  async function savePasso() {
    if (noSb() || !requireAuth()) return;
    const err = $('ps-err'); err.textContent = '';
    const id = $('ps-id').value, titulo = $('ps-titulo').value.trim();
    if (!titulo) { err.textContent = 'O título é obrigatório.'; return; }
    const payload = { titulo, texto: $('ps-texto').value.trim(), ordem: parseInt($('ps-ordem').value) || 0, ativo: $('ps-ativo').checked };
    const r = id ? await sb.from('passos').update(payload).eq('id', id) : await sb.from('passos').insert(payload);
    if (r.error) { err.textContent = r.error.message; return; }
    closePasso(); loadPassoAdmin(); window.JC && window.JC.reloadPassos(); toast('✓ Passo salvo!');
  }
  async function delPasso(id) { if (!requireAuth()) return; if (!confirm('Excluir esse passo?')) return; await sb.from('passos').delete().eq('id', id); loadPassoAdmin(); window.JC && window.JC.reloadPassos(); toast('🗑 Excluído'); }

  /* ---------- AVALIAÇÕES ---------- */
  async function loadAvalAdmin() {
    const l = $('a-aval-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    const { data } = await sb.from('avaliacoes').select('*').order('ordem');
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhuma avaliação ainda. Clique em "+ Nova".</p>'; return; }
    l.innerHTML = data.map(a => {
      const n = Math.max(1, Math.min(5, parseInt(a.estrelas) || 5));
      return '<div class="a-row" data-id="' + a.id + '"><div class="a-thumb">' + (a.foto_url ? '<img src="' + esc(a.foto_url) + '">' : '⭐') + '</div><div class="a-info"><div class="a-name">' + esc(a.autor || 'Cliente') + ' <span style="color:#c8860a;font-size:12px;">' + '★'.repeat(n) + '</span>' + (a.ativo === false ? '<span class="a-pill off">oculta</span>' : '') + '</div><div class="a-meta">' + esc((a.texto || '').slice(0, 64)) + ((a.texto || '').length > 64 ? '…' : '') + '</div></div><div class="a-actions"><button class="a-btn-sm" data-a="e">Editar</button><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div></div>';
    }).join('');
    l.querySelectorAll('[data-a="e"]').forEach(b => b.onclick = () => editAval(b.closest('.a-row').dataset.id));
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = () => delAval(b.closest('.a-row').dataset.id));
  }
  function editAval(id) { sb.from('avaliacoes').select('*').eq('id', id).single().then(({ data }) => openAvalForm(data)); }
  function openAvalForm(a) {
    $('a-aval-modal').classList.add('open');
    $('a-aval-title').textContent = a ? 'Editar avaliação' : 'Nova avaliação';
    $('av-id').value = a && a.id || '';
    $('av-texto').value = a && a.texto || '';
    $('av-autor').value = a && a.autor || '';
    $('av-estrelas').value = a && a.estrelas || 5;
    $('av-ordem').value = a && a.ordem || 0;
    $('av-ativo').checked = !a || a.ativo !== false;
    const pv = $('av-foto-preview');
    if (a && a.foto_url) { pv.src = a.foto_url; pv.style.display = 'block'; } else pv.style.display = 'none';
    $('av-foto').value = ''; $('av-err').textContent = '';
  }
  function closeAval() { $('a-aval-modal').classList.remove('open'); }
  async function saveAval() {
    if (noSb() || !requireAuth()) return;
    const err = $('av-err'); err.textContent = '';
    const id = $('av-id').value, texto = $('av-texto').value.trim();
    if (!texto) { err.textContent = 'O comentário é obrigatório.'; return; }
    const payload = {
      texto, autor: $('av-autor').value.trim() || 'Cliente J Cookies',
      estrelas: parseInt($('av-estrelas').value) || 5,
      ordem: parseInt($('av-ordem').value) || 0, ativo: $('av-ativo').checked
    };
    const b = $('av-save'); b.disabled = true; b.textContent = 'Salvando…';
    const file = $('av-foto').files[0];
    if (file) {
      try {
        const ext = file.name.split('.').pop(), path = 'avaliacao-' + Date.now() + '.' + ext;
        const { error: ue } = await sb.storage.from('fotos-produtos').upload(path, file, { upsert: true });
        if (ue) throw ue;
        payload.foto_url = sb.storage.from('fotos-produtos').getPublicUrl(path).data.publicUrl;
      } catch (e) { err.textContent = 'Erro no upload: ' + e.message; b.disabled = false; b.textContent = 'Salvar'; return; }
    }
    const r = id ? await sb.from('avaliacoes').update(payload).eq('id', id) : await sb.from('avaliacoes').insert(payload);
    b.disabled = false; b.textContent = 'Salvar';
    if (r.error) { err.textContent = r.error.message; return; }
    closeAval(); loadAvalAdmin(); window.JC && window.JC.reloadAvaliacoes(); toast('✓ Avaliação salva!');
  }
  async function delAval(id) { if (!requireAuth()) return; if (!confirm('Excluir essa avaliação?')) return; await sb.from('avaliacoes').delete().eq('id', id); loadAvalAdmin(); window.JC && window.JC.reloadAvaliacoes(); toast('🗑 Excluída'); }

  /* ---------- ESTOQUE DO DIA ---------- */
  async function loadEstoque() {
    const l = $('a-estoque-list'); if (!l) return;
    if (noSb()) { l.innerHTML = ''; return; }
    const { data } = await sb.from('produtos').select('id,nome,estoque,ativo').eq('ativo', true).order('categoria').order('ordem');
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;font-size:12.5px;">Nenhum produto ativo.</p>'; return; }
    l.innerHTML = data.map(p =>
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line-2);" data-eid="' + p.id + '">' +
        '<span style="flex:1;font-size:13.5px;font-weight:600;color:var(--ink);min-width:0;">' + esc(p.nome) + '</span>' +
        '<input type="number" min="0" data-estoque inputmode="numeric" placeholder="∞" value="' + ((p.estoque === null || p.estoque === undefined) ? '' : p.estoque) + '" style="width:78px;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-size:14px;text-align:center;">' +
      '</div>'
    ).join('');
  }
  async function saveEstoque() {
    if (noSb() || !requireAuth()) return;
    const b = $('a-estoque-save'); b.disabled = true; b.textContent = 'Salvando…';
    const rows = $('a-estoque-list').querySelectorAll('[data-eid]');
    try {
      for (const r of rows) {
        const id = r.dataset.eid;
        const v = r.querySelector('[data-estoque]').value;
        const estoque = v === '' ? null : Math.max(0, parseInt(v) || 0);
        await sb.from('produtos').update({ estoque }).eq('id', id);
      }
      window.JC && window.JC.reloadProducts();
      loadProdAdmin();
      toast('✓ Estoque do dia salvo!');
    } catch (e) { alert(e.message); }
    b.disabled = false; b.textContent = 'Salvar estoque do dia';
  }

  /* ---------- MENSAGENS DO WHATSAPP ---------- */
  const MSG_FIELDS = { 'm-abertura': 'msg_pedido_abertura', 'm-fim': 'msg_pedido_fim', 'm-preparando': 'msg_preparando', 'm-pronto': 'msg_pronto' };
  async function loadMensagens() {
    if (noSb()) return;
    const { data } = await sb.from('configuracoes').select('msg_pedido_abertura,msg_pedido_fim,msg_preparando,msg_pronto').eq('id', 1).single();
    if (!data) return;
    Object.keys(MSG_FIELDS).forEach(elId => { const el = $(elId); if (el) el.value = data[MSG_FIELDS[elId]] || ''; });
  }
  async function saveMensagens() {
    if (noSb() || !requireAuth()) return;
    const err = $('m-err'); err.textContent = '';
    const payload = {};
    Object.keys(MSG_FIELDS).forEach(elId => { const el = $(elId); if (el) payload[MSG_FIELDS[elId]] = el.value; });
    const b = $('m-save'); b.disabled = true; b.textContent = 'Salvando…';
    const { error } = await sb.from('configuracoes').update(payload).eq('id', 1);
    b.disabled = false; b.textContent = 'Salvar mensagens';
    if (error) { err.textContent = error.message; return; }
    window.JC && window.JC.reloadConfig(); toast('✓ Mensagens salvas!');
  }

  /* ---------- CUPONS ---------- */
  async function loadCupomAdmin() {
    const l = $('a-cupom-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    const { data, error } = await sb.from('cupons').select('*').order('created_at', { ascending: false });
    if (error) { l.innerHTML = '<p style="color:#b23b22;">' + esc(error.message) + '</p>'; return; }
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhum cupom ainda. Clique em "+ Novo".</p>'; return; }
    const hoje = new Date().toISOString().slice(0, 10);
    l.innerHTML = data.map(c => {
      const esgotado = c.limite_usos != null && c.usos >= c.limite_usos;
      const expirado = c.validade && c.validade < hoje;
      const usoTxt = c.usos + (c.limite_usos != null ? ' / ' + c.limite_usos : '') + ' uso' + (c.usos === 1 ? '' : 's');
      let extra = [];
      if (c.valor_minimo != null) extra.push('mín. ' + brl(c.valor_minimo));
      if (c.validade) extra.push('val. ' + c.validade.split('-').reverse().join('/'));
      return '<div class="a-row" data-id="' + c.id + '"><div class="a-thumb" style="font-size:15px;font-weight:800;color:var(--accent-ink);background:var(--accent-soft);">' + c.desconto + '%</div>' +
        '<div class="a-info"><div class="a-name">' + esc(c.codigo) +
          (c.ativo === false ? '<span class="a-pill off">inativo</span>' : '') +
          (esgotado ? '<span class="a-pill sold">esgotado</span>' : '') +
          (expirado ? '<span class="a-pill sold">expirado</span>' : '') +
        '</div><div class="a-meta">' + usoTxt + (extra.length ? ' · ' + extra.join(' · ') : '') + '</div></div>' +
        '<div class="a-actions"><button class="a-btn-sm" data-a="e">Editar</button><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div></div>';
    }).join('');
    l.querySelectorAll('[data-a="e"]').forEach(b => b.onclick = () => editCupom(b.closest('.a-row').dataset.id));
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = () => delCupom(b.closest('.a-row').dataset.id));
  }
  function editCupom(id) { sb.from('cupons').select('*').eq('id', id).single().then(({ data }) => openCupomForm(data)); }
  function openCupomForm(c) {
    $('a-cupom-modal').classList.add('open');
    $('a-cupom-title').textContent = c ? 'Editar cupom' : 'Novo cupom';
    $('cp-id').value = c && c.id || '';
    $('cp-codigo').value = c && c.codigo || '';
    $('cp-desconto').value = c && c.desconto || '';
    $('cp-limite').value = (c && c.limite_usos != null) ? c.limite_usos : '';
    $('cp-minimo').value = (c && c.valor_minimo != null) ? c.valor_minimo : '';
    $('cp-validade').value = c && c.validade || '';
    $('cp-ativo').checked = !c || c.ativo !== false;
    $('cp-err').textContent = '';
  }
  function closeCupom() { $('a-cupom-modal').classList.remove('open'); }
  async function saveCupom() {
    if (noSb() || !requireAuth()) return;
    const err = $('cp-err'); err.textContent = '';
    const id = $('cp-id').value;
    const codigo = $('cp-codigo').value.trim().toUpperCase();
    const desconto = parseInt($('cp-desconto').value);
    if (!codigo) { err.textContent = 'Informe o código do cupom.'; return; }
    if (isNaN(desconto) || desconto < 1 || desconto > 100) { err.textContent = 'Desconto deve ser entre 1 e 100%.'; return; }
    const payload = {
      codigo, desconto,
      limite_usos: $('cp-limite').value === '' ? null : Math.max(1, parseInt($('cp-limite').value) || 1),
      valor_minimo: $('cp-minimo').value === '' ? null : Math.max(0, parseFloat($('cp-minimo').value) || 0),
      validade: $('cp-validade').value || null,
      ativo: $('cp-ativo').checked
    };
    const b = $('cp-save'); b.disabled = true; b.textContent = 'Salvando…';
    const r = id ? await sb.from('cupons').update(payload).eq('id', id) : await sb.from('cupons').insert(payload);
    b.disabled = false; b.textContent = 'Salvar';
    if (r.error) { err.textContent = /duplicate|unique/i.test(r.error.message) ? 'Já existe um cupom com esse código.' : r.error.message; return; }
    closeCupom(); loadCupomAdmin(); toast('✓ Cupom salvo!');
  }
  async function delCupom(id) { if (!requireAuth()) return; if (!confirm('Excluir esse cupom?')) return; await sb.from('cupons').delete().eq('id', id); loadCupomAdmin(); toast('🗑 Cupom excluído'); }

  /* ---------- TEXTOS & ABAS ---------- */
  const TEXT_FIELDS = ['label_destaques', 'label_cardapio', 'label_especiais', 'label_avaliacoes', 'label_info', 'nome_loja', 'tagline', 'aviso_texto', 'como_titulo'];
  async function loadTextos() {
    if (noSb()) return;
    const { data } = await sb.from('configuracoes').select('*').eq('id', 1).single();
    if (!data) return;
    TEXT_FIELDS.forEach(k => { const el = $('t-' + k); if (el) el.value = data[k] || ''; });
  }
  async function saveTextos() {
    if (noSb() || !requireAuth()) return;
    const err = $('t-err'); err.textContent = '';
    const payload = {};
    TEXT_FIELDS.forEach(k => { const el = $('t-' + k); if (el) payload[k] = el.value.trim(); });
    const b = $('t-save'); b.disabled = true; b.textContent = 'Salvando…';
    const { error } = await sb.from('configuracoes').update(payload).eq('id', 1);
    b.disabled = false; b.textContent = 'Salvar abas & textos';
    if (error) { err.textContent = error.message; return; }
    window.JC && window.JC.reloadConfig(); toast('✓ Textos salvos!');
  }

  /* ---------- LOJA / CONFIG ---------- */
  async function uploadImg(file, prefix) {
    const ext = file.name.split('.').pop();
    const path = prefix + '-' + Date.now() + '.' + ext;
    const { error } = await sb.storage.from('fotos-produtos').upload(path, file, { upsert: true });
    if (error) throw error;
    return sb.storage.from('fotos-produtos').getPublicUrl(path).data.publicUrl;
  }
  function setPrev(id, url) { const el = $(id); if (url) { el.src = url; el.style.display = 'block'; } else el.style.display = 'none'; }
  async function loadConfigAdmin() {
    if (noSb()) return;
    const { data } = await sb.from('configuracoes').select('*').eq('id', 1).single();
    if (!data) return;
    $('c-loja').checked = data.loja_aberta !== false;
    $('c-msg-aberta').value = data.mensagem_aberta || '';
    $('c-msg-fechada').value = data.mensagem_fechada || '';
    $('c-pag_pix').checked = data.pag_pix !== false;
    $('c-pag_dinheiro').checked = data.pag_dinheiro !== false;
    $('c-pag_cartao').checked = data.pag_cartao !== false;
    $('c-pag_link').checked = data.pag_link !== false;
    $('c-pix').value = data.chave_pix || '';
    $('c-pix-nome').value = data.nome_pix || '';
    $('c-wpp').value = data.whatsapp || '';
    $('c-tempo').value = data.tempo_preparo || '';
    setPrev('c-hero-prev', data.hero_foto_url);
    setPrev('c-logo-prev', data.logo_url);
    $('c-hero').value = ''; $('c-logo').value = '';
    updateLojaLabel();
  }
  function updateLojaLabel() {
    const on = $('c-loja').checked, l = $('c-loja-label');
    l.textContent = on ? '🟢 Loja aberta — recebendo pedidos' : '🔴 Loja fechada — não recebendo';
    l.style.color = on ? '#176b3c' : '#9a3018';
  }
  async function saveConfig() {
    if (noSb() || !requireAuth()) return;
    const b = $('c-save'); b.disabled = true; b.textContent = 'Salvando…';
    const payload = {
      loja_aberta: $('c-loja').checked,
      mensagem_aberta: $('c-msg-aberta').value.trim(),
      mensagem_fechada: $('c-msg-fechada').value.trim(),
      pag_pix: $('c-pag_pix').checked, pag_dinheiro: $('c-pag_dinheiro').checked,
      pag_cartao: $('c-pag_cartao').checked, pag_link: $('c-pag_link').checked,
      chave_pix: $('c-pix').value.trim(), nome_pix: $('c-pix-nome').value.trim(),
      whatsapp: $('c-wpp').value.trim().replace(/\D/g, ''), tempo_preparo: $('c-tempo').value.trim()
    };
    try {
      const heroFile = $('c-hero').files[0];
      if (heroFile) payload.hero_foto_url = await uploadImg(heroFile, 'capa');
      const logoFile = $('c-logo').files[0];
      if (logoFile) payload.logo_url = await uploadImg(logoFile, 'logo');
    } catch (e) { b.disabled = false; b.textContent = 'Salvar configurações'; alert('Erro no upload da imagem: ' + e.message); return; }
    const { error } = await sb.from('configuracoes').update(payload).eq('id', 1);
    b.disabled = false; b.textContent = 'Salvar configurações';
    if (error) { alert(error.message); return; }
    window.JC && window.JC.reloadConfig(); loadConfigAdmin(); toast('✓ Configurações salvas!');
  }

  /* ---------- PEDIDOS ---------- */
  let pedCache = {};
  const STATUS = ['novo', 'preparando', 'pronto', 'entregue', 'cancelado'];
  const STATUS_LABEL = { novo: 'Novo', preparando: 'Preparando', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' };
  function waPhone(tel) { let d = String(tel || '').replace(/\D/g, ''); if (!d) return ''; if (d.length <= 11) d = '55' + d; return d; }
  function cfg() { return (window.JC && window.JC.state && window.JC.state.config) || {}; }

  function msgPreparando(p) {
    return fillMsg(cfg().msg_preparando || 'Olá, {nome}! Recebemos seu pedido na {loja} e já estamos preparando. Avisaremos quando estiver pronto!', p);
  }
  function msgPronto(p) {
    const txt = fillMsg(cfg().msg_pronto || 'Olá, {nome}! Seu pedido na {loja} está PRONTO!', p);
    // total é sempre adicionado automaticamente (fixo)
    return txt + '\n\nTotal do pedido: ' + brl(p.total);
  }
  function fillMsg(tpl, p) {
    return String(tpl)
      .replace(/\{loja\}/g, cfg().nome_loja || 'J Cookies')
      .replace(/\{nome\}/g, p.cliente_nome || '')
      .replace(/\{total\}/g, brl(p.total))
      .replace(/\{telefone\}/g, p.telefone || '');
  }
  async function notifyPedido(id, kind) {
    const p = pedCache[id]; if (!p) return;
    const phone = waPhone(p.telefone);
    if (!phone) { alert('Esse pedido não tem telefone salvo (provavelmente é um pedido antigo). Não dá para enviar a mensagem automática.'); return; }
    const novoStatus = kind === 'pronto' ? 'pronto' : 'preparando';
    const msg = kind === 'pronto' ? msgPronto(p) : msgPreparando(p);
    const msgLimpa = (window.JClimpar ? window.JClimpar(msg) : msg);
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msgLimpa), '_blank');
    if (session) {
      try { await sb.from('pedidos').update({ status: novoStatus }).eq('id', id); p.status = novoStatus; toast('✓ WhatsApp aberto · status: ' + STATUS_LABEL[novoStatus]); loadPedidos(); }
      catch (e) {}
    } else { toast('📲 WhatsApp aberto'); }
  }

  async function loadPedidos() {
    const l = $('a-ped-list'); l.innerHTML = '<p style="color:#8a7259;">Carregando…</p>';
    if (noSb()) { l.innerHTML = ''; return; }
    if (!session) { l.innerHTML = '<p style="color:#8a7259;">Faça login para ver os pedidos recebidos. 🔒</p>'; return; }
    const { data, error } = await sb.from('pedidos').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) { l.innerHTML = '<p style="color:#b23b22;">' + esc(error.message) + '</p>'; return; }
    if (!data || !data.length) { l.innerHTML = '<p style="color:#8a7259;">Nenhum pedido ainda.</p>'; return; }
    pedCache = {}; data.forEach(p => pedCache[p.id] = p);
    const sc = { novo: '#27598f', preparando: '#9a6f12', confirmado: '#176b3c', pronto: '#176b3c', entregue: '#666', cancelado: '#9a3018' };
    l.innerHTML = data.map(p => {
      const d = new Date(p.created_at);
      const itens = (p.itens || []).map(i => i.qty + 'x ' + i.nome).join(', ');
      const st = sc[p.status] || '#666';
      const fone = p.telefone ? '<a href="https://wa.me/' + waPhone(p.telefone) + '" target="_blank" rel="noopener" style="color:#1c9d54;font-weight:700;text-decoration:none;">📱 ' + esc(p.telefone) + '</a>' : '<span style="color:#b23b22;">sem telefone</span>';
      const recebTxt = p.retirada === 'uber' ? 'Uber/99' : 'Retirada';
      return '<div class="a-row" style="flex-direction:column;align-items:stretch;gap:7px;" data-id="' + p.id + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><strong style="font-size:14px;color:#241208;">' + esc(p.cliente_nome || 'Sem nome') + '</strong><span style="background:' + st + ';color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;">' + esc(STATUS_LABEL[p.status] || p.status) + '</span></div>' +
        '<div class="a-meta">' + d.toLocaleString('pt-BR') + ' · <strong>' + brl(p.total) + '</strong> · ' + esc(recebTxt) + '</div>' +
        '<div style="font-size:12.5px;color:#4a3526;">' + esc(itens) + '</div>' +
        '<div style="font-size:12.5px;">' + fone + '</div>' +
        (p.observacao ? '<div style="font-size:12px;color:#8a7259;font-style:italic;">📝 ' + esc(p.observacao) + '</div>' : '') +
        '<div style="display:flex;gap:8px;margin-top:2px;">' +
          '<button class="a-btn-sm" data-a="prep" style="flex:1;background:#fbf0d8;border-color:#eddcae;color:#9a6f12;">📨 Recebido / Preparando</button>' +
          '<button class="a-btn-sm" data-a="ready" style="flex:1;background:#eaf6ee;border-color:#cce8d6;color:#176b3c;">✅ Pedido pronto</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;"><select data-a="s" style="flex:1;padding:7px;border-radius:8px;border:1px solid #ece2d4;font-size:12.5px;">' +
          STATUS.map(s => '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>').join('') +
        '</select><button class="a-btn-sm a-btn-danger" data-a="d">Excluir</button></div>' +
      '</div>';
    }).join('');
    l.querySelectorAll('[data-a="prep"]').forEach(b => b.onclick = () => notifyPedido(b.closest('.a-row').dataset.id, 'preparando'));
    l.querySelectorAll('[data-a="ready"]').forEach(b => b.onclick = () => notifyPedido(b.closest('.a-row').dataset.id, 'pronto'));
    l.querySelectorAll('[data-a="s"]').forEach(sel => sel.onchange = async () => { if (!requireAuth()) { loadPedidos(); return; } await sb.from('pedidos').update({ status: sel.value }).eq('id', sel.closest('.a-row').dataset.id); toast('✓ Status atualizado'); loadPedidos(); });
    l.querySelectorAll('[data-a="d"]').forEach(b => b.onclick = async () => { if (!requireAuth()) return; if (!confirm('Excluir esse pedido?')) return; await sb.from('pedidos').delete().eq('id', b.closest('.a-row').dataset.id); loadPedidos(); });
  }

  /* ---------- EXPOSE ---------- */
  window.adminAPI = {
    open: openAdmin, close: closeAdmin, login: doLogin, logout: doLogout, tab: loadTab,
    newProd: () => openProdForm(null), closeProdForm, saveProd,
    newFaq: () => openFaqForm(null), closeFaq, saveFaq,
    newPasso: () => openPassoForm(null), closePasso, savePasso,
    newAval: () => openAvalForm(null), closeAval, saveAval,
    newCupom: () => openCupomForm(null), closeCupom, saveCupom,
    saveTextos, saveConfig, updateLojaLabel, saveEstoque, saveMensagens
  };
  window.addEventListener('hashchange', () => { if (location.hash === ADMIN_ROUTE) openAdmin(); });
  if (location.hash === ADMIN_ROUTE) openAdmin();
})();
