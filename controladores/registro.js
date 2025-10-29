import { insertarUsuarios } from "../modelos/usuarios.js";

export async function registerUser(event) {
  event.preventDefault();

  const email = document.getElementById("reg-username")?.value.trim();
  const rol = document.querySelector("input[name='role']:checked")?.value;
  const password = document.getElementById("reg-password")?.value;
  const confirmar = document.getElementById("reg-password-confirm")?.value;

  if (!email || !rol || !password || !confirmar) {
    alert("Completa todos los campos.");
    return;
  }

  if (password !== confirmar) {
    alert("Las contraseñas no coinciden");
    return;
  }

  const formData = new FormData();
  formData.append("accion", "insertar");
  formData.append("email", email);
  formData.append("rol", rol);
  formData.append("password", password);

  try {
    const resultado = await insertarUsuarios(formData);
    if (resultado.success) {
      alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
      closeModal("modal-register");
      openModal("modal-login");
    } else {
      alert("Error: " + (resultado.message || "No se pudo registrar."));
    }
  } catch (error) {
    console.error("Error al registrar:", error);
    alert("Hubo un problema al conectar con el servidor.");
  }
}
