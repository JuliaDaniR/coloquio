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

// ====== GLOBAL ======
const ownerId = localStorage.getItem("userId");
if (!ownerId) logout();

let currentUser = null;
let editingPetId = null;

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
      <article class="card">
        <div class="card-header">
          <span class="card-badge">${(
            m.especie || "Especie"
          ).toUpperCase()}</span>
          ${header}
        </div>
        <div class="card-content">
          <h3 class="card-title">${m.nombre || "Sin nombre"}</h3>
          <p class="card-subtitle">${m.raza || "Sin raza"} • ${
        m.edad ? m.edad + " años" : "Edad no cargada"
      }</p>
          <div class="card-row">
            <span class="tag ${m.problemas_salud ? "warn" : "ok"}">
              ${
                m.problemas_salud ? "⚠ Con antecedentes" : "✅ Sin antecedentes"
              }
            </span>
            <span style="color:var(--muted);font-size:12px;">ID #${m.id}</span>
          </div>
          <div class="card-actions">
            <button class="btn-light" data-action="edit" data-id="${
              m.id
            }">✏️ Editar</button>
            <button class="btn-danger" data-action="delete" data-id="${
              m.id
            }">🗑 Eliminar</button>
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
// Citas: listar del dueño + helper “días restantes”
// =============================
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const delta = Math.round((d - today) / (1000 * 60 * 60 * 24));
  return delta;
}
async function renderAppointments() {
  const citas = await seleccionarCitas({ cliente_id: ownerId });

  appointmentsContainer.innerHTML = citas
    .map((c) => {
      // ✅ Convertimos formato YYYY-MM-DD → DD/MM/YYYY
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
      <article class="card">
        <div class="card-content">
          <h3 class="card-title">${c.mascota || "Mascota"} • ${
        c.cuidador || "Profesional"
      }</h3>
          <p class="card-subtitle">📅 ${fechaFormatted} — ⏰ ${
        c.hora || "--:--"
      }</p>
          <div class="card-row">
            <span class="tag ${
              c.estado === "ACEPTADA"
                ? "ok"
                : c.estado === "PENDIENTE"
                ? "pending"
                : ""
            }">
              ${c.estado || "PENDIENTE"}
            </span>
            ${tag}
          </div>
        </div>
      </article>`;
    })
    .join("");
}

// =============================
// Reserva: llenar selects + horarios disponibles
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
      (s) =>
        `<option value="${s.id}">${s.nombre_completo || s.email} • ${
          s.rol_profesional || ""
        }</option>`
    )
    .join("");
}

appointmentDate.addEventListener("change", fillAvailableTimes);
selectSitter.addEventListener("change", fillAvailableTimes);

// Genera slots cada 30 min entre hora_inicio y hora_fin del sitter para el día seleccionado
async function fillAvailableTimes() {
  appointmentTime.innerHTML = "";
  const sitter_id = selectSitter.value;
  const dateStr = appointmentDate.value;
  if (!sitter_id || !dateStr) return;

  const dayIdx = new Date(dateStr).getDay(); // 0=Dom .. 6=Sab
  const mapDia = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
  const dia = mapDia[dayIdx];

  const horarios = await seleccionarHorarios({ sitter_id });
  const hDay = horarios.find((h) =>
    (h.dia || "").toUpperCase().startsWith(dia)
  );
  if (!hDay || Number(hDay.activo) !== 1) {
    appointmentTime.innerHTML = `<option value="">⛔ Sin disponibilidad</option>`;
    appointmentTime.removeAttribute("required"); // ✅ Permite guardar
    return;
  }

  // ✅ Si hay horarios, vuelve a requerir
  appointmentTime.setAttribute("required", "true");

  // Generar slots 30'
  const start = hDay.hora_inicio?.substring(0, 5) || "09:00";
  const end = hDay.hora_fin?.substring(0, 5) || "17:00";

  const slots = [];
  let [sh, sm] = start.split(":").map(Number);
  let [eh, em] = end.split(":").map(Number);
  let cur = new Date(`1970-01-01T${start}:00`);
  const endD = new Date(`1970-01-01T${end}:00`);

  while (cur <= endD) {
    slots.push(cur.toTimeString().substring(0, 5));
    cur = new Date(cur.getTime() + 30 * 60000);
  }

  appointmentTime.innerHTML = slots
    .map((t) => `<option value="${t}">${t} hs</option>`)
    .join("");
}

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

  // ✅ Validar que sea una fecha y hora futura
  const now = new Date();
  const selectedDate = new Date(`${fecha}T${hora}:00`);
  if (selectedDate <= now) {
    alert("🚫 No podés reservar para una fecha u hora pasada.");
    return;
  }

  // ✅ Validar que haya horarios mostrados
  if (!appointmentTime.value) {
    alert("🚫 No hay horarios disponibles para esa fecha.");
    return;
  }

  // ✅ POST con FormData
  const datos = new FormData();
  datos.append("accion", "insertar");
  datos.append("mascota_id", mascota_id);
  datos.append("sitter_id", sitter_id);
  datos.append("cliente_id", ownerId);
  datos.append("fecha", fecha);
  datos.append("hora", hora);

  const res = await insertarCitas(datos);

  alert(res.message || "Reserva creada ✅");
  appointmentTime.innerHTML = "";

  await renderAppointments();
});


// =============================
// Theme + Logout + Init
// =============================
themeToggle?.addEventListener("change", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});
(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.body.classList.add("light-mode");
    themeToggle.checked = true;
  }
})();

window.logout = function () {
  localStorage.clear();
  location.href = "index.html";
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
