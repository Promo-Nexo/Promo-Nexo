// Config: nome do arquivo JSON (mesma pasta)
const PRODUCTS_JSON = 'products.json';

// Util: formata preço "R$ 12,90" -> número (12.90)
function parsePriceBR(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,\.]/g,'').replace(/,/g,'.');
  return parseFloat(cleaned) || 0;
}

// renderização de um card (DOM)
function createCard(product) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <a class="card-img-wrap" href="${product.link}" target="_blank" rel="noopener noreferrer nofollow" title="${escapeHTML(product.nome)}">
      <img src="${product.imagem}" alt="${escapeHTML(product.nome)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=imagem'">
    </a>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(product.nome)}</h3>
      <p class="card-price">${escapeHTML(product.preco)}</p>
      <div class="card-actions">
        <a class="btn btn-primary" href="${product.link}" target="_blank" rel="noopener noreferrer nofollow">Ver oferta</a>
        <button class="btn btn-ghost btn-copy" data-link="${product.link}">Copiar link</button>
      </div>
    </div>
  `;
  return card;
}

// escape simples para injetar texto
function escapeHTML(str='') {
  return String(str).replace(/[&<>"']/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]);
  });
}

// INICIALIZAÇÃO DO MENU SANDWICH - MOVIDA PARA O INÍCIO
function setupMenu() {
  const btn = document.getElementById("toggle-nav");
  const menu = document.getElementById("nav-list");
  
  if (btn && menu) {
    btn.addEventListener("click", () => {
      menu.classList.toggle("active");
      btn.classList.toggle("active"); // opcional: estilo no botão também
    });
    
    // Fechar menu ao clicar em um link (opcional)
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove("active");
        btn.classList.remove("active");
      });
    });
  }
}

// carregar JSON e inicializar
async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Inicializa o menu ANTES de carregar os produtos
  setupMenu();
  
  try {
    const res = await fetch(PRODUCTS_JSON + '?v=' + Date.now());
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    const products = await res.json();
    window.ALL_PRODUCTS = products;
    setup(products);
  } catch (err) {
    document.getElementById('results-info').textContent = 'Erro ao carregar produtos.';
    console.error(err);
  }
}

// Setup: eventos de busca, categorias, ordenação
function setup(products) {
  const grid = document.getElementById('products-grid');
  const info = document.getElementById('results-info');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const catButtons = Array.from(document.querySelectorAll('.cat-btn'));

  function renderList(list) {
    grid.innerHTML = '';
    if (!list.length) {
      noResults.hidden = false;
      info.textContent = '0 resultados';
      return;
    }
    noResults.hidden = true;
    info.textContent = list.length + ' resultado(s)';
    list.forEach(p => {
      grid.appendChild(createCard(p));
    });
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const activeCatBtn = document.querySelector('.cat-btn.active');
    const cat = activeCatBtn ? activeCatBtn.dataset.cat : 'all';
    let filtered = products.filter(p => {
      const matchesCat = cat === 'all' ? true : (p.categoria && p.categoria.toLowerCase() === cat);
      const matchesQ = q === '' ? true :
        (p.nome && p.nome.toLowerCase().includes(q)) ||
        (p.descricao && p.descricao.toLowerCase().includes(q));
      return matchesCat && matchesQ;
    });

    const sort = sortSelect.value;
    if (sort === 'price-asc') filtered.sort((a,b)=> parsePriceBR(a.preco) - parsePriceBR(b.preco));
    if (sort === 'price-desc') filtered.sort((a,b)=> parsePriceBR(b.preco) - parsePriceBR(a.preco));
    renderList(filtered);
  }

  // eventos
  searchInput.addEventListener('input', debounce(applyFilters, 250));
  sortSelect.addEventListener('change', applyFilters);

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });

  // copiar link
  document.body.addEventListener('click', (ev) => {
    if (ev.target.matches('.btn-copy')) {
      const link = ev.target.dataset.link;
      navigator.clipboard?.writeText(link).then(()=> {
        ev.target.textContent = 'Copiado!';
        setTimeout(()=> ev.target.textContent = 'Copiar link', 1200);
      }).catch(()=> alert('Não foi possível copiar'));
    }
  });

  // inicial
  renderList(products);
}

// pequena função debounce
function debounce(fn, wait=200){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=> fn.apply(this,args), wait);
  };
}

// Loading screen
setTimeout(() => {
  const loadingEl = document.querySelector(".loading");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}, 2000);

// inicia
init();