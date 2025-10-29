// ===== Importaciones =====
import {
  seleccionarUsuarios,
  actualizarUsuarios,
} from "../modelos/usuarios.js";

import { seleccionarCitas, actualizarCitas } from "../modelos/citas.js";

import {
  insertarHorarios,
  seleccionarHorarios,
  actualizarHorarios,
  eliminarHorarios,
} from "../modelos/horarios.js";

import { seleccionarResenias } from "../modelos/resenias.js";

// ====== GLOBAL ======
const sitterId = localStorage.getItem("userId");
if (!sitterId) logout();

let currentUser = null;

const sitterAvatar = document.getElementById("sitterAvatar");
const sitterName = document.getElementById("sitterName");
const verifyStatus = document.getElementById("verifyStatus");
const openProfileModalBtn = document.getElementById("openProfileModal");
const profileModal = document.getElementById("profileModal");
const reseniasList = document.getElementById("reseniasList");

// =============================
// ✅ UTIL AVATAR
// =============================
function setAvatar(element, user) {
  if (!element) return; // ✅ Evita error si no existe

  if (user.foto_url) {
    element.style.backgroundImage = `url(${user.foto_url})`;
    element.style.backgroundSize = "cover";
    element.textContent = "";
  } else {
    element.textContent = (user.nombre_completo || "?")[0];
  }
}

// =============================
// ✅ Cargar Perfil Profesional
// =============================
async function loadProfile() {
  const users = await seleccionarUsuarios();
  currentUser = users.find((u) => u.id == sitterId);

  if (!currentUser) return logout();

  sitterName.textContent = currentUser.nombre_completo || currentUser.email;
  setAvatar(sitterAvatar, currentUser);

  verifyStatus.textContent =
    currentUser.verificado == "1" ? "✅ Verificado" : "⏳ En revisión";

  // Pre-cargar modal perfil
  editMyNombre.value = currentUser.nombre_completo || "";
  editMyEmail.value = currentUser.email || "";
  editMyDireccion.value = currentUser.direccion || "";
  editMyDescripcion.value = currentUser.descripcion || "";
  editMyEspecialidad.value = currentUser.rol_profesional || "";

  if (currentUser.foto_url) {
    editMyAvatarPreview.src = currentUser.foto_url;
    editMyAvatarPreview.classList.remove("hidden");
  }
}

// =============================
// ✅ Actualizar Perfil
// =============================
document
  .getElementById("editProfileForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = new FormData();
    datos.append("accion", "actualizar");
    datos.append("id", currentUser.id);
    datos.append("nombre_completo", editMyNombre.value.trim());
    datos.append("email", editMyEmail.value.trim());
    datos.append("direccion", editMyDireccion.value.trim());
    datos.append("rol", "SITTER");
    datos.append("rol_profesional", editMyEspecialidad.value);
    datos.append("descripcion", editMyDescripcion.value.trim());

    if (editMyPassword.value.trim()) {
      datos.append("password", editMyPassword.value.trim());
    }

    const file = editMyFoto.files[0];
    if (file) datos.append("foto", file);

    const res = await actualizarUsuarios(datos);
    alert(res.message || "Perfil actualizado ✅");

    closeProfileModal();
    await loadProfile();
  });

// =============================
// ✅ RESERVAS
// =============================
async function loadAppointments() {
  const citas = await seleccionarCitas({ sitter_id: sitterId });

  const tbody = document.querySelector("#appointmentsTable tbody");
  tbody.innerHTML = "";

  citas.forEach((c) => {
    tbody.innerHTML += `
    <tr>
      <td>${c.nombre_mascota || ""}</td>
      <td>${c.nombre_cliente || ""}</td>
      <td>${c.fecha}</td>
      <td>${c.estado}</td>
      <td>
        ${
          c.estado === "PENDIENTE"
            ? `<button onclick="changeEstado(${c.id}, 'ACEPTADA')">Aceptar ✅</button>`
            : c.estado === "ACEPTADA"
            ? `<button onclick="changeEstado(${c.id}, 'FINALIZADA')">Finalizar ✔</button>`
            : "-"
        }
      </td>
    </tr>`;
  });
}

async function changeEstado(id, estado) {
  await actualizarCitas({ id, estado });
  loadAppointments();
}
window.changeEstado = changeEstado;

// =============================
// ✅ HORARIOS
// =============================
const horariosTable = document.querySelector("#horariosTable tbody");
const btnAddHorario = document.getElementById("btnAddHorario");

const modalHorario = document.getElementById("modalHorario");
const editDiaSemana = document.getElementById("editDiaSemana");
const editHoraInicio = document.getElementById("editHoraInicio");
const editHoraFin = document.getElementById("editHoraFin");
const btnGuardarHorario = document.getElementById("btnGuardarHorario");
const btnCerrarModal = document.getElementById("btnCerrarModal");

