/* ============================================================
   J Cookies — App do cliente (Supabase + fallback local)
   ============================================================ */
(function () {
  const sb = window.sb;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = n => 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
  const $ = id => document.getElementById(id);

  // ---------- DEFAULTS (fallback if Supabase is empty/unreachable) ----------
  const DEFAULTS = {
    config: {
      loja_aberta: true,
      mensagem_aberta: 'Fornada aberta! É só montar seu pedido. 🍪',
      mensagem_fechada: 'Estamos com a loja fechada no momento. Acompanhe o Instagram para o próximo dia de fornada!',
      nome_loja: 'J Cookies',
      tagline: 'Cookies artesanais — assados na hora, crocantes por fora e macios por dentro.',
      aviso_texto: 'Fornadas aos finais de semana. Confirme dias e horários pelo WhatsApp — o pedido fica pronto ~40 min após a confirmação.',
      como_titulo: 'Como pedir',
      label_destaques: 'Destaques', label_cardapio: 'Cookies', label_especiais: 'Especiais',
      label_avaliacoes: 'Avaliações', label_info: 'Informações',
      chave_pix: 'ad1be2f6-32ab-4975-a44b-90f282b43ebd', nome_pix: 'J Cookies',
      whatsapp: '5527996642938', tempo_preparo: '~40 min',
      pag_pix: true, pag_dinheiro: true, pag_cartao: true, pag_link: true,
      logo_url: null, hero_foto_url: null,
      msg_pedido_abertura: 'Olá! Gostaria de fazer um pedido na {loja}. 🍪',
      msg_pedido_fim: 'Pode confirmar a disponibilidade e o horário, por favor? 😊',
      msg_preparando: 'Olá, {nome}! 🍪\n\nRecebemos seu pedido na {loja} e já estamos preparando tudo com muito carinho. Avisaremos assim que estiver pronto.\n\nQualquer dúvida, é só chamar por aqui. Obrigado pela preferência! 💛',
      msg_pronto: 'Olá, {nome}! 🎉\n\nSeu pedido na {loja} está PRONTO e fresquinho!\n\nObrigado e bom apetite! 🍪💛'
    },
    products: [
      { id: 'd1', nome: 'Cookie Tradicional', descricao: 'Massa artesanal douradinha por fora e macia por dentro. O clássico da casa.', preco: 8, peso: '80g', foto_url: 'assets/cookie-tradicional.png', badge: null, badge_cor: 'cls', categoria: 'cardapio', ordem: 1, ativo: true, disponivel: true, destaque: false },
      { id: 'd2', nome: 'Cookie Ninho', descricao: 'Recheado com creme de Ninho — suave, cremoso e na medida certa de doce.', preco: 10, peso: '100g', foto_url: 'assets/cookie-ninho.png', badge: null, badge_cor: 'rec', categoria: 'cardapio', ordem: 2, ativo: true, disponivel: true, destaque: false },
      { id: 'd3', nome: 'Cookie Nutella', descricao: 'Massa macia com recheio de Nutella e sabor intenso a cada mordida.', preco: 12, peso: '100g', foto_url: 'assets/cookie-nutella.png', badge: 'Mais vendido', badge_cor: 'hot', categoria: 'cardapio', ordem: 3, ativo: true, disponivel: true, destaque: true },
      { id: 'd6', nome: 'Especial do Mês', descricao: 'Sabor especial que muda todo mês — consulte os sabores no WhatsApp.', preco: 15, peso: '100g', foto_url: 'assets/cookie-especial.png', badge: 'Edição limitada', badge_cor: 'lim', categoria: 'cardapio', ordem: 4, ativo: true, disponivel: true, destaque: false },
      { id: 'd4', nome: 'Snack de Mini Cookies', descricao: 'Mini cookies tradicionais, crocantes, perfeitos pra beliscar ou dividir.', preco: 20, peso: '150g', foto_url: 'assets/snack-mini-cookies.jpg', badge: 'Mini cookies', badge_cor: 'mini', categoria: 'especiais', ordem: 1, ativo: true, disponivel: true, destaque: false },
      { id: 'd5', nome: 'Tortinha de Kinder', descricao: 'Sobremesa cremosa e intensa pra quem quer sair do tradicional e caprichar.', preco: 24, peso: '200g', foto_url: 'assets/tortinha-kinder.png', badge: 'Especial', badge_cor: 'esp', categoria: 'especiais', ordem: 2, ativo: true, disponivel: true, destaque: true }
    ],
    faqs: [
      { id: 'f1', pergunta: 'Quando posso pedir?', resposta: 'As fornadas acontecem aos finais de semana. Consulte os dias e horários disponíveis pelo WhatsApp ou Instagram.', ordem: 1, ativo: true },
      { id: 'f2', pergunta: 'Onde retiro meu pedido?', resposta: 'A retirada acontece em Campo Grande, Cariacica. O endereço completo é enviado pelo WhatsApp após a confirmação.', ordem: 2, ativo: true },
      { id: 'f3', pergunta: 'Vocês fazem entrega?', resposta: 'No momento não fazemos entrega própria. Você pode solicitar Uber ou 99 para buscar seu pedido — o transporte é solicitado pelo cliente.', ordem: 3, ativo: true },
      { id: 'f4', pergunta: 'Os cookies são feitos na hora?', resposta: 'Sim. São assados na hora, em pequenas fornadas, para chegarem crocantes por fora e macios por dentro.', ordem: 4, ativo: true }
    ],
    passos: [
      { id: 'p1', titulo: 'Monte o pedido', texto: 'Adicione cookies, snack ou tortinha ao carrinho.', ordem: 1, ativo: true },
      { id: 'p2', titulo: 'Seus dados', texto: 'Informe nome, horário, recebimento e pagamento.', ordem: 2, ativo: true },
      { id: 'p3', titulo: 'Envie no WhatsApp', texto: 'A mensagem já vai pronta para confirmar.', ordem: 3, ativo: true },
      { id: 'p4', titulo: 'Retire fresquinho', texto: 'Pronto ~40 min após a confirmação.', ordem: 4, ativo: true }
    ],
    avaliacoes: [
      { id: 'a1', texto: 'Impecável! O cookie de Nutella é surreal — recheado, macio e com sabor de feito na hora.', autor: '@ericacorrea01', estrelas: 5, foto_url: 'assets/avaliacao-nutella.jpg', ordem: 1, ativo: true },
      { id: 'a2', texto: 'Tortinha de Kinder, simplesmente uma delícia! O melhor do estado.', autor: '@leandragodim', estrelas: 5, foto_url: 'assets/avaliacao-tortinha.jpg', ordem: 2, ativo: true },
      { id: 'a3', texto: 'O melhor. Snack de mini cookies viciante — ótimo pra beliscar aos poucos.', autor: '@ranii_rabeloo', estrelas: 5, foto_url: 'assets/avaliacao-snack.jpg', ordem: 3, ativo: true },
      { id: 'a4', texto: 'Sempre me salva nessas horas.', autor: '@analivia_piumbini', estrelas: 5, foto_url: 'assets/ig-5.jpg', ordem: 4, ativo: true },
      { id: 'a5', texto: 'Bizarro de tão bom.', autor: '@vicderrota', estrelas: 5, foto_url: 'assets/ig-1.jpg', ordem: 5, ativo: true }
    ]
  };

  const state = {
    config: Object.assign({}, DEFAULTS.config),
    products: DEFAULTS.products.slice(),
    faqs: DEFAULTS.faqs.slice(),
    passos: DEFAULTS.passos.slice(),
    avaliacoes: DEFAULTS.avaliacoes.slice(),
    cart: {},        // id -> qty
    receb: '', pag: '',
    cupom: null   // { codigo, desconto }  quando aplicado
  };
  window.JC = { state, esc, brl, reloadConfig, reloadProducts, reloadFaqs, reloadPassos, reloadAvaliacoes };

  const isOpen = () => state.config.loja_aberta !== false;
  // limpa a mensagem do WhatsApp: troca traços longos por hífen e remove
  // emojis/símbolos que aparecem como "?" em alguns aparelhos.
  function limparMsg(s) {
    return String(s == null ? '' : s)
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2026]/g, '...')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\uFE0F\u200D\u20E3]/gu, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/ +\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  window.JClimpar = limparMsg;
  const prod = id => state.products.find(p => String(p.id) === String(id));
  // estoque: null/undefined = ilimitado; número = quantidade do dia
  const hasStock = p => p && p.estoque !== null && p.estoque !== undefined && p.estoque !== '';
  const stockOf = p => hasStock(p) ? Math.max(0, parseInt(p.estoque) || 0) : Infinity;
  const soldOut = p => !p || p.disponivel === false || stockOf(p) <= 0;

  /* ---------------- LOADERS ---------------- */
  async function reloadConfig() {
    if (!sb) { applyConfig(); return; }
    try {
      const { data } = await sb.from('configuracoes').select('*').eq('id', 1).single();
      if (data) {
        // merge: use DB value when present, else keep default
        Object.keys(state.config).forEach(k => { if (data[k] !== undefined && data[k] !== null) state.config[k] = data[k]; });
        ['logo_url', 'hero_foto_url'].forEach(k => { if (data[k]) state.config[k] = data[k]; });
      }
    } catch (e) {}
    applyConfig();
  }
  async function reloadProducts() {
    if (!sb) { renderMenu(); return; }
    try {
      const { data } = await sb.from('produtos').select('*').eq('ativo', true).order('ordem');
      if (data && data.length) state.products = data;
    } catch (e) {}
    renderMenu(); syncAll();
  }
  async function reloadFaqs() {
    if (!sb) { renderFaqs(); return; }
    try {
      const { data } = await sb.from('faqs').select('*').eq('ativo', true).order('ordem');
      if (data && data.length) state.faqs = data;
    } catch (e) {}
    renderFaqs();
  }
  async function reloadPassos() {
    if (!sb) { renderPassos(); return; }
    try {
      const { data } = await sb.from('passos').select('*').eq('ativo', true).order('ordem');
      if (data && data.length) state.passos = data;
    } catch (e) {}
    renderPassos();
  }
  async function reloadAvaliacoes() {
    if (!sb) { renderReviews(); return; }
    try {
      const { data, error } = await sb.from('avaliacoes').select('*').eq('ativo', true).order('ordem');
      // respeita o banco: se vier lista (mesmo vazia), usa ela — assim o que
      // você apaga/desativa no painel some de verdade. Só mantém os exemplos
      // se houve erro de conexão (data === null/undefined).
      if (!error && Array.isArray(data)) state.avaliacoes = data;
    } catch (e) {}
    renderReviews();
  }

  /* ---------------- APPLY CONFIG TO PAGE ---------------- */
  function applyConfig() {
    const c = state.config;
    $('storeName').textContent = c.nome_loja || 'J Cookies';
    $('storeNameBig').textContent = c.nome_loja || 'J Cookies';
    $('footName').textContent = c.nome_loja || 'J Cookies';
    $('tagline').textContent = c.tagline || '';
    $('avisoTxt').textContent = c.aviso_texto || '';
    $('comoTitulo').textContent = c.como_titulo || 'Como pedir';

    // chips + section titles
    setLabel('destaques', c.label_destaques);
    setLabel('cardapio', c.label_cardapio);
    setLabel('especiais', c.label_especiais);
    setLabel('avaliacoes', c.label_avaliacoes);
    setLabel('info', c.label_info);

    // whatsapp + pix + tempo
    document.querySelectorAll('a[data-wpp]').forEach(a => a.href = 'https://wa.me/' + (c.whatsapp || '5527996642938'));
    document.querySelectorAll('[data-pix-key]').forEach(e => e.textContent = c.chave_pix || '—');
    document.querySelectorAll('[data-pix-nome]').forEach(e => { e.textContent = c.nome_pix ? ('Recebedor: ' + c.nome_pix) : ''; e.style.display = c.nome_pix ? 'block' : 'none'; });
    document.querySelectorAll('[data-tempo]').forEach(e => e.textContent = c.tempo_preparo || '~40 min');
    if (c.logo_url) $('logoBox').innerHTML = '<img src="' + esc(c.logo_url) + '" alt="logo">';
    if (c.hero_foto_url) $('coverImg').src = c.hero_foto_url;

    // store status banner + openpill
    const banner = $('statusBanner'), pill = $('openPill');
    if (isOpen()) {
      banner.className = 'status-banner open' + (c.mensagem_aberta ? ' show' : '');
      $('statusMsg').textContent = c.mensagem_aberta || '';
      pill.classList.remove('is-closed'); $('openPillTxt').textContent = 'Aberto agora';
      document.body.classList.remove('loja-fechada');
    } else {
      banner.className = 'status-banner closed show';
      $('statusMsg').textContent = c.mensagem_fechada || 'Loja fechada no momento.';
      pill.classList.add('is-closed'); $('openPillTxt').textContent = 'Fechada';
      document.body.classList.add('loja-fechada');
    }

    renderPayOpts();
    renderMenu(); syncAll();
  }
  function setLabel(key, val) {
    if (!val) return;
    const chip = document.querySelector('[data-chip="' + key + '"]');
    if (chip) chip.textContent = val;
    const title = document.querySelector('[data-title="' + key + '"]');
    if (title) title.textContent = val;
  }

  /* ---------------- PAYMENT OPTIONS ---------------- */
  const PAY = [
    { key: 'pix', flag: 'pag_pix', label: 'Pix' },
    { key: 'dinheiro', flag: 'pag_dinheiro', label: 'Dinheiro' },
    { key: 'cartao', flag: 'pag_cartao', label: 'Cartão' },
    { key: 'link', flag: 'pag_link', label: 'Link' }
  ];
  function renderPayOpts() {
    const wrap = $('payOpts'); if (!wrap) return;
    const enabled = PAY.filter(p => state.config[p.flag] !== false);
    wrap.innerHTML = enabled.map(p => '<button class="opt" id="p-' + p.key + '" onclick="selOpt(\'pag\',\'' + p.key + '\')">' + p.label + '</button>').join('');
    if (state.pag && !enabled.find(p => p.key === state.pag)) { state.pag = ''; $('pixbox').classList.remove('show'); }
  }

  /* ---------------- MENU RENDER ---------------- */
  function media(p, phClass) {
    return p.foto_url ? '<img src="' + esc(p.foto_url) + '" alt="' + esc(p.nome) + '" loading="lazy">' : '<div class="ph">🍪</div>';
  }
  function rowHTML(p) {
    const tagBadge = p.badge ? '<span class="tag ' + (p.badge_cor || 'cls') + '">' + esc(p.badge) + '</span>' : '';
    const sold = soldOut(p);
    const closed = !isOpen();
    const ctlHidden = sold || closed;
    const soldOverlay = sold ? '<span class="sold-badge">Esgotado</span>' : '';
    return '' +
      '<div class="row' + (sold ? ' unavailable' : '') + '" data-pid="' + esc(p.id) + '" onclick="JCopen(\'' + esc(p.id) + '\')">' +
        '<div class="body">' +
          '<div class="name">' + esc(p.nome) + ' ' + tagBadge + (sold ? '<span class="tag sold">Esgotado</span>' : '') + '</div>' +
          '<div class="desc">' + esc(p.descricao || '') + '</div>' +
          '<div class="price-line"><span class="price">' + brl(p.preco) + '</span>' + (p.peso ? '<span class="weight">' + esc(p.peso) + '</span>' : '') + '</div>' +
        '</div>' +
        '<div class="thumb-wrap">' +
          '<div class="thumb">' + media(p) + soldOverlay + '</div>' +
          '<div class="add-ctl' + (ctlHidden ? ' hidden' : '') + '" data-ctl="' + esc(p.id) + '" onclick="event.stopPropagation()">' +
            '<button class="add-btn" onclick="JCinc(\'' + esc(p.id) + '\')" aria-label="Adicionar">+</button>' +
            '<div class="stepper"><button onclick="JCdec(\'' + esc(p.id) + '\')">−</button><span class="n" data-n="' + esc(p.id) + '">0</span><button onclick="JCinc(\'' + esc(p.id) + '\')">+</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  function renderMenu() {
    const act = state.products.filter(p => p.ativo !== false);
    const destaques = act.filter(p => p.destaque);
    const cardapio = act.filter(p => p.categoria === 'cardapio');
    const especiais = act.filter(p => p.categoria === 'especiais');
    fill('destaques', destaques);
    fill('cardapio', cardapio);
    fill('especiais', especiais);
    // hide empty product sections + their chips (Destaques/Especiais may be empty)
    toggleSection('destaques', destaques.length);
    toggleSection('especiais', especiais.length);
  }
  function toggleSection(key, n) {
    const sec = document.getElementById(key);
    const chip = document.querySelector('[data-chip="' + key + '"]');
    const show = n > 0;
    if (sec) sec.style.display = show ? '' : 'none';
    if (chip) chip.style.display = show ? '' : 'none';
  }
  function fill(cat, arr) {
    const el = document.querySelector('[data-list="' + cat + '"]'); if (!el) return;
    if (!arr.length) { el.innerHTML = '<p class="empty-list">Em breve novidades por aqui. 🍪</p>'; return; }
    el.innerHTML = arr.map(rowHTML).join('');
  }

  /* ---------------- HOW + FAQ ---------------- */
  function renderPassos() {
    const g = $('howGrid'); if (!g) return;
    g.innerHTML = state.passos.map((p, i) => '<div class="step"><div class="sn">' + (i + 1) + '</div><h4>' + esc(p.titulo) + '</h4><p>' + esc(p.texto || '') + '</p></div>').join('');
  }
  function renderFaqs() {
    const l = $('faqList'); if (!l) return;
    l.innerHTML = state.faqs.map(f => '<div class="fitem"><button class="fq" onclick="tf(this)">' + esc(f.pergunta) + '<span class="arr">▾</span></button><div class="fa"><p>' + esc(f.resposta) + '</p></div></div>').join('');
  }
  function renderReviews() {
    const l = $('reviewScroll'); if (!l) return;
    const list = state.avaliacoes.filter(a => a.ativo !== false);
    if (!list.length) { l.innerHTML = '<p class="empty-list">Em breve, avaliações por aqui. ⭐</p>'; return; }
    l.innerHTML = list.map(a => {
      const n = Math.max(0, Math.min(5, parseInt(a.estrelas) || 5));
      const stars = '★'.repeat(n) + '☆'.repeat(5 - n);
      const img = a.foto_url ? '<div class="rimg"><img src="' + esc(a.foto_url) + '" alt=""></div>' : '';
      return '<div class="rcard' + (a.foto_url ? '' : ' text-only') + '">' + img +
        '<div class="rb"><div class="rstars">' + stars + '</div><p class="rtext">' + esc(a.texto) + '</p><span class="rauthor">' + esc(a.autor || 'Cliente J Cookies') + '</span></div></div>';
    }).join('');
  }

  /* ---------------- CART ---------------- */
  function guard() {
    if (!isOpen()) { toast('🔒 ' + (state.config.mensagem_fechada ? 'Loja fechada' : 'Loja fechada')); return false; }
    return true;
  }
  function inc(id) {
    if (!guard()) return;
    const p = prod(id); if (soldOut(p)) { toast('Produto esgotado'); return; }
    const atual = state.cart[id] || 0;
    if (atual + 1 > stockOf(p)) { toast('Restam apenas ' + stockOf(p) + ' no estoque de hoje'); return; }
    state.cart[id] = atual + 1;
    toast('🍪 ' + p.nome + ' adicionado');
    syncAll();
  }
  function dec(id) {
    if (!state.cart[id]) return;
    state.cart[id]--; if (state.cart[id] <= 0) delete state.cart[id];
    syncAll();
  }
  function syncAll() {
    document.querySelectorAll('[data-ctl]').forEach(ctl => {
      const id = ctl.dataset.ctl, q = state.cart[id] || 0;
      ctl.classList.toggle('has', q > 0);
      const st = ctl.querySelector('.stepper'); if (st) st.classList.toggle('show', q > 0);
      const n = ctl.querySelector('.n'); if (n) n.textContent = q;
    });
    const entries = Object.entries(state.cart).filter(([id]) => prod(id));
    const count = entries.reduce((s, [id, q]) => s + q, 0);
    const subtotal = entries.reduce((s, [id, q]) => s + Number(prod(id).preco) * q, 0);
    // revalida cupom se o subtotal mudou (pode ter passado a atender mínimo, etc.)
    const desc = cupomDesconto(subtotal);
    const total = Math.max(0, subtotal - desc);
    const bar = $('cartbar');
    bar.classList.toggle('show', count > 0 && isOpen());
    $('cbcount').textContent = count;
    $('cbtotal').textContent = brl(total);
    renderSheet(entries, subtotal, total, desc, count);
  }
  function cupomDesconto(subtotal) {
    if (!state.cupom) return 0;
    return Math.round(subtotal * (state.cupom.desconto / 100) * 100) / 100;
  }
  function renderSheet(entries, subtotal, total, desc, count) {
    const empty = $('empty'), content = $('cartContent');
    if (count === 0) { empty.style.display = 'block'; content.style.display = 'none'; return; }
    empty.style.display = 'none'; content.style.display = 'block';
    $('citems').innerHTML = entries.map(([id, q]) => {
      const p = prod(id);
      return '<div class="citem"><div class="ci-thumb">' + media(p) + '</div><div class="ci-info"><div class="ci-name">' + esc(p.nome) + '</div><div class="ci-meta">' + (p.peso ? esc(p.peso) + ' · ' : '') + brl(p.preco) + '</div><div class="ci-price">' + brl(Number(p.preco) * q) + '</div></div><div class="mini-step"><button onclick="JCdec(\'' + esc(id) + '\')">−</button><span class="n">' + q + '</span><button onclick="JCinc(\'' + esc(id) + '\')">+</button></div></div>';
    }).join('');
    const addable = state.products.filter(p => p.ativo !== false && !soldOut(p) && (state.cart[p.id] || 0) < stockOf(p));
    $('qaList').innerHTML = addable.map(p => '<div class="qa-item"><div class="qi-thumb">' + media(p) + '</div><div class="qi-info"><div class="qi-name">' + esc(p.nome) + '</div><div class="qi-meta">' + (p.peso ? esc(p.peso) + ' · ' : '') + brl(p.preco) + (state.cart[p.id] ? ' · no pedido: ' + state.cart[p.id] : '') + '</div></div><button class="qa-add" onclick="JCinc(\'' + esc(p.id) + '\')">+</button></div>').join('');
    // resumo de valores com cupom
    const subEl = $('sumSubtotal'), descEl = $('sumDesconto');
    if (state.cupom && desc > 0) {
      subEl.style.display = 'flex'; $('subtotalVal').textContent = brl(subtotal);
      descEl.style.display = 'flex';
      $('descLabel').textContent = 'Desconto (' + state.cupom.codigo + ' · ' + state.cupom.desconto + '%)';
      $('descontoVal').textContent = '- ' + brl(desc);
    } else {
      subEl.style.display = 'none'; descEl.style.display = 'none';
    }
    $('totalVal').textContent = brl(total);
  }

  /* ---------------- OPTIONS + CHECKOUT ---------------- */
  function selOpt(group, val) {
    if (group === 'receb') {
      state.receb = val;
      $('r-retirada').classList.toggle('sel', val === 'retirada');
      $('r-uber').classList.toggle('sel', val === 'uber');
      const un = $('uberNote'); if (un) un.classList.toggle('show', val === 'uber');
    } else {
      state.pag = val;
      PAY.forEach(p => { const el = $('p-' + p.key); if (el) el.classList.toggle('sel', p.key === val); });
      $('pixbox').classList.toggle('show', val === 'pix');
    }
  }
  /* ---------------- CUPOM ---------------- */
  async function aplicarCupom() {
    const inp = $('f-cupom'), msg = $('cupomMsg'), row = inp.closest('.cupom-row');
    const codigo = (inp.value || '').trim();
    // se já tem cupom aplicado, o botão vira "remover"
    if (state.cupom) { removerCupom(); return; }
    if (!codigo) { msg.className = 'cupom-msg err'; msg.textContent = 'Digite um código de cupom.'; return; }
    const entries = Object.entries(state.cart).filter(([id]) => prod(id));
    const subtotal = entries.reduce((s, [id, q]) => s + Number(prod(id).preco) * q, 0);
    if (subtotal <= 0) { msg.className = 'cupom-msg err'; msg.textContent = 'Adicione itens antes de usar o cupom.'; return; }
    const btn = $('cupomBtn'); btn.disabled = true; btn.textContent = '...';
    let res = null;
    if (sb) {
      try { const r = await sb.rpc('validar_cupom', { p_codigo: codigo, p_total: subtotal }); res = (r.data && r.data[0]) || null; if (r.error) res = null; }
      catch (e) { res = null; }
    }
    btn.disabled = false; btn.textContent = 'Aplicar';
    if (!res) { msg.className = 'cupom-msg err'; msg.textContent = sb ? 'Não foi possível validar o cupom agora.' : 'Cupons indisponíveis offline.'; return; }
    if (!res.valido) { msg.className = 'cupom-msg err'; msg.textContent = res.motivo || 'Cupom inválido.'; return; }
    state.cupom = { codigo: codigo.toUpperCase(), desconto: res.desconto };
    row.classList.add('applied');
    inp.value = codigo.toUpperCase(); inp.readOnly = true;
    btn.textContent = 'Remover';
    msg.className = 'cupom-msg ok';
    msg.textContent = '✓ Cupom aplicado: ' + res.desconto + '% de desconto!';
    syncAll();
  }
  function removerCupom() {
    state.cupom = null;
    const inp = $('f-cupom'), msg = $('cupomMsg'), row = inp.closest('.cupom-row'), btn = $('cupomBtn');
    inp.readOnly = false; inp.value = ''; row.classList.remove('applied');
    btn.textContent = 'Aplicar'; msg.className = 'cupom-msg'; msg.textContent = '';
    syncAll();
  }

  async function finalizar() {
    if (!isOpen()) { toast('🔒 Loja fechada no momento'); return; }
    const nome = $('f-nome').value.trim(), hor = $('f-horario').value.trim(), obs = $('f-obs').value.trim();
    const tel = $('f-telefone').value.trim();
    const entries = Object.entries(state.cart).filter(([id]) => prod(id));
    if (!entries.length) return toast('⚠️ Adicione pelo menos um produto');
    if (!nome) { toast('⚠️ Informe seu nome'); $('f-nome').focus(); return; }
    if (!hor) { toast('⚠️ Informe o horário desejado'); $('f-horario').focus(); return; }
    if (tel.replace(/\D/g, '').length < 10) { toast('⚠️ Informe um WhatsApp válido com DDD'); $('f-telefone').focus(); return; }
    if (!state.receb) return toast('⚠️ Escolha a forma de recebimento');
    if (!state.pag) return toast('⚠️ Escolha a forma de pagamento');

    const subtotal = entries.reduce((s, [id, q]) => s + Number(prod(id).preco) * q, 0);
    const desc = cupomDesconto(subtotal);
    const total = Math.max(0, subtotal - desc);
    const rl = state.receb === 'retirada' ? 'Retirada em Campo Grande' : 'Uber ou 99 solicitado pelo cliente';
    const pl = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão presencial', link: 'Link de pagamento' }[state.pag];

    // monta a mensagem: ABERTURA (editável) + RESUMO FIXO + ENCERRAMENTO (editável)
    let itensTxt = '';
    entries.forEach(([id, q]) => { const p = prod(id); itensTxt += '- ' + q + 'x ' + p.nome + ' - ' + brl(Number(p.preco) * q) + '\n'; });
    const fillTpl = t => String(t || '')
      .replace(/\{loja\}/g, state.config.nome_loja || 'J Cookies')
      .replace(/\{nome\}/g, nome);

    const abertura = fillTpl(state.config.msg_pedido_abertura || 'Olá! Gostaria de fazer um pedido na {loja}.');
    const fim = fillTpl(state.config.msg_pedido_fim || 'Pode confirmar a disponibilidade e o horário, por favor?');

    // RESUMO FIXO (não editável — garante valor/recebimento/loja sempre corretos)
    let resumo = 'Nome: ' + nome + '\n\nPedido:\n' + itensTxt;
    if (state.cupom && desc > 0) {
      resumo += 'Subtotal: ' + brl(subtotal) + '\n' +
        'Cupom ' + state.cupom.codigo + ' (' + state.cupom.desconto + '%): - ' + brl(desc) + '\n' +
        'Total com desconto: ' + brl(total) + '\n';
    } else {
      resumo += 'Total estimado: ' + brl(total) + '\n';
    }
    resumo += 'Horário desejado: ' + hor + '\n' +
      'Forma de recebimento: ' + rl + '\n' +
      'Forma de pagamento: ' + pl;
    if (state.pag === 'pix') resumo += '\n(Pagamento via Pix pela chave informada na página)';
    if (obs) resumo += '\n\nObservações: ' + obs;

    const m = limparMsg(abertura + '\n\n' + resumo + '\n\n' + fim);
    const waUrl = 'https://wa.me/' + (state.config.whatsapp || '5527996642938') + '?text=' + encodeURIComponent(m);

    // salva o pedido E baixa o estoque em SEGUNDO PLANO (sem travar o mobile)
    if (sb) {
      try {
        sb.from('pedidos').insert({
          cliente_nome: nome,
          telefone: tel.replace(/\D/g, ''),
          itens: entries.map(([id, q]) => { const p = prod(id); return { id: p.id, nome: p.nome, qty: q, preco: Number(p.preco) }; }),
          total, forma_pagamento: state.pag, retirada: state.receb,
          cupom: state.cupom ? state.cupom.codigo : null,
          desconto: state.cupom ? desc : null,
          desconto_pct: state.cupom ? state.cupom.desconto : null,
          observacao: 'Horário: ' + hor + (obs ? ' | ' + obs : '')
        }).then(function () {}, function () {});
        // registra 1 uso do cupom (com trava de limite no banco)
        if (state.cupom) { try { sb.rpc('registrar_uso_cupom', { p_codigo: state.cupom.codigo }).then(function () {}, function () {}); } catch (e) {} }
        // baixa o estoque de cada item (a função ignora produtos sem controle de estoque)
        entries.forEach(([id, q]) => {
          const p = prod(id);
          if (hasStock(p)) { try { sb.rpc('baixar_estoque', { p_id: p.id, p_qtd: q }).then(function () {}, function () {}); } catch (e) {} }
        });
      } catch (e) {}
    }

    // abre o WhatsApp IMEDIATAMENTE (mantém o "gesto do usuário" no celular)
    const win = window.open(waUrl, '_blank');
    if (!win) { window.location.href = waUrl; }
  }

  /* ---------------- PRODUCT DETAIL ---------------- */
  function openProduct(id) {
    const p = prod(id); if (!p) return;
    state.pdId = id;
    const sold = soldOut(p);
    const sheet = $('prodSheet');
    $('pd-img').src = p.foto_url || '';
    $('pd-img').style.display = p.foto_url ? 'block' : 'none';
    $('pd-name').textContent = p.nome;
    $('pd-desc').textContent = p.descricao || '';
    $('pd-price').textContent = brl(p.preco);
    $('pd-weight').textContent = p.peso || '';
    $('pd-weight').style.display = p.peso ? '' : 'none';
    const tags = $('pd-tags');
    tags.innerHTML = (p.badge ? '<span class="tag ' + (p.badge_cor || 'cls') + '">' + esc(p.badge) + '</span>' : '') + (sold ? '<span class="tag sold">Esgotado</span>' : '');
    sheet.classList.toggle('is-sold', sold);
    // quantidade inicial respeitando estoque restante
    const restante = stockOf(p) - (state.cart[id] || 0);
    state.pdMax = restante === Infinity ? 99 : Math.max(0, restante);
    state.pdQ = state.pdMax > 0 ? 1 : 0;
    renderPd();
    $('prodOverlay').classList.add('open');
    sheet.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function renderPd() {
    const p = prod(state.pdId); if (!p) return;
    $('pd-qty').textContent = state.pdQ;
    const total = Number(p.preco) * state.pdQ;
    $('pd-add-total').textContent = '· ' + brl(total);
    const addBtn = $('pd-add');
    if (state.pdMax <= 0) { addBtn.classList.add('disabled'); $('pd-add-label').textContent = 'Sem estoque'; $('pd-add-total').textContent = ''; }
    else { addBtn.classList.remove('disabled'); $('pd-add-label').textContent = 'Adicionar'; }
  }
  function pdQty(delta) {
    const novo = state.pdQ + delta;
    if (novo < 1 || novo > state.pdMax) return;
    state.pdQ = novo; renderPd();
  }
  function pdAdd() {
    const p = prod(state.pdId); if (!p) return;
    if (!isOpen()) { toast('🔒 Loja fechada no momento'); return; }
    if (state.pdMax <= 0 || state.pdQ < 1) { toast('Produto esgotado'); return; }
    state.cart[state.pdId] = (state.cart[state.pdId] || 0) + state.pdQ;
    toast('🍪 ' + state.pdQ + 'x ' + p.nome + ' adicionado');
    closeProduct();
    syncAll();
  }
  function closeProduct() {
    $('prodOverlay').classList.remove('open');
    $('prodSheet').classList.remove('open');
    if (!$('sheet').classList.contains('open')) document.body.classList.remove('no-scroll');
  }
  function ocp(e) { if (e.target.id === 'prodOverlay') closeProduct(); }

  /* ---------------- SHEET / MISC ---------------- */
  function openCart() { if (!isOpen()) { toast('🔒 ' + (state.config.mensagem_fechada || 'Loja fechada')); return; } syncAll(); $('overlay').classList.add('open'); $('sheet').classList.add('open'); document.body.classList.add('no-scroll'); }
  function closeCart() { $('overlay').classList.remove('open'); $('sheet').classList.remove('open'); document.body.classList.remove('no-scroll'); }
  function oc(e) { if (e.target.id === 'overlay') closeCart(); }
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function tf(btn) { const a = btn.nextElementSibling, o = btn.classList.contains('open'); document.querySelectorAll('#faqList .fq').forEach(b => { b.classList.remove('open'); b.nextElementSibling.style.maxHeight = '0'; }); if (!o) { btn.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; } }

  // expose
  window.JCinc = inc; window.JCdec = dec;
  window.openCart = openCart; window.closeCart = closeCart; window.oc = oc;
  window.selOpt = selOpt; window.finalizar = finalizar; window.tf = tf; window.showToast = toast;
  window.aplicarCupom = aplicarCupom; window.removerCupom = removerCupom;
  window.JCopen = openProduct; window.closeProduct = closeProduct; window.ocp = ocp; window.pdQty = pdQty; window.pdAdd = pdAdd;
  window.openPriv = function () { $('privModal').classList.add('open'); };
  window.closePriv = function () { $('privModal').classList.remove('open'); };

  /* ---------------- CHIPS scroll-spy ---------------- */
  const chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  chips.forEach(c => c.addEventListener('click', () => {
    const el = $(c.dataset.target); if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }));
  const cats = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        chips.forEach(c => c.classList.toggle('active', c.dataset.target === id));
        const a = chips.find(c => c.dataset.target === id);
        if (a) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    });
  }, { rootMargin: '-120px 0px -65% 0px', threshold: 0 });
  cats.forEach(c => spy.observe(c));

  /* ---------------- INIT ---------------- */
  // instant paint with defaults
  applyConfig(); renderMenu(); renderFaqs(); renderPassos(); renderReviews(); syncAll();
  // then hydrate from Supabase
  (async function () {
    await reloadConfig();
    await reloadProducts();
    await reloadFaqs();
    await reloadPassos();
    await reloadAvaliacoes();
    if (sb) {
      try {
        sb.channel('jc-pub')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, reloadProducts)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, reloadConfig)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'faqs' }, reloadFaqs)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'passos' }, reloadPassos)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'avaliacoes' }, reloadAvaliacoes)
          .subscribe();
      } catch (e) {}
    }
    if (window.adminAPI && location.hash === (window.JC_ADMIN_ROUTE || '#admin-jcookies-2026')) window.adminAPI.open();
  })();
})();
