// ===== Importaciones (usar tus módulos existentes) =====
import {
  seleccionarUsuarios,
  actualizarUsuarios,
} from "../modelos/usuarios.js";
import {
  seleccionarMascotas,
  insertarMascotas,
  actualizarMascotas,
  eliminarMascotas,
} from "../modelos/mascotas.js";
import { seleccionarCitas, insertarCitas } from "../modelos/citas.js";
import { seleccionarHorarios } from "../modelos/horarios.js";
import { insertarResenias } from "../modelos/resenias.js"; // ✅ nuevo

// ====== GLOBAL ======
const ownerId = localStorage.getItem("userId");
if (!ownerId) logout();

let currentUser = null;
let editingPetId = null;
let currentCitaId = null;
let currentSitterId = null;

// Header / UI
const ownerNameEl = document.getElementById("ownerName");
const themeToggle = document.getElementById("themeToggle");

// Secciones
const petsContainer = document.getElementById("petsContainer");
const appointmentsContainer = document.getElementById("appointmentsContainer");

// Botones
const btnEditProfile = document.getElementById("btnEditProfile");
const btnAddPet = document.getElementById("btnAddPet");

// Modales
const modalProfile = document.getElementById("modalProfile");
const modalPet = document.getElementById("petModal");

// Perfil (modal)
const editOwnerNombre = document.getElementById("editOwnerNombre");
const editOwnerEmail = document.getElementById("editOwnerEmail");
const editOwnerDireccion = document.getElementById("editOwnerDireccion");
const editOwnerPassword = document.getElementById("editOwnerPassword");
const editOwnerFoto = document.getElementById("editOwnerFoto");
const editOwnerAvatarPreview = document.getElementById(
  "editOwnerAvatarPreview"
);
const editOwnerDescripcion = document.getElementById("editOwnerDescripcion");

// Mascota (modal)
const petNombre = document.getElementById("petNombre");
const petEspecie = document.getElementById("petEspecie");
const petRaza = document.getElementById("petRaza");
const petEdad = document.getElementById("petEdad");
const petProblemas = document.getElementById("petProblemas");
const petFoto = document.getElementById("petFoto");
const petFotoPreview = document.getElementById("petFotoPreview");

// Reserva
const appointmentForm = document.getElementById("appointmentForm");
const selectPet = document.getElementById("selectPet");
const selectSitter = document.getElementById("selectSitter");
const appointmentDate = document.getElementById("appointmentDate");
const appointmentTime = document.getElementById("appointmentTime");

// =============================
// Util: placeholder por especie
// =============================
function petPlaceholderClass(especie) {
  const e = (especie || "").toLowerCase();
  if (e.includes("perr")) return "pet-placeholder pet-dog";
  if (e.includes("gat")) return "pet-placeholder pet-cat";
  return "pet-placeholder pet-other";
}
function petPlaceholderEmoji(especie) {
  const e = (especie || "").toLowerCase();
  if (e.includes("perr")) return "🐶";
  if (e.includes("gat")) return "🐱";
  return "🐾";
}

// =============================
// Perfil: cargar/abrir/guardar
// =============================
async function loadProfile() {
  const users = await seleccionarUsuarios();
  currentUser = users.find((u) => u.id == ownerId);
  if (!currentUser) return logout();

  ownerNameEl.textContent =
    currentUser.nombre_completo || currentUser.email || "Usuario";

  // Pre-cargar modal
  editOwnerNombre.value = currentUser.nombre_completo || "";
  editOwnerEmail.value = currentUser.email || "";
  editOwnerDireccion.value = currentUser.direccion || "";
  editOwnerDescripcion.value = currentUser.descripcion || "";
  editOwnerPassword.value = "";

  if (currentUser.foto_url) {
    editOwnerAvatarPreview.src = currentUser.foto_url;
    editOwnerAvatarPreview.classList.remove("hidden");
  } else {
    editOwnerAvatarPreview.classList.add("hidden");
  }
}

btnEditProfile?.addEventListener("click", () =>
  modalProfile.classList.remove("hidden")
);

