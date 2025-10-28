// ===== Importaciones =====
import {
  seleccionarUsuarios,
  actualizarUsuarios,
} from "../modelos/usuarios.js";
import { seleccionarCitas } from "../modelos/citas.js";

// ===== Variables Globales =====
let currentAdmin = null;
let currentUser = null;
let allUsers = [];

// ============ UTIL: Crear Avatar por Iniciales o Foto ============
function getAvatarHTML(user) {
  if (user.foto_url) {
    return `<img class="avatar" src="${user.foto_url}" alt="avatar">`;
  }
  const inicial = user.email.charAt(0).toUpperCase();
  return `<div class="avatar circle">${inicial}</div>`;
}

// ===================== PERFIL ADMIN =====================
async function loadMyProfile() {
  const userId = parseInt(localStorage.getItem("userId") ?? 0);
  if (!userId) {
    console.warn("⚠ userId no encontrado");
    return null;
  }

  if (allUsers.length === 0) await loadUsers();

  currentAdmin = allUsers.find((u) => u.id == userId);

  if (!currentAdmin) {
    console.error("❌ Admin no encontrado");
    return null;
  }

  document.getElementById("adminName").textContent =
    currentAdmin.nombre_completo || currentAdmin.email;

  return currentAdmin;
}

document.getElementById("btnMyProfile").addEventListener("click", async () => {
  const user = await loadMyProfile();
  if (!user) return;

  editMyNombre.value = user.nombre_completo || "";
  editMyEmail.value = user.email;
  editMyDireccion.value = user.direccion || "";
  editMyPassword.value = "";

  // ✅ Imagen actual o inicial
  editMyAvatarPreview.src = user.foto_url
    ? user.foto_url
    : "https://via.placeholder.com/120?text=Avatar";

  editMyProfileModal.classList.remove("hidden");
});

function closeEditMyProfile() {
  editMyProfileModal.classList.add("hidden");
}
window.closeEditMyProfile = closeEditMyProfile;

// ===================== Guardar Perfil (con foto) =====================
document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("id", currentAdmin.id);
  formData.append("nombre_completo", editMyNombre.value.trim());
  formData.append("email", editMyEmail.value.trim());
  formData.append("direccion", editMyDireccion.value.trim());
  formData.append("rol", "ADMIN");

  if (editMyPassword.value) {
    formData.append("password", editMyPassword.value);
  }

  if (editMyFoto.files.length > 0) {
    formData.append("foto", editMyFoto.files[0]);
  }

  const data = await actualizarUsuarios(formData);
  alert(data.message);

  closeEditMyProfile();
  loadMyProfile();
});

// ✅ Vista previa instantánea de avatar
document.getElementById("editMyFoto").addEventListener("change", () => {
  const file = editMyFoto.files[0];
  if (file) {
    editMyAvatarPreview.src = URL.createObjectURL(file);
  }
});

// ===================== LISTAR USUARIOS =====================
async function loadUsers() {
  allUsers = await seleccionarUsuarios();
  renderUsers();
  updateKPIs();
}

// ===================== RENDER USUARIOS con Avatar =====================
function renderUsers() {
  const adminId = localStorage.getItem("userId");
  const searchTerm = searchUser.value.toLowerCase();
  const roleFilter = filterRole.value;

  const filtered = allUsers.filter(
    (u) =>
      u.id != adminId &&
      u.email.toLowerCase().includes(searchTerm) &&
      (!roleFilter || u.rol === roleFilter)
  );

  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  filtered.forEach((u) => {
    tbody.innerHTML += `
      <tr>
        <td><div class="avatar-wrapper">${getAvatarHTML(u)}</div></td>
        <td>${u.email}</td>
        <td>${u.rol}</td>
        <td><span class="badge ${u.activo === "1" ? "active" : "inactive"}">${
      u.activo === "1" ? "Activo" : "Inactivo"
    }</span></td>
        <td><button onclick="openProfileModal(${u.id})">Ver</button></td>
      </tr>
    `;
  });
}

