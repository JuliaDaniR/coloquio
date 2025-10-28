<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');

$modelo = new Modelo("horarios");

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $accion = $_GET['accion'] ?? ($_POST['accion'] ?? '');

    // ✅ GET: Lista por sitter ordenada por día
    if ($method === 'GET') {

        if (isset($_GET['sitter_id'])) {
            $sitter_id = intval($_GET['sitter_id']);

            $modelo->setCriterio("sitter_id = $sitter_id");
            $modelo->setOrden("FIELD(dia,'LUN','MAR','MIE','JUE','VIE','SAB','DOM')");

            $horarios = $modelo->seleccionar();
            echo json_encode($horarios);
            exit;
        }

        echo json_encode([]);
        exit;
    }

    // ✅ POST: Crear o actualizar
    if ($method === 'POST') {
        $id = intval($_POST['id'] ?? 0);
        $sitter_id = intval($_POST['sitter_id'] ?? 0);
        $dia = $_POST['dia'] ?? '';
        $hora_inicio = $_POST['hora_inicio'] ?? '';
        $hora_fin = $_POST['hora_fin'] ?? '';
        $activo = intval($_POST['activo'] ?? 1);

        $datos = [
            "sitter_id" => $sitter_id,
            "dia" => $dia,
            "hora_inicio" => $hora_inicio,
            "hora_fin" => $hora_fin,
            "activo" => $activo
        ];

        if ($id > 0) {
            $res = $modelo->actualizar($datos, $id);
            echo json_encode(["success" => $res, "message" => "Horario actualizado ✅"]);
        } else {
            $res = $modelo->insertar($datos);
            echo json_encode(["success" => $res > 0, "id" => $res, "message" => "Horario registrado ✅"]);
        }
        exit;
    }

    // ❌ DELETE: Eliminar horario
    if ($method === 'DELETE') {
        parse_str(file_get_contents("php://input"), $_DELETE);
        $id = intval($_DELETE['id'] ?? 0);
        
        if ($id > 0) {
            $res = $modelo->eliminar($id);
            echo json_encode(["success" => $res, "message" => "Horario eliminado ✅"]);
        } else {
            echo json_encode(["success" => false, "message" => "ID inválido"]);
        }
        exit;
    }

    // 🚫 Método no permitido
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