document
  .getElementById("editOwnerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = new FormData();
    datos.append("accion", "actualizar");
    datos.append("id", currentUser.id);
    datos.append("nombre_completo", editOwnerNombre.value.trim());
    datos.append("email", editOwnerEmail.value.trim());
    datos.append("direccion", editOwnerDireccion.value.trim());
    datos.append("descripcion", editOwnerDescripcion.value.trim());
    datos.append("rol", "OWNER");

    if (editOwnerPassword.value.trim()) {
      datos.append("password", editOwnerPassword.value.trim());
    }

    const file = editOwnerFoto.files?.[0];
    if (file) datos.append("foto", file);

    const res = await actualizarUsuarios(datos);
    alert(res.message || "Perfil actualizado ✅");

    closeProfileModal();
    await loadProfile();
  });

function closeProfileModal() {
  editOwnerPassword.value = "";
  modalProfile.classList.add("hidden");
}

editOwnerFoto?.addEventListener("change", () => {
  if (editOwnerFoto.files[0]) {
    editOwnerAvatarPreview.src = URL.createObjectURL(editOwnerFoto.files[0]);
    editOwnerAvatarPreview.classList.remove("hidden");
  }
});

window.closeProfileModal = closeProfileModal;

// =============================
// Mascotas: listar / crear / editar / eliminar
// =============================
async function renderPets() {
  const mascotas = await seleccionarMascotas({ cliente_id: ownerId });

  petsContainer.innerHTML = mascotas
    .map((m) => {
      const header = m.foto_url
        ? `<img src="${m.foto_url}" alt="${m.nombre || "Mascota"}">`
        : `<div class="${petPlaceholderClass(m.especie)}">${petPlaceholderEmoji(
            m.especie
          )}</div>`;

      return `
      <article class="pet-card">
  <div class="pet-card-header">
    <span class="pet-card-badge">${(
      m.especie || "Especie"
    ).toUpperCase()}</span>
    ${header}
  </div>

  <div class="pet-card-content">
    <h3 class="pet-card-title">${m.nombre || "Sin nombre"}</h3>
    <p class="pet-card-subtitle">${m.raza || "Sin raza"} • ${
        m.edad ? m.edad + " años" : "Edad no cargada"
      }</p>

    <span class="pet-tag ${m.problemas_salud ? "warn" : "ok"}">
      ${m.problemas_salud ? "⚠ Con antecedentes" : "✅ Sin antecedentes"}
    </span>

    <div class="pet-card-actions">
      <button class="btn-edit" data-action="edit" data-id="${m.id}">
        ✏️ Editar
      </button>
      <button class="btn-delete" data-action="delete" data-id="${m.id}">
        🗑 Eliminar
      </button>
    </div>
  </div>
</article>
    `;
    })
    .join("");

  // eventos
  petsContainer.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () =>
      openPetModalForEdit(
        btn.dataset.id,
        mascotas.find((x) => x.id == btn.dataset.id)
      )
    );
  });
  petsContainer.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta mascota?")) return;
      await eliminarMascotas(btn.dataset.id);
      await renderPets();
      await reloadPetsInSelectors();
    });
  });
}
btnAddPet?.addEventListener("click", () => openPetModalForCreate());

function openPetModalForCreate() {
  editingPetId = null;
  clearPetForm();
  modalPet.classList.remove("hidden");
}
function openPetModalForEdit(id, data) {
  editingPetId = id;
  clearPetForm();
  petNombre.value = data?.nombre || "";
  petEspecie.value = data?.especie || "";
  petRaza.value = data?.raza || "";
  petEdad.value = data?.edad || "";
  petProblemas.value = data?.problemas_salud || "";
  if (data?.foto_url) {
    petFotoPreview.src = data.foto_url;
    petFotoPreview.classList.remove("hidden");
  }
  modalPet.classList.remove("hidden");
}
function clearPetForm() {
  petNombre.value = "";
  petEspecie.value = "";
  petRaza.value = "";
  petEdad.value = "";
  petProblemas.value = "";
  petFoto.value = "";
  petFotoPreview.classList.add("hidden");
}
document.getElementById("petForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: petNombre.value.trim(),
    especie: petEspecie.value.trim(),
    raza: petRaza.value.trim(),
    edad: petEdad.value.trim(),
    problemas_salud: petProblemas.value.trim(),
    cliente_id: ownerId,
  };
  const file = petFoto.files?.[0];
  if (file) datos.foto = file;

  if (editingPetId) {
    await actualizarMascotas({ id: editingPetId, ...datos });
    alert("Mascota actualizada ✅");
  } else {
    await insertarMascotas(datos);
    alert("Mascota registrada ✅");
  }

  closePetModal();
  await renderPets();
  await reloadPetsInSelectors();
});
function closePetModal() {
  modalPet.classList.add("hidden");
  clearPetForm();
}
petFoto?.addEventListener("change", () => {
  if (petFoto.files[0]) {
    petFotoPreview.src = URL.createObjectURL(petFoto.files[0]);
    petFotoPreview.classList.remove("hidden");
  }
});
window.closePetModal = closePetModal;