let horarioEditId = null;

// ✅ Mostrar horarios
async function loadHorarios() {
  const horarios = await seleccionarHorarios({ sitter_id: sitterId });

  horariosTable.innerHTML = horarios
    .map(
      (h) => `
    <tr>
      <td>${h.dia}</td>
      <td>${h.hora_inicio}</td>
      <td>${h.hora_fin}</td>
      <td>
        <label class="switch">
          <input type="checkbox" data-id="${h.id}" ${
        h.activo == 1 ? "checked" : ""
      }>
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <button class="btn-edit" 
          data-id="${h.id}" 
          data-dia="${h.dia}" 
          data-hi="${h.hora_inicio}" 
          data-hf="${h.hora_fin}">
          ✏️
        </button>
        <button class="btn-delete" data-id="${h.id}">🗑</button>
      </td>
    </tr>`
    )
    .join("");

  enableHorarioEvents();
}

// ✅ Eventos de tabla
function enableHorarioEvents() {
  document
    .querySelectorAll(".btn-delete")
    .forEach((btn) =>
      btn.addEventListener("click", () => deleteHorario(btn.dataset.id))
    );

  document
    .querySelectorAll(".switch input")
    .forEach((sw) =>
      sw.addEventListener("change", () =>
        updateHorarioState(sw.dataset.id, sw.checked ? 1 : 0)
      )
    );

  document.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", () => {
      horarioEditId = btn.dataset.id;
      editDiaSemana.value = btn.dataset.dia;
      editHoraInicio.value = btn.dataset.hi.substring(0, 5);
      editHoraFin.value = btn.dataset.hf.substring(0, 5);
      modalHorario.classList.remove("hidden");
    })
  );
}

// ✅ Crear horario
btnAddHorario.addEventListener("click", async () => {
  const dia = diaSemana.value;
  const hi = horaInicio.value;
  const hf = horaFin.value;

  const horariosActuales = await seleccionarHorarios({ sitter_id: sitterId });
  if (horariosActuales.some((h) => h.dia === dia)) {
    alert("⚠ Ya existe un horario para este día.");
    return;
  }

  const res = await insertarHorarios({
    sitter_id: sitterId,
    dia,
    hora_inicio: hi + ":00",
    hora_fin: hf + ":00",
    activo: 1,
  });

  alert(res.message || "Horario guardado ✅");
  // ✅ Limpia campos de creación
  diaSemana.selectedIndex = 0;
  horaInicio.value = "";
  horaFin.value = "";

  loadHorarios();
});

// ✅ Guardar cambios de edición
btnGuardarHorario.addEventListener("click", async () => {
  const res = await actualizarHorarios({
    id: horarioEditId,
    sitter_id: sitterId,
    dia: editDiaSemana.value,
    hora_inicio: editHoraInicio.value + ":00",
    hora_fin: editHoraFin.value + ":00",
    activo: 1,
  });

  alert(res.message || "Horario modificado ✅");
  closeHorarioModal();
  loadHorarios();
});

// ✅ Cerrar modal
function closeHorarioModal() {
  horarioEditId = null;
  editDiaSemana.selectedIndex = 0;
  editHoraInicio.value = "";
  editHoraFin.value = "";
  modalHorario.classList.add("hidden");
}

// ✅ Eliminar
async function deleteHorario(id) {
  if (!confirm("¿Eliminar horario?")) return;
  await eliminarHorarios({ id });
  loadHorarios();
}

// =============================
// ✅ RESEÑAS
// =============================
async function loadResenias() {
  console.log("Sitter ID:", sitterId);

  const resenias = await seleccionarResenias({ sitter_id: sitterId });

  console.log("📌 Reseñas recibidas:", resenias);

  reseniasList.innerHTML = resenias.length
    ? resenias
        .map(
          (r) => `
        <li class="review-item">
          ⭐ ${r.estrellas}/5 — <strong>${r.cliente}</strong>
          <p>${r.comentario}</p>
          <small>${r.fecha.split(" ")[0]}</small>
        </li>`
        )
        .join("")
    : `<p class="no-reviews">❌ Aún no hay reseñas</p>`;
}


// =============================
// ✅ TABS
// =============================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

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

// =============================
// ✅ Modal Perfil - Abrir / Cerrar
// =============================
openProfileModalBtn.addEventListener("click", () => {
  profileModal.classList.remove("hidden");
});

// ❌ cierres previos fallaban → definimos una sola función
window.closeProfileModal = function () {
  profileModal.classList.add("hidden");
};

// ✅ cerrar modal haciendo click fuera del contenido
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    closeProfileModal();
  }
});

// =============================
// ✅ INIT
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();
  await loadAppointments();
  await loadHorarios();
  await loadResenias();
});
window.sitterId = sitterId;
