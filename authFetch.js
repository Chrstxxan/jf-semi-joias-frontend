window.API = window.API || "https://jf-semi-joias-backend.onrender.com";

async function refreshToken() {
  let token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const res = await fetch(`${window.API}/auth/refresh`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      token = data.token;
      return data.token;
    }
    return null;
  } catch (e) {
    console.error("Erro no refreshToken:", e);
    return null;
  }
}

async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  let token = localStorage.getItem("token");
  if (token) options.headers.Authorization = `Bearer ${token}`;

  let res = await fetch(url, options);

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (!newToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      Swal.fire({
        icon: "warning",
        title: "Sessão expirada",
        text: "Faça login novamente.",
        confirmButtonColor: "#ff6fa7"
    }).then(() => window.location.href = "login.html");

      return null;
    }
    options.headers.Authorization = `Bearer ${newToken}`;
    res = await fetch(url, options);

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      alert("Sessão inválida. Faça login novamente.");
      window.location.href = "/login.html";
      return null;
    }
  }

  return res;
}
