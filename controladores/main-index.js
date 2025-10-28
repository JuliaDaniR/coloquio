import { registerUser } from "./registro.js";
import { login } from "./login.js";

// ===== Funciones de modales =====
window.openModal = function (id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
};

window.closeModal = function (id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
};

// ===== Inicialización =====
document.addEventListener("DOMContentLoaded", () => {
  const formRegister = document.getElementById("form-register");
  const formLogin = document.getElementById("form-login");

  if (formRegister) {
    formRegister.addEventListener("submit", registerUser);
  }

  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    });
  }
});
