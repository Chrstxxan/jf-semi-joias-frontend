// ================================
// CONFIGURAÇÃO GERAL
// ================================
const API = "https://jf-semi-joias-backend.onrender.com";

// ================================
// UTIL: Remover acentos (corrige filtro "Anéis" vs "aneis")
// ================================
function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ================================
// ATUALIZA CONTADOR DO CARRINHO
// ================================
function atualizarContadorCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const contador = document.getElementById('contador-carrinho');
  if (contador) contador.textContent = carrinho.length;
}

// ================================
// REDIRECIONA PARA O CARRINHO
// ================================
function irParaCarrinho() {
  window.location.href = 'carrinho.html';
}

// ================================
// UTIL: popup para escolher tamanho
// ================================
function abrirSeletorTamanho(tamanhos) {
  return new Promise((resolve) => {
    let tamanhoEscolhido = null;

    const html = `
      <div style="text-align:center;">
        ${tamanhos
          .map(
            (t) => `<span class="size-chip" data-size="${t}" style="
              display:inline-block;padding:10px 12px;border-radius:10px;
              border:1.5px solid #ff4b8f;color:#ff4b8f;font-weight:600;margin:6px;
              cursor:pointer;user-select:none;
            ">${t}</span>`
          )
          .join("")}
      </div>
    `;

    Swal.fire({
      title: "Escolha o tamanho",
      html,
      showConfirmButton: false,
      showCloseButton: true,
      background: "#fffafc",
      color: "#333",
      width: 480,
      didOpen: () => {
        document.querySelectorAll(".size-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            if (tamanhoEscolhido) return; // evita múltiplos cliques
            tamanhoEscolhido = chip.getAttribute("data-size");

            // feedback visual instantâneo
            document.querySelectorAll(".size-chip").forEach(c => {
              c.style.background = "#fff";
              c.style.color = "#ff4b8f";
            });
            chip.style.background = "#ff4b8f";
            chip.style.color = "#fff";

            // fecha popup e retorna o valor
            setTimeout(() => {
              Swal.close();
              resolve(tamanhoEscolhido);
            }, 150);
          });
        });
      },
      willClose: () => {
        // se o usuário fechar o popup sem escolher, retorna null
        if (!tamanhoEscolhido) resolve(null);
      },
    });
  });
}


// ================================
// CARREGAR PRODUTOS NA HOME
// ================================
const produtosContainer = document.querySelector('.produtos-container');

async function carregarProdutos(categoriaFiltro = null, termoBusca = null) {
  produtosContainer.innerHTML = '<p>Carregando produtos...</p>';
  
  try {
    const resposta = await fetch(`${API}/produtos`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    
    const produtos = await resposta.json();
    produtosContainer.innerHTML = '';

    let produtosFiltrados = produtos;

    // 🔍 Filtro de categoria (agora ignora acentos)
    if (categoriaFiltro) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        removerAcentos(p.categoria)?.toLowerCase() === removerAcentos(categoriaFiltro)?.toLowerCase()
      );
    }

    // 🔍 Filtro de busca
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.nome.toLowerCase().includes(termo)
      );
    }

    if (produtosFiltrados.length === 0) {
      produtosContainer.innerHTML = '<p>Nenhum produto encontrado.</p>';
      return;
    }

    // 🛍️ Renderiza produtos
    produtosFiltrados.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'produto';
      const primeiraImagem = (produto.imagens && produto.imagens[0]) ? produto.imagens[0] : 'icons/logo.png';

      card.innerHTML = `
        <div class="favorito-btn" onclick="toggleFavorito('${produto._id}', this)">
          <img src="icons/star.svg" alt="Favoritar" />
        </div>
        <img src="${primeiraImagem}" alt="${produto.nome}" />
        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${Number(produto.preco || 0).toFixed(2)}</p>
        <button onclick="verDetalhes('${produto._id}')">Ver Detalhes</button>
        <button onclick="comprar('${produto._id}', '${produto.nome.replace(/'/g, "\\'")}', ${Number(produto.preco || 0)}, '${primeiraImagem.replace(/'/g, "\\'")}')">Comprar</button>
      `;
      produtosContainer.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro ao carregar produtos:', erro);
    produtosContainer.innerHTML = `
      <div style="text-align:center; padding:30px;">
        <p>💎 Estamos iniciando nossos servidores, isso pode levar alguns segundos...</p>
        <p style="font-size:14px;color:#777;">Se o problema persistir, atualize a página ou tente novamente em instantes.</p>
        <button onclick="window.location.reload()" style="margin-top:10px; background:#ff6fa7; color:#fff; border:none; border-radius:6px; padding:8px 14px; cursor:pointer;">
          Recarregar
        </button>
      </div>
    `;
  }
}

// ================================
// VER DETALHES DO PRODUTO
// ================================
function verDetalhes(idProduto) {
  window.location.href = `produto.html?id=${idProduto}`;
}

// ================================
// ADICIONAR AO CARRINHO (HOME)
// ================================
async function comprar(idProduto, nomeProduto, precoProduto, imagemProduto) {
  const token = localStorage.getItem('token');
  if (!token) {
    const go = await Swal.fire({
      title: 'Faça login para comprar',
      text: 'Você precisa estar logado para finalizar a compra.',
      icon: 'warning',
      confirmButtonText: 'Entrar agora',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff6fa7',
    });
    if (go.isConfirmed) window.location.href = 'login.html';
    return;
  }

  try {
    console.log("🛍️ Iniciando fluxo de compra...");
    const resp = await fetch(`${API}/produtos/${idProduto}`);
    const produto = await resp.json();
    console.log("📦 Produto retornado:", produto);

    let tamanho = null;
    // 🔧 Corrige comparação ignorando acentos
    if (removerAcentos(produto?.categoria || "").toLowerCase() === "aneis") {
      console.log("💍 Produto é um anel — abrindo seletor de tamanho...");
      const tamanhos = Array.isArray(produto.tamanhosDisponiveis)
        ? produto.tamanhosDisponiveis
        : [];

      if (!tamanhos.length) {
        await Swal.fire({
          icon: "warning",
          title: "Este anel está sem tamanhos cadastrados.",
          confirmButtonColor: "#ff6fa7",
        });
        console.warn("⚠️ Anel sem tamanhos disponíveis!");
        return;
      }

      tamanho = await abrirSeletorTamanho(tamanhos);
      if (!tamanho) {
        console.log("🛑 Usuário cancelou a seleção de tamanho.");
        return; // cancelado
      }

      console.log("✅ Tamanho escolhido:", tamanho);
    } else {
      console.log("🧿 Produto não é anel — seguindo fluxo normal.");
    }

    // 💾 Adiciona ao carrinho
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.push({
      _id: idProduto,
      nome: nomeProduto,
      preco: precoProduto,
      imagem: imagemProduto,
      quantidade: 1,
      tamanho,
    });

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
    console.log("🛒 Produto salvo no carrinho:", carrinho);

    await Swal.fire({
      title: 'Produto adicionado!',
      html: `
        <img src="${imagemProduto}" alt="${nomeProduto}" style="width:120px;border-radius:10px;margin-bottom:15px;">
        <p><b>${nomeProduto}</b> foi adicionado ao carrinho.</p>
        ${tamanho ? `<p>Tamanho: <b>${tamanho}</b></p>` : ""}
        <p style="font-size: 16px; margin-top: 8px;">R$ ${Number(precoProduto || 0).toFixed(2)}</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ir para o carrinho',
      cancelButtonText: 'Continuar comprando',
      confirmButtonColor: '#ff6fa7',
      cancelButtonColor: '#aaa',
      background: '#fffafc',
      color: '#333',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("➡️ Indo para o carrinho...");
        window.location.href = 'carrinho.html';
      }
    });
  } catch (e) {
    console.error("💥 Erro no fluxo de compra:", e);
    Swal.fire({
      icon: "error",
      title: "Erro ao adicionar ao carrinho",
      confirmButtonColor: "#ff6fa7",
    });
  }
}

