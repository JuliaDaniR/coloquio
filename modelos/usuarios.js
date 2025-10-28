const URL = "/julia-rodriguez/proyecto-coloquio/api/usuarios.php";

/**
 * Selecciona todos los usuarios
 */
export async function seleccionarUsuarios() {
  const res = await fetch(URL);
  const datos = await res.json();
  if (res.status !== 200) throw Error("Los datos no se han podido recuperar");
  return datos;
}

/**
 * Inserta un nuevo usuario
 */
export async function insertarUsuarios(formData) {
  const res = await fetch(URL, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  return data;
}

/**
 * Actualiza un usuario existente
 */
export async function actualizarUsuarios(formData) {
  formData.append("accion", "actualizar");

  const res = await fetch(URL, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data;
}

/**
 * Elimina un usuario por ID
 */
export async function eliminarUsuarios(id) {
  const formData = new FormData();
  formData.append("accion", "eliminar");
  formData.append("id", id);

  const res = await fetch(URL, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data;
}


