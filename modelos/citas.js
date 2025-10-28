const URL = "/julia-rodriguez/proyecto-coloquio/api/citas.php";

export async function seleccionarCitas(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${URL}?${query}`);
  return await res.json();
}

export async function insertarCitas(data) {
  let formData;

  if (data instanceof FormData) {
    formData = data;
  } else {
    formData = new FormData();
    formData.append("accion", "insertar");
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    }
  }

  const res = await fetch(URL, { method: "POST", body: formData });
  return await res.json();
}

export async function actualizarCitas(data) {
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

export async function eliminarCitas(id) {
  const formData = new FormData();
  formData.append("accion", "eliminar");
  formData.append("id", id);

  const res = await fetch(URL, { method: "POST", body: formData });
  return await res.json();
}