// ================================
// FAVORITAR PRODUTO
// ================================
async function toggleFavorito(idProduto, btn) {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "Faça login para favoritar",
      confirmButtonColor: "#ff6fa7",
    }).then(() => (window.location.href = "login.html"));
    return;
  }

  const icone = btn.querySelector("img");
  const ativo = icone.src.includes("star-fill");

  try {
    if (ativo) {
      await fetch(`${API}/users/favoritos/${idProduto}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      icone.src = "icons/star.svg";
      btn.style.background = "#fff";
    } else {
      await fetch(`${API}/users/favoritos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ produtoId: idProduto }),
      });
      icone.src = "icons/star-fill.svg";
      btn.style.background = "#ff6fa7";
    }
  } catch (err) {
    console.error("Erro ao favoritar:", err);
  }
}

// ================================
// CARREGAR FAVORITOS DO USUÁRIO
// ================================
async function carregarFavoritosUsuario() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const resp = await fetch(`${API}/users/favoritos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const favoritos = await resp.json();

    document.querySelectorAll(".favorito-btn").forEach((btn) => {
      const id = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
      const icone = btn.querySelector("img");
      const ativo = favoritos.some((f) => f._id === id);

      if (ativo) {
        icone.src = "icons/star-fill.svg";
        btn.style.background = "#ff6fa7";
      } else {
        icone.src = "icons/star.svg";
        btn.style.background = "#fff";
      }
    });
  } catch (err) {
    console.error("Erro ao carregar favoritos:", err);
  }
}

// ================================
// FUNCIONALIDADE DAS BOLHAS
// ================================
function inicializarBolhas() {
  document.getElementById('botao-login')?.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (token) {
      Swal.fire({
        icon: 'info',
        title: 'Você já está logado',
        text: 'Quer sair da conta?',
        showCancelButton: true,
        confirmButtonText: 'Sair',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6fa7',
      }).then((res) => {
        if (res.isConfirmed) {
          localStorage.removeItem('token');
          Swal.fire('Deslogado com sucesso', '', 'success');
        }
      });
    } else {
      window.location.href = 'login.html';
    }
  });

  document.getElementById('botao-pedidos')?.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Faça login primeiro',
        confirmButtonText: 'Entrar',
        confirmButtonColor: '#ff6fa7',
      }).then(() => window.location.href = 'login.html');
    } else {
      window.location.href = 'meus-pedidos.html';
    }
  });

  document.getElementById('botao-favoritos')?.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Faça login para ver seus favoritos',
        confirmButtonColor: '#ff6fa7',
      }).then(() => window.location.href = 'login.html');
    } else {
      window.location.href = 'favoritos.html';
    }
  });
}

// ================================
// ✅ VERIFICAR STATUS REAL PÓS-PAGAMENTO (3 estados)
// ================================
async function verificarStatusPedido() {
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("pagamento");
  if (!status) return;

  const token = localStorage.getItem("token");

  if (status === "failure") {
    Swal.fire("❌ Pagamento não aprovado", "Seu pagamento foi recusado ou cancelado.", "error");
    return;
  }

  if (status === "success" || status === "pending") {
    try {
      const resp = await fetch(`${API}/orders/ultimo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = await resp.json();

      if (order.statusPagamento === "pago") {
        Swal.fire("✅ Pagamento aprovado!", "Seu pedido foi confirmado com sucesso!", "success");
      } else if (order.statusPagamento === "pendente") {
        Swal.fire("⏳ Pagamento em análise", "Estamos aguardando a confirmação do Mercado Pago.", "info");
      } else if (order.statusPagamento === "rejeitado") {
        Swal.fire("❌ Pagamento rejeitado", "O Mercado Pago não aprovou a transação.", "error");
      } else {
        Swal.fire("ℹ️ Retornando do pagamento", "O status será atualizado em breve.", "info");
      }
    } catch {
      Swal.fire("ℹ️ Retornando do pagamento", "O status será atualizado em breve.", "info");
    }
  }
}

