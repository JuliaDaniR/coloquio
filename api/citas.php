<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');

$modelo = new Modelo("citas");

try {
  $method = $_SERVER['REQUEST_METHOD'];
  $accion = $_GET['accion'] ?? ($_POST['accion'] ?? '');

  // =======================
  // 📥 GET: obtener citas
  // =======================
  if ($method === 'GET') {
    $sql = "SELECT c.id, c.fecha, c.hora, c.estado,
              m.nombre AS mascota,
              u1.nombre_completo AS duenio,
              u2.nombre_completo AS cuidador
            FROM citas c
            JOIN mascotas m ON m.id = c.mascota_id
            JOIN usuarios u1 ON u1.id = c.cliente_id
            JOIN usuarios u2 ON u2.id = c.sitter_id";

    // Filtros opcionales
    if (isset($_GET['sitter_id'])) {
      $sitter_id = intval($_GET['sitter_id']);
      $sql .= " WHERE c.sitter_id = $sitter_id";
    } elseif (isset($_GET['cliente_id'])) {
      $cliente_id = intval($_GET['cliente_id']);
      $sql .= " WHERE c.cliente_id = $cliente_id";
    }

    $citas = $modelo->ejecutarConsulta($sql);
    echo json_encode($citas);
    exit;
  }

  // =======================
  // 🆕 POST: crear, actualizar o eliminar
  // =======================
  if ($method === 'POST') {
    // 🐾 INSERTAR
    if ($accion === 'insertar') {
      $datos = [
        "fecha" => $_POST['fecha'] ?? '',
        "hora" => $_POST['hora'] ?? '',
        "estado" => "PENDIENTE",
        "mascota_id" => intval($_POST['mascota_id'] ?? 0),
        "cliente_id" => intval($_POST['cliente_id'] ?? 0),
        "sitter_id" => intval($_POST['sitter_id'] ?? 0)
      ];

      if (!$datos["fecha"] || !$datos["mascota_id"] || !$datos["cliente_id"] || !$datos["sitter_id"]) {
        echo json_encode(["success" => false, "message" => "Datos incompletos para crear la cita."]);
        exit;
      }

      $resultado = $modelo->insertar($datos);
      echo json_encode([
        "success" => $resultado > 0,
        "message" => $resultado > 0 ? "Cita creada exitosamente." : "Error al crear la cita."
      ]);
      exit;
    }

    // ✏️ ACTUALIZAR
    if ($accion === 'actualizar') {
      $id = intval($_POST['id'] ?? 0);
      if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "ID de cita inválido."]);
        exit;
      }

      $datos = [];
      if (isset($_POST['fecha'])) $datos["fecha"] = $_POST['fecha'];
      if (isset($_POST['hora'])) $datos["hora"] = $_POST['hora'];
      if (isset($_POST['estado'])) $datos["estado"] = $_POST['estado'];

      $resultado = $modelo->actualizar($datos, $id);
      echo json_encode([
        "success" => $resultado,
        "message" => $resultado ? "Cita actualizada correctamente." : "Error al actualizar cita."
      ]);
      exit;
    }

    // ❌ ELIMINAR
    if ($accion === 'eliminar') {
      $id = intval($_POST['id'] ?? 0);
      if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "ID inválido para eliminar."]);
        exit;
      }

      $resultado = $modelo->eliminar($id);
      echo json_encode([
        "success" => $resultado,
        "message" => $resultado ? "Cita eliminada correctamente." : "Error al eliminar cita."
      ]);
      exit;
    }

    // Acción desconocida
    echo json_encode(["success" => false, "message" => "Acción POST no reconocida."]);
    exit;
  }

  // 🚫 Método no permitido
  http_response_code(405);
  echo json_encode(["success" => false, "message" => "Método no permitido."]);
  exit;

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["success" => false, "error" => $e->getMessage()]);
  exit;
}
?>
