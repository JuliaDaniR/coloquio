// ✅ URL base
const URL = "/julia-rodriguez/proyecto-coloquio/api/horarios.php";

// ✅ Seleccionar horarios filtrando por sitter
export async function seleccionarHorarios({ sitter_id }) {
  const res = await fetch(`${URL}?sitter_id=${sitter_id}`);
  return await res.json();
}

// ✅ Insertar horario
export async function insertarHorarios(datos) {
  const body = new URLSearchParams({
    accion: "insertar",
    ...datos
  });

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  return await res.json();
}

// ✅ Actualizar horario
export async function actualizarHorarios(datos) {
  const body = new URLSearchParams({
    accion: "actualizar",
    ...datos
  });

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  return await res.json();
}

// ✅ Eliminar horario
export async function eliminarHorarios({ id }) {
  const body = new URLSearchParams({
    accion: "eliminar",
    id
  });

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  return await res.json();
}