// ================================
// NAVBAR FUNCIONAL (FILTRO + BUSCA)
// ================================
function inicializarNavbar() {
  const categorias = document.querySelectorAll(".categoria");
  const inputBusca = document.querySelector(".busca input");
  const botaoBuscar = document.getElementById("botao-buscar");

  categorias.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const categoria = link.textContent.trim();

      // Se clicar em "Início", carrega todos os produtos
      if (link.classList.contains("inicio")) {
        categorias.forEach(l => l.classList.remove("ativo"));
        link.classList.add("ativo");
        await carregarProdutos();
        await carregarFavoritosUsuario();
        return;
      }

      categorias.forEach(l => l.classList.remove("ativo"));
      link.classList.add("ativo");
      await carregarProdutos(categoria);
      await carregarFavoritosUsuario();
    });
  });

  botaoBuscar?.addEventListener("click", async () => {
    const termo = inputBusca.value.trim();
    if (!termo) return;
    await carregarProdutos(null, termo);
    await carregarFavoritosUsuario();
  });
}

// ================================
// INICIALIZAÇÃO GERAL
// ================================
window.addEventListener("DOMContentLoaded", async () => {
  atualizarContadorCarrinho();
  inicializarBolhas();
  inicializarNavbar();

  const params = new URLSearchParams(window.location.search);
  const categoria = params.get("categoria");
  const busca = params.get("busca");

  if (produtosContainer) {
    await carregarProdutos(categoria, busca);
    await carregarFavoritosUsuario();
  }

  // 🧠 Verifica status de pagamento na volta do checkout
  await verificarStatusPedido();
});
