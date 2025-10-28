<?php
require_once 'modelos.php';
header('Content-Type: application/json; charset=utf-8');
ob_start();

$usuario = new Modelo("usuarios");

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $email = trim($_POST["email"] ?? '');
    $password = trim($_POST["password"] ?? '');

    if (empty($email) || empty($password)) {
        echo json_encode([
            "success" => false,
            "message" => "Por favor, completa todos los campos."
        ]);
        ob_end_flush(); exit;
    }

    $usuario->setCriterio("email = '$email'");
    $resultado = $usuario->seleccionar();

    if (count($resultado) === 0) {
        echo json_encode([
            "success" => false,
            "message" => "No existe una cuenta con ese correo."
        ]);
        ob_end_flush(); exit;
    }

    $user = $resultado[0];

    if (!password_verify($password, $user["password"])) {
        echo json_encode([
            "success" => false,
            "message" => "Contraseña incorrecta."
        ]);
        ob_end_flush(); exit;
    }

    // Token muy simple opcional
    $tokenData = base64_encode(json_encode([
        "id" => $user["id"],
        "email" => $user["email"],
        "rol" => $user["rol"],
        "time" => time()
    ]));

    echo json_encode([
    "success" => true,
    "message" => "Inicio de sesión exitoso.",
    "user_id" => $user["id"], 
    "email" => $user["email"],
    "rol" => strtoupper($user["rol"]),
    "token" => $tokenData
    ]);


    ob_end_flush();
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Método no permitido."
]);
ob_end_flush();
exit;
?>