searchUser.addEventListener("input", renderUsers);
filterRole.addEventListener("change", renderUsers);

// ===================== MODAL PERFIL USUARIO =====================
function openProfileModal(id) {
  currentUser = allUsers.find((u) => u.id == id);
  const esSitter = currentUser.rol === "SITTER";

  userProfileDetails.innerHTML = `
    ${getAvatarHTML(currentUser)}
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Rol:</strong> ${currentUser.rol}</p>
    ${
      esSitter
        ? `<p><strong>Profesión:</strong> ${
            currentUser.rol_profesional || "No especificado"
          }</p>`
        : ""
    }
    <p><strong>Estado:</strong> ${
      currentUser.activo === "1" ? "✅ Activo" : "⛔ Inactivo"
    }</p>
    ${
      esSitter
        ? `<p><strong>Verificado:</strong> ${
            currentUser.verificado === "1" ? "✅ Sí" : "❌ No"
          }</p>`
        : ""
    }
  `;

  btnVerify.classList.toggle("hidden", !(esSitter && currentUser.verificado !== "1"));
  btnVerify.dataset.id = currentUser.id;

  btnToggleStatus.classList.remove("hidden");
  btnToggleStatus.dataset.id = currentUser.id;
  btnToggleStatus.textContent =
    currentUser.activo === "1" ? "Dar de Baja" : "Dar de Alta";

  userProfileModal.classList.remove("hidden");
}
window.openProfileModal = openProfileModal;

function closeProfileModal() {
  userProfileModal.classList.add("hidden");
}
window.closeProfileModal = closeProfileModal;

// ===================== CAMBIO DE ESTADOS =====================
btnToggleStatus.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  const accion = e.target.textContent.includes("Alta") ? "alta" : "baja";
  const data = await actualizarUsuarios(new URLSearchParams({ accion, id }));
  alert(data.message);
  closeProfileModal();
  loadUsers();
});

// ===================== VERIFICAR PROFESIONAL =====================
btnVerify.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  const data = await actualizarUsuarios(new URLSearchParams({ accion: "verificar", id }));
  alert(data.message);
  closeProfileModal();
  loadUsers();
});

// ===================== CITAS =====================
async function loadAppointments() {
  try {
    const citas = await seleccionarCitas();
    const tbody = document.querySelector("#appointmentsTable tbody");

    tbody.innerHTML = citas
      .map(
        (c) => `
        <tr>
          <td>${c.mascota}</td>
          <td>${c.duenio}</td>
          <td>${c.cuidador}</td>
          <td>${c.fecha}</td>
          <td>${c.estado}</td>
        </tr>`
      )
      .join("");
  } catch {
    console.warn("⚠ No hay citas");
  }
}

// ===================== KPIs =====================
function updateKPIs() {
  kpiTotal.innerText = allUsers.length;
  kpiActivos.innerText = allUsers.filter((u) => u.activo === "1").length;
  kpiInactivos.innerText = allUsers.filter((u) => u.activo === "0").length;
  kpiPendientes.innerText = allUsers.filter(
    (u) => u.rol === "SITTER" && u.verificado === "0"
  ).length;
}

// ===================== MODO OSCURO =====================
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", themeToggle.checked);
  localStorage.setItem("modoOscuro", themeToggle.checked ? "1" : "0");
});

if (localStorage.getItem("modoOscuro") === "1") {
  document.body.classList.add("dark-mode");
  themeToggle.checked = true;
}

// ===================== LOGOUT =====================
document.getElementById("btnLogout").addEventListener("click", () => {
  if (confirm("¿Seguro que querés cerrar sesión?")) {
    logout();
  }
});

window.logout = () => {
  localStorage.clear();
  window.location.href = "index.html";
};

// ===================== INIT =====================
loadMyProfile();
loadUsers();
loadAppointments();
