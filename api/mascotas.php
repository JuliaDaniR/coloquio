<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');

$modelo = new Modelo("mascotas");

try {

    $method = $_SERVER['REQUEST_METHOD'];
    $accion = $_GET['accion'] ?? ($_POST['accion'] ?? '');

    // =========================================================
    // 🐾 FUNCIONES UTILITARIAS
    // =========================================================
    function procesarFoto($campo) {
        if (isset($_FILES[$campo]) && $_FILES[$campo]["error"] === UPLOAD_ERR_OK) {

            $ext = pathinfo($_FILES[$campo]["name"], PATHINFO_EXTENSION);
            $nuevoNombre = "pet_" . uniqid() . "." . $ext;
            $rutaDestino = "../uploads/" . $nuevoNombre;

            if (!is_dir("../uploads")) mkdir("../uploads", 0777, true);

            if (move_uploaded_file($_FILES[$campo]["tmp_name"], $rutaDestino)) {
                return "uploads/" . $nuevoNombre;
            }
        }
        return null;
    }

    // =========================================================
    // ✅ GET — Obtener mascotas
    // =========================================================
    if ($method === 'GET') {

        // 📌 Mascota por ID
        if (!empty($_GET['id'])) {
            $id = intval($_GET['id']);
            $modelo->setCriterio("id = $id");
            $mascotas = $modelo->seleccionar();
            echo json_encode($mascotas[0] ?? []);
            exit;
        }

        // 📌 Mascotas del dueño logueado
        if (!empty($_GET['cliente_id'])) {
            $cliente_id = intval($_GET['cliente_id']);
            $modelo->setCriterio("cliente_id = $cliente_id");
            $mascotas = $modelo->seleccionar();
            echo json_encode($mascotas);
            exit;
        }

        // 📌 Lista completa (solo Admin)
        $mascotas = $modelo->seleccionar();
        echo json_encode($mascotas);
        exit;
    }

    // =========================================================
    // ✅ POST — Insertar / Actualizar / Eliminar
    // =========================================================
    if ($method === 'POST') {

        // 🐾 INSERTAR
        if ($accion === 'insertar') {

            $foto = procesarFoto("foto");

            $datos = [
                "nombre" => trim($_POST['nombre'] ?? ''),
                "especie" => trim($_POST['especie'] ?? ''),
                "raza" => trim($_POST['raza'] ?? ''),
                "edad" => trim($_POST['edad'] ?? ''),
                "problemas_salud" => trim($_POST['problemas_salud'] ?? ''),
                "cliente_id" => intval($_POST['cliente_id'] ?? 0)
            ];

            if ($foto) $datos["foto_url"] = $foto;

            if (empty($datos['nombre']) || empty($datos['especie']) || $datos['cliente_id'] <= 0) {
                echo json_encode(["success" => false, "message" => "Datos incompletos"]);
                exit;
            }

            $resultado = $modelo->insertar($datos);
            echo json_encode(["success" => $resultado > 0, "message" => "Mascota registrada ✅"]);
            exit;
        }

        // ✏️ ACTUALIZAR
        if ($accion === 'actualizar') {
            $id = intval($_POST['id'] ?? 0);

            if ($id <= 0) {
                echo json_encode(["success" => false, "message" => "ID inválido"]);
                exit;
            }

            $foto = procesarFoto("foto");

            $datos = [
                "nombre" => trim($_POST['nombre'] ?? ''),
                "especie" => trim($_POST['especie'] ?? ''),
                "raza" => trim($_POST['raza'] ?? ''),
                "edad" => trim($_POST['edad'] ?? ''),
                "problemas_salud" => trim($_POST['problemas_salud'] ?? '')
            ];

            if ($foto) $datos["foto_url"] = $foto;

            $resultado = $modelo->actualizar($datos, $id);
            echo json_encode(["success" => $resultado, "message" => "Mascota actualizada ✅"]);
            exit;
        }

        // ❌ ELIMINAR
        if ($accion === 'eliminar') {
            $id = intval($_POST['id'] ?? 0);
            if ($id > 0) {
                $resultado = $modelo->eliminar($id);
                echo json_encode(["success" => $resultado, "message" => "Mascota eliminada ✅"]);
            } else {
                echo json_encode(["success" => false, "message" => "ID inválido"]);
            }
            exit;
        }

        // 🚫 Acción inválida
        echo json_encode(["success" => false, "message" => "Acción no reconocida"]);
        exit;
    }

    // 🚫 Método no permitido
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;


} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}
?>
