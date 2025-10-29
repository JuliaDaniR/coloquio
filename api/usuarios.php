<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');
ob_start();

$usuario = new Modelo("usuarios");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $accion = $_POST["accion"] ?? "";
    $id = trim($_POST["id"] ?? '');
    $email = trim($_POST["email"] ?? '');
    $password = trim($_POST["password"] ?? '');
    $rol = trim($_POST["rol"] ?? '');
    $nombre = trim($_POST["nombre_completo"] ?? '');
    $direccion = trim($_POST["direccion"] ?? '');
    $rolProfesional = trim($_POST["rol_profesional"] ?? '');
    $descripcion = trim($_POST["descripcion"] ?? '');

    // ===================== ELIMINAR =====================
    if ($accion === "eliminar" && !empty($id)) {
        $resultado = $usuario->eliminar($id);
        echo json_encode([
            "success" => $resultado,
            "message" => $resultado ? "Usuario eliminado correctamente." : "Error al eliminar usuario."
        ]);
        ob_end_flush(); exit;
    }

    // ===================== DAR ALTA / BAJA =====================
    if (in_array($accion, ["alta", "baja"]) && !empty($id)) {
        $activo = ($accion === "alta") ? 1 : 0;
        $resultado = $usuario->actualizar(["activo" => $activo], $id);
        echo json_encode([
            "success" => $resultado,
            "message" => $accion === "alta" ? "Usuario dado de alta ✅" : "Usuario dado de baja 🚫"
        ]);
        ob_end_flush(); exit;
    }

    // ===================== VERIFICAR PROFESIONAL =====================
    if ($accion === "verificar" && !empty($id)) {
        $resultado = $usuario->actualizar(["verificado" => 1], $id);
        echo json_encode([
            "success" => $resultado,
            "message" => "Profesional verificado correctamente ✅"
        ]);
        ob_end_flush(); exit;
    }

    // ===================== INSERTAR =====================
    if ($accion === "insertar") {
        if (empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Correo y contraseña son obligatorios."]);
        ob_end_flush(); exit;
        }

        // Primer usuario = ADMIN
        $totalUsuarios = $usuario->seleccionar();
        if (count($totalUsuarios) == 0) {
            $rol = "ADMIN";
        } elseif (empty($rol)) {
            $rol = "OWNER";
        }

        // Email único
        $usuario->setCriterio("email = '$email'");
        $existe = $usuario->seleccionar();
        if (count($existe) > 0) {
            echo json_encode(["success" => false, "message" => "Ya existe un usuario con ese correo."]);
            ob_end_flush(); exit;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        // ✅ Verificación automática según tipo de usuario
        $rolUpper = strtoupper($rol);
        $verificado = ($rolUpper === "OWNER" || $rolUpper === "ADMIN") ? 1 : 0;

        $datos = [
            "email" => $email,
            "password" => $hash,
            "rol" => $rolUpper,
            "activo" => 1,
            "verificado" => $verificado
        ];

        $resultado = $usuario->insertar($datos);
        echo json_encode([
            "success" => $resultado > 0,
            "message" => "Usuario registrado correctamente.",
            "role" => $rolUpper,
            "verificado" => $verificado
        ]);
        ob_end_flush(); exit;
    }

    // ===================== ACTUALIZAR =====================
    if ($accion === "actualizar" && !empty($id)) {

        $datos = [];
        if (!empty($nombre)) $datos["nombre_completo"] = $nombre;
        if (!empty($email)) $datos["email"] = $email;
        if (!empty($rol)) $datos["rol"] = strtoupper($rol);
        if (!empty($direccion)) $datos["direccion"] = $direccion;
        if (!empty($password)) $datos["password"] = password_hash($password, PASSWORD_DEFAULT);
        if (!empty($descripcion)) $datos["descripcion"] = $descripcion;
        
        // Solo si es sitter
        if (strtoupper($rol) === "SITTER" && !empty($rolProfesional)) {
            $datos["rol_profesional"] = strtoupper($rolProfesional);
        }

        // ✅ Manejo de imagen
        if (isset($_FILES["foto"]) && $_FILES["foto"]["error"] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES["foto"]["name"], PATHINFO_EXTENSION);
        $nuevoNombre = "img_" . uniqid() . "." . $ext;

        $rutaDestino = "../uploads/" . $nuevoNombre;

        if (!is_dir("../uploads")) mkdir("../uploads", 0777, true);

        if (move_uploaded_file($_FILES["foto"]["tmp_name"], $rutaDestino)) {
        $datos["foto_url"] = "uploads/" . $nuevoNombre;
         }
        }
        $resultado = $usuario->actualizar($datos, $id);

        echo json_encode([
            "success" => $resultado,
            "message" => $resultado ? "Usuario actualizado correctamente." : "Error al actualizar usuario."
        ]);
        ob_end_flush(); exit;
    }

    // Si llegó aquí → acción inválida
    echo json_encode(["success" => false, "message" => "Acción no válida o falta ID."]);
    ob_end_flush(); exit;
}


// ===== GET: Seleccionar usuarios =====
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $usuarios = $usuario->seleccionar();
    echo json_encode($usuarios);
    ob_end_flush(); exit;
}
?>
