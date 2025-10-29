<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');

$modelo = new Modelo("resenias");

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $accion = $_GET['accion'] ?? ($_POST['accion'] ?? '');

   // ✅ GET: Listar reseñas de un sitter (con nombre del dueño)
if ($method === 'GET') {
    if (isset($_GET['sitter_id'])) {
        $sitter_id = intval($_GET['sitter_id']);

        $sql = "SELECT 
                    r.*, 
                    u.nombre_completo AS cliente
                FROM resenias r
                JOIN usuarios u ON u.id = r.cliente_id
                WHERE r.sitter_id = $sitter_id
                ORDER BY r.fecha DESC";

        $resenias = $modelo->ejecutarConsulta($sql);
        echo json_encode($resenias);
        exit;
    }

    echo json_encode([]);
    exit;
}

    // ✅ POST: Registrar reseña
    if ($method === 'POST') {
        $cita_id = intval($_POST['cita_id'] ?? 0);
        $sitter_id = intval($_POST['sitter_id'] ?? 0);
        $cliente_id = intval($_POST['cliente_id'] ?? 0);
        $estrellas = intval($_POST['estrellas'] ?? 0);
        $comentario = trim($_POST['comentario'] ?? '');

        if ($cita_id <= 0 || $sitter_id <= 0 || $cliente_id <= 0 || $estrellas <= 0) {
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
            exit;
        }

        $datos = [
            "cita_id" => $cita_id,
            "sitter_id" => $sitter_id,
            "cliente_id" => $cliente_id,
            "estrellas" => $estrellas,
            "comentario" => $comentario,
            "fecha" => date("Y-m-d H:i:s") // ✅ Fecha automática
        ];
// ✅ Evitar reseñas duplicadas por cita
$sqlCheck = "SELECT COUNT(*) as cant FROM resenias WHERE cita_id = $cita_id";
$duplicada = $modelo->ejecutarConsulta($sqlCheck);

if ($duplicada && intval($duplicada[0]['cant']) > 0) {
    echo json_encode(["success" => false, "message" => "Ya calificaste esta cita ✅"]);
    exit;
}

        $res = $modelo->insertar($datos);
        echo json_encode([
            "success" => $res > 0,
            "message" => "¡Gracias por tu reseña! ⭐"
        ]);
        exit;
    }

    // 🚫 Otros métodos no permitidos
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>