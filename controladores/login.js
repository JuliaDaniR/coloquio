const API_BASE = "/julia-rodriguez/proyecto-coloquio/api/";

export async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorElement = document.getElementById("login-error");
  errorElement.classList.add("hidden");

  try {
    const response = await fetch(`${API_BASE}login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, password }),
    });

    const result = await response.json();
    console.log("✅ Login Response:", result);

    if (result.success) {
      // Guardar datos del usuario (CORREGIDO)
      if (result.user_id) localStorage.setItem("userId", result.user_id);
      if (result.rol) localStorage.setItem("userRole", result.rol);
      if (result.token) localStorage.setItem("authToken", result.token);

      const rol = result.rol.toUpperCase();

      setTimeout(() => {
        if (rol === "ADMIN") {
          window.location.href =
            "/julia-rodriguez/proyecto-coloquio/dashboard-admin.html";
        } else if (rol === "SITTER") {
          window.location.href =
            "/julia-rodriguez/proyecto-coloquio/dashboard-sitter.html";
        } else {
          window.location.href =
            "/julia-rodriguez/proyecto-coloquio/dashboard-owner.html";
        }
      }, 100); // ⏳ Le damos tiempo a localStorage
      
    } else {
      errorElement.textContent =
        result.message || "Usuario o contraseña incorrectos.";
      errorElement.classList.remove("hidden");
    }
  } catch (err) {
    console.error("❌ Error en login:", err);
    errorElement.textContent = "❌ Error al conectar con el servidor.";
    errorElement.classList.remove("hidden");
  }
}

export function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
