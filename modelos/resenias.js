// URL para acceder a la api
const URL = "/julia-rodriguez/proyecto-coloquio/api/resenias.php?tabla=resenias";

/**
 * Selecciona las resenias de la base de datos
 */
export async function seleccionarResenias() {
  let res = await fetch(`${URL}&accion=seleccionar`);
  let datos = await res.json();
  if (res.status !== 200) {
    throw Error("Los datos no se han podido recuperar");
  }
  return datos;
}

/**
 * Inserta una resenia de la base de datos
 * @param datos de la resenia a insertar
 */
export function insertarResenias(datos) {
  fetch(`${URL}&accion=insertar`, {
    method: "POST",
    body: datos,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data;
    });
}
/**
 * Actualiza una resenia de la base de datos
 * @param datos de la resenia a actualizar
 * @param id de la resenia a actualizar
 */
export const actualizarResenias = (datos, id) => {
  fetch(`${URL}&accion=actualizar&id=${id}`, {
    method: "POST",
    body: datos,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data;
    });
};

/**
 * Elimina una resenia de la base de datos
 * @param id de la resenia a eliminar
 */
export const eliminarResenias = async (id) => {
  try {
    const res = await fetch(`${URL}&accion=eliminar&id=${id}`, {
      method: "POST"
    });
    const data = await res.json();
    console.log("Respuesta de eliminación:", data);
    return data;
  } catch (error) {
    console.error("Error en fetch eliminarMascotas:", error);
    return { success: false, error: error.message };
  }
};