// =============================
// Helpers
// =============================
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function setMinDateToday() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  appointmentDate.setAttribute("min", todayStr);
  appointmentDate.value = todayStr;
}

// =============================
// Citas: listar del dueño
// =============================
async function renderAppointments() {
  const citas = await seleccionarCitas({ cliente_id: ownerId });

  appointmentsContainer.innerHTML = citas
    .map((c) => {
      const fechaFormatted =
        c.fecha?.split("-").reverse().join("/") || "--/--/----";
      const restantes = daysUntil(c.fecha);

      const tag =
        restantes > 1
          ? `<span class="tag ok">Faltan ${restantes} días</span>`
          : restantes === 1
          ? `<span class="tag warn">Mañana</span>`
          : restantes === 0
          ? `<span class="tag warn">Hoy</span>`
          : `<span class="tag pending">Vencida</span>`;

      return `
<article class="card appointment-card">
  <div class="appointment-header">
    <span class="pet-icon">🐾</span>
    <strong>${c.mascota || "Mascota"}</strong>
    <span class="separator">•</span>
    <span class="sitter-name">${c.cuidador || "Profesional"}</span>
  </div>
  <div class="card-content">
    <p class="schedule">📅 ${fechaFormatted} — ⏰ ${c.hora || "--:--"}</p>
    <div class="status-row">
      <span class="tag ${
        c.estado === "ACEPTADA"
          ? "ok"
          : c.estado === "PENDIENTE"
          ? "pending"
          : "reject"
      }">${c.estado || "PENDIENTE"}</span>
      ${tag}
    </div>
    ${
      c.estado === "FINALIZADA" &&
      Number(c.tiene_resenia) === 0
        ? `
    <div class="review-actions">
      <button class="btn-review"
        data-cita="${c.id}"
        data-sitter="${c.sitter_id}">
        ⭐ Calificar
      </button>
    </div>`
        : ""
    }
  </div>
</article>`;
    })
    .join("");

  document.querySelectorAll(".btn-review").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cita = btn.dataset.cita;
      const sitter = btn.dataset.sitter;

      console.log("Botón reseña → cita:", cita, "sitter:", sitter);

      if (!cita || !sitter) {
        alert("Error: faltan datos para abrir la reseña.");
        return;
      }

      openReviewModal(cita, sitter);
    });
  });
}

document.getElementById("reviewForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const estrellas = reviewStars.value;
  const comentario = reviewComment.value.trim();

  const datos = new FormData();
  datos.append("accion", "insertar");
  datos.append("cita_id", currentCitaId);
  datos.append("sitter_id", currentSitterId);
  datos.append("cliente_id", ownerId);
  datos.append("estrellas", estrellas);
  datos.append("comentario", comentario);

  const res = await insertarResenias(datos);

  alert(res?.message ?? "✅ ¡Gracias por tu reseña!");

  await renderAppointments(); // actualizar citas
  closeReviewModal(); // cerrar modal DESPUÉS del re-render
});

function openReviewModal(cita, sitter) {
  currentCitaId = cita;
  currentSitterId = sitter;
  document.getElementById("modalReview").classList.remove("hidden");
}

function closeReviewModal() {
  currentCitaId = null;
  currentSitterId = null;
  document.getElementById("modalReview").classList.add("hidden");
}
window.closeReviewModal = closeReviewModal;

// =============================
// Reserva: llenar selects
// =============================
async function reloadPetsInSelectors() {
  const mascotas = await seleccionarMascotas({ cliente_id: ownerId });
  selectPet.innerHTML = mascotas
    .map((m) => `<option value="${m.id}">${m.nombre} • ${m.especie}</option>`)
    .join("");
}

