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

$sql = "SELECT 
          c.id, 
          c.fecha, 
          c.hora, 
          c.estado,
          c.sitter_id,            -- ✅ necesario para las reseñas
          c.cliente_id,
          m.nombre AS mascota,
          u1.nombre_completo AS duenio,
          u2.nombre_completo AS cuidador,
          -- ✅ detectar si ya tiene reseña
          (SELECT COUNT(*) 
             FROM resenias r 
            WHERE r.cita_id = c.id) AS tiene_resenia
        FROM citas c
        JOIN mascotas m ON m.id = c.mascota_id
        JOIN usuarios u1 ON u1.id = c.cliente_id
        JOIN usuarios u2 ON u2.id = c.sitter_id";

  if (isset($_GET['sitter_id'])) {
    $sitter_id = intval($_GET['sitter_id']);
    $sql .= " WHERE c.sitter_id = $sitter_id";
  } elseif (isset($_GET['cliente_id'])) {
    $cliente_id = intval($_GET['cliente_id']);
    $sql .= " WHERE c.cliente_id = $cliente_id";
  }

  $sql .= " ORDER BY c.fecha ASC, c.hora ASC";

  $citas = $modelo->ejecutarConsulta($sql);
  echo json_encode($citas);
  exit;
}

  // =======================
  // 🆕 POST: crear/actualizar/eliminar
  // =======================
  if ($method === 'POST') {

    // 🐾 INSERTAR
    if ($accion === 'insertar') {
      $fecha      = trim($_POST['fecha'] ?? '');
      $horaInput  = trim($_POST['hora'] ?? '');
      $mascota_id = intval($_POST['mascota_id'] ?? 0);
      $cliente_id = intval($_POST['cliente_id'] ?? 0);
      $sitter_id  = intval($_POST['sitter_id'] ?? 0);

      if (!$fecha || !$horaInput || !$mascota_id || !$cliente_id || !$sitter_id) {
        echo json_encode(["success" => false, "message" => "Datos incompletos para crear la cita."]);
        exit;
      }

      // Normalizar hora a HH:MM:SS
      $hora = (strlen($horaInput) === 5) ? ($horaInput . ":00") : $horaInput;

      // Validar fecha/hora futura (servidor)
      $now = new DateTime(); // TZ del servidor
      $dt  = DateTime::createFromFormat('Y-m-d H:i:s', "$fecha $hora");
      if (!$dt) {
        echo json_encode(["success" => false, "message" => "Formato de fecha/hora inválido."]);
        exit;
      }
      if ($dt <= $now) {
        echo json_encode(["success" => false, "message" => "No se puede reservar en el pasado."]);
        exit;
      }

      // Verificar disponibilidad del sitter para ese día/horario
      // Tabla horarios: campos esperados (sitter_id, dia, hora_inicio, hora_fin, activo)
      $diaSemanaMap = ["DOM","LUN","MAR","MIE","JUE","VIE","SAB"];
      $diaIdx = (int) $dt->format('w'); // 0..6
      $diaStr = $diaSemanaMap[$diaIdx];

      $sqlH = "SELECT * FROM horarios 
               WHERE sitter_id = $sitter_id 
                 AND UPPER(dia) LIKE CONCAT(UPPER('$diaStr'), '%')
                 AND activo = 1
               LIMIT 1";
      $horario = $modelo->ejecutarConsulta($sqlH);

      if (!$horario || count($horario) === 0) {
        echo json_encode(["success" => false, "message" => "El profesional no tiene disponibilidad ese día."]);
        exit;
      }

      $hInicio = substr($horario[0]['hora_inicio'], 0, 5) . ":00";
      $hFin    = substr($horario[0]['hora_fin'],    0, 5) . ":00";

      if ($hora < $hInicio || $hora > $hFin) {
        echo json_encode(["success" => false, "message" => "Horario fuera del rango disponible del profesional."]);
        exit;
      }

      // Bloquear doble reserva (mismo sitter, misma fecha y hora)
      $sqlDup = "SELECT COUNT(*) AS cant 
                 FROM citas 
                 WHERE sitter_id = $sitter_id 
                   AND fecha = '$fecha'
                   AND hora = '$hora'
                   AND estado IN ('PENDIENTE','ACEPTADA')";
      $dup = $modelo->ejecutarConsulta($sqlDup);
      if ($dup && intval($dup[0]['cant']) > 0) {
        echo json_encode(["success" => false, "message" => "Ese horario ya está ocupado por otra reserva."]);
        exit;
      }

      // (Opcional) Evitar que el mismo dueño duplique exacto slot
      $sqlDupOwner = "SELECT COUNT(*) AS cant 
                      FROM citas 
                      WHERE cliente_id = $cliente_id 
                        AND fecha = '$fecha' 
                        AND hora = '$hora'";
      $dupO = $modelo->ejecutarConsulta($sqlDupOwner);
      if ($dupO && intval($dupO[0]['cant']) > 0) {
        echo json_encode(["success" => false, "message" => "Ya tenés una cita en ese mismo horario."]);
        exit;
      }

      // Insertar
      $datos = [
        "fecha"      => $fecha,
        "hora"       => $hora,
        "estado"     => "PENDIENTE",
        "mascota_id" => $mascota_id,
        "cliente_id" => $cliente_id,
        "sitter_id"  => $sitter_id
      ];

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
      if (isset($_POST['hora']))  $datos["hora"]  = (strlen($_POST['hora']) === 5) ? ($_POST['hora'] . ":00") : $_POST['hora'];
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