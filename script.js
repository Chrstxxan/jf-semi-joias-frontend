// ================================
// CONFIGURAÇÃO GERAL
// ================================
const API = "http://localhost:5000";

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
// CARREGAR PRODUTOS NA HOME
// ================================
const produtosContainer = document.querySelector('.produtos-container');

async function carregarProdutos(categoriaFiltro = null, termoBusca = null) {
  try {
    const resposta = await fetch(`${API}/produtos`);
    const produtos = await resposta.json();
    produtosContainer.innerHTML = '';

    let produtosFiltrados = produtos;

    // filtro de categoria (front-end)
    if (categoriaFiltro) {
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.categoria?.toLowerCase() === categoriaFiltro.toLowerCase()
      );
    }

    // filtro de busca (front-end)
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

    produtosFiltrados.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'produto';
      card.innerHTML = `
        <div class="favorito-btn" onclick="toggleFavorito('${produto._id}', this)">
          <img src="icons/star.svg" alt="Favoritar" />
        </div>
        <img src="${produto.imagens[0]}" alt="${produto.nome}" />
        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
        <button onclick="verDetalhes('${produto._id}')">Ver Detalhes</button>
        <button onclick="comprar('${produto._id}', '${produto.nome}', ${produto.preco}, '${produto.imagens[0]}')">Comprar</button>
      `;
      produtosContainer.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro ao carregar produtos:', erro);
    produtosContainer.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
  }
}

// ================================
// VER DETALHES DO PRODUTO
// ================================
function verDetalhes(idProduto) {
  window.location.href = `produto.html?id=${idProduto}`;
}

// ================================
// ADICIONAR AO CARRINHO
// ================================
function comprar(idProduto, nomeProduto, precoProduto, imagemProduto) {
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({
      title: 'Faça login para comprar',
      text: 'Você precisa estar logado para finalizar a compra.',
      icon: 'warning',
      confirmButtonText: 'Entrar agora',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff6fa7',
    }).then(result => {
      if (result.isConfirmed) window.location.href = 'login.html';
    });
    return;
  }

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  carrinho.push({
    _id: idProduto,     // 👈 salva o ID real do Mongo
    nome: nomeProduto,
    preco: precoProduto,
    imagem: imagemProduto
  });

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarContadorCarrinho();

  Swal.fire({
    title: 'Produto adicionado!',
    html: `
      <img src="${imagemProduto}" alt="${nomeProduto}" style="width:120px;border-radius:10px;margin-bottom:15px;">
      <p><b>${nomeProduto}</b> foi adicionado ao carrinho.</p>
      <p style="font-size: 16px; margin-top: 8px;">R$ ${precoProduto.toFixed(2)}</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Ir para o carrinho',
    cancelButtonText: 'Continuar comprando',
    confirmButtonColor: '#ff6fa7',
    cancelButtonColor: '#aaa',
    background: '#fffafc',
    color: '#333',
  }).then((result) => {
    if (result.isConfirmed) window.location.href = 'carrinho.html';
  });
}


// ================================
// FAVORITAR PRODUTO (HOME)
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
      // Desfavoritar
      await fetch(`${API}/users/favoritos/${idProduto}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      icone.src = "icons/star.svg";
      btn.style.background = "#ffffffff";
    } else {
      // Favoritar
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
// CARREGAR FAVORITOS DO USUÁRIO (HOME)
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
// NAVBAR FUNCIONAL (FILTRO + BUSCA)
// ================================
function inicializarNavbar() {
  document.querySelectorAll(".categoria")?.forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const categoria = link.textContent.trim();

      if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
        await carregarProdutos(categoria);
        await carregarFavoritosUsuario();
      } else {
        window.location.href = `index.html?categoria=${encodeURIComponent(categoria)}`;
      }
    });
  });

  const inputBusca = document.querySelector(".busca input");
  const botaoBuscar = document.getElementById("botao-buscar");

  botaoBuscar?.addEventListener("click", async () => {
    const termo = inputBusca.value.trim();
    if (!termo) return;

    if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
      await carregarProdutos(null, termo);
      await carregarFavoritosUsuario();
    } else {
      window.location.href = `index.html?busca=${encodeURIComponent(termo)}`;
    }
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
});
