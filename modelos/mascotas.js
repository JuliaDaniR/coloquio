const URL = "/julia-rodriguez/proyecto-coloquio/api/mascotas.php";

// Seleccionar mascotas de un cliente o todas
export async function seleccionarMascotas(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${URL}?${query}`);
  return await res.json();
}

// ✅ Insertar mascota
export async function insertarMascotas(data) {
  const formData = new FormData();
  formData.append("accion", "insertar");

  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }

  const res = await fetch(URL, { method: "POST", body: formData });
  return await res.json();
}

// ✅ Actualizar mascota
export async function actualizarMascotas(data) {
  const formData = new FormData();
  formData.append("accion", "actualizar");

  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }

  const res = await fetch(URL, { method: "POST", body: formData });
  return await res.json();
}

// ✅ Eliminar mascota
export async function eliminarMascotas(id) {
  const formData = new FormData();
  formData.append("accion", "eliminar");
  formData.append("id", id);

  const res = await fetch(URL, { method: "POST", body: formData });
  return await res.json();
}