async function reloadSittersInSelectors() {
  const usuarios = await seleccionarUsuarios();
  const sitters = usuarios.filter(
    (u) =>
      (u.rol || "").toUpperCase() === "SITTER" && String(u.verificado) === "1"
  );
  selectSitter.innerHTML = sitters
    .map(
      (s) => `
    <option value="${s.id}">${s.nombre_completo || s.email} • ${
        s.rol_profesional || ""
      }</option>
  `
    )
    .join("");
}

// =============================
// Horarios disponibles del sitter (con autoselección)
// =============================
appointmentDate.addEventListener("change", fillAvailableTimes);
selectSitter.addEventListener("change", fillAvailableTimes);

async function fillAvailableTimes() {
  appointmentTime.innerHTML = "";

  const sitter_id = selectSitter.value;
  const dateStr = appointmentDate.value; // Esperado en formato YYYY-MM-DD
  if (!sitter_id || !dateStr) return;

  // ✅ Cálculo seguro del día de la semana
  const [yyyy, mm, dd] = dateStr.split("-");
  const safeDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  const dayIdx = safeDate.getDay(); // 0=Dom .. 6=Sab
  const mapDia = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  const dia = mapDia[dayIdx];

  // 🔍 Obtener horarios del sitter
  const horarios = await seleccionarHorarios({ sitter_id });
  console.log("Horarios recibidos:", horarios);
  console.log("Buscando disponibilidad para el día:", dia);

  const hDay = horarios.find((h) => (h.dia || "").trim().toUpperCase() === dia);

  if (!hDay || Number(hDay.activo) !== 1) {
    appointmentTime.innerHTML = `<option value="">⛔ Sin disponibilidad</option>`;
    appointmentTime.removeAttribute("required");
    reservarBtn.disabled = true;
    return;
  }

  appointmentTime.setAttribute("required", "true");

  // 🕒 Generar slots cada 30 minutos
  const start = hDay.hora_inicio?.substring(0, 5) || "09:00";
  const end = hDay.hora_fin?.substring(0, 5) || "17:00";

  const slots = [];
  let cur = new Date(`1970-01-01T${start}:00`);
  const endD = new Date(`1970-01-01T${end}:00`);
  while (cur < endD) {
    const t = cur.toTimeString().substring(0, 5);
    slots.push(t);
    cur = new Date(cur.getTime() + 30 * 60000);
  }

  // 🎯 Renderizar opciones
  if (slots.length > 0) {
    appointmentTime.innerHTML = slots
      .map((t) => `<option value="${t}">${t} hs</option>`)
      .join("");
    appointmentTime.value = slots[0];
    reservarBtn.disabled = false;
  } else {
    appointmentTime.innerHTML = `<option value="">⛔ Sin disponibilidad</option>`;
    appointmentTime.removeAttribute("required");
    reservarBtn.disabled = true;
  }
}

// =============================
// Crear cita (validaciones + FormData)
// =============================
appointmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mascota_id = selectPet.value;
  const sitter_id = selectSitter.value;
  const fecha = appointmentDate.value;
  const hora = appointmentTime.value;

  if (!mascota_id || !sitter_id || !fecha || !hora) {
    alert("Completá todos los campos de la reserva.");
    return;
  }

  const now = new Date();
  const selectedDT = new Date(`${fecha}T${hora}:00`);
  if (selectedDT <= now) {
    alert("🚫 No podés reservar para una fecha u hora pasada.");
    return;
  }

  const fd = new FormData();
  fd.append("accion", "insertar");
  fd.append("mascota_id", mascota_id);
  fd.append("sitter_id", sitter_id);
  fd.append("cliente_id", ownerId);
  fd.append("fecha", fecha);
  fd.append("hora", hora);

  const res = await insertarCitas(fd);

  if (!res?.success) {
    if (res?.message?.includes("ocupado")) {
      alert("Ese horario ya está reservado. Probá con otro.");
    } else {
      alert(res?.message || "No se pudo crear la cita.");
    }
    return;
  }

  alert(res.message || "Reserva creada ✅");
  appointmentTime.innerHTML = "";
  await renderAppointments();
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
// INIT
// =============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();
  await renderPets();
  await renderAppointments();
  await reloadPetsInSelectors();
  await reloadSittersInSelectors();

  const today = new Date();
  appointmentDate.valueAsDate = today;
  await fillAvailableTimes();
});
