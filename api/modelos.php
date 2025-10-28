<?php
require_once 'config.php'; // Requerimos el archivo de configuración

/**
 * Clase que nos permite conectarnos a la base de datos
 */
class Conexion {
   //Propiedades
   protected $bd; // Conexión a la base de datos

   // Constructor (se ejecuta al crear un objeto)
   public function __construct(){
     // Guardamos la conexión a la BD
     $this->bd = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
   // Si se produce un error de conexión
      if ($this->bd->connect_error) {
        echo "Error de conexión a la base de datos: " . $this->bd->connect_error;
        return; // Salimos del script
      }

      // Establecemos el conjunto de caracteres
      $this->bd->set_charset(DB_CHARSET);
      $this->bd->query("SET NAMES 'utf8'");
    }
}

/**
 * Clase basada en la clase Conexion 
 * para manipular los datos en la BD
 */
class Modelo extends Conexion {
    // Propiedades
    private $tabla; //Nombre de la tabla
    private $campos = '*'; //Campos de la tabla
    private $id = 0; //Id del registro
    private $criterio = ''; //Criterio para filtrar los registros
    private $orden = 'id'; //Orden de los registros
    private $limite = 0; //Límite de registros a devolver

    // Constructor
    public function __construct($tabla) {
      parent::__construct(); // Llamamos al constructor de la clase padre (Conexion)
      $this->tabla = $tabla; // Guardamos en la propidad $tabla, el valor del argumento
    }

    // Getters y Setters
    public function getCampos(){
      return $this->campos;
    }
    public function setCampos($campos){
      $this->campos = $campos;
    }
    public function getId(){
      return $this->id;
    }
    public function setId($id){
      $this->id = $id;
    }
    public function getCriterio(){
      return $this->criterio;
    }
    public function setCriterio($criterio){
      $this->criterio = $criterio;
    }
    public function getOrden(){
      return $this->orden;
    }
    public function setOrden($orden){
      $this->orden = $orden;
    }
    public function getLimite(){
      return $this->limite;
    }
    public function setLimite($limite){
      $this->limite = $limite;
    }

    /**
     * Selecciona los datos de la BD
     * return $datos los datos obtenidos
     */
 public function seleccionar() {
    $sql = "SELECT $this->campos FROM $this->tabla";
    if ($this->criterio != '') {
        $sql .= " WHERE $this->criterio";
    }
    $sql .= " ORDER BY $this->orden";
    if ($this->limite > 0) {
        $sql .= " LIMIT $this->limite";
    }

    $resultado = $this->bd->query($sql);
    $datos = $resultado->fetch_all(MYSQLI_ASSOC); // array directamente
    return $datos; // sin json_encode
}

  /**
   * Inserta un registro en la BD
   * @param datos los datos a insertar
   * @return id del registro insertado
   */

  public function insertar($datos){
    // INSERT INTO productos (codigo, nombre, descripcion, precio, stock, imagen)
    // VALUES ('P001', 'Producto 1', 'Descripción del producto 1', 10.5, 100, 'imagen1.jpg')
    unset($datos->id); // Eliminamos el id del objeto datos
    $campos = implode("," , array_keys($datos)); // Separar las claves del array
    $valores = implode("','" , array_values($datos)); // Separar los valores del array
    // Guardamos la instrucción SQL en una variable
    $sql = "INSERT INTO $this->tabla ($campos) VALUES ('$valores')";
    //echo $sql; // Mostramos la instrucción SQL (para pruebas)

    // Ejecutamos la instrucción SQL y devolvemos el id del registro insertado
 
    if ($this->bd->query($sql)) {
      // Si la consulta fue exitosa, devolvemos el id autoincremental
      return $this->bd->insert_id; 
    } else {
      return 0;
    }
  }

  /**
   * Permite actualizar un registro en la BD
   * @param datos los datos a actualizar
   * @return 
   */
  public function actualizar($datos, $id){
  $actualizaciones = [];
  foreach($datos as $key => $value){
    $actualizaciones[] = "$key='" . $this->bd->real_escape_string($value) . "'";
  }

  $sql = "UPDATE $this->tabla SET " . implode(", ", $actualizaciones) . " WHERE id = '" . $this->bd->real_escape_string($id) . "'";
  // Opcional: log para depurar
  // error_log("SQL UPDATE: $sql");

  if ($this->bd->query($sql)) {
    return true;
  } else {
    error_log("Error en UPDATE: " . $this->bd->error);
    return false;
  }
}

  /**
   * Permite eliminar un registro de la BD
   * @return 
   */
public function eliminar($id){
  $id = $this->bd->real_escape_string($id);
  $sql = "DELETE FROM $this->tabla WHERE id = '$id'";
  if ($this->bd->query($sql)) {
    return true;
  } else {
    error_log("Error en DELETE: " . $this->bd->error);
    return false;
  }
}
 // ✅ MÉTODO NUEVO
    public function contar() {
      $sql = "SELECT COUNT(*) AS total FROM $this->tabla";
      if ($this->criterio != '') {
          $sql .= " WHERE $this->criterio";
      }
      $resultado = $this->bd->query($sql);
      if ($resultado) {
          $fila = $resultado->fetch_assoc();
          return (int) $fila['total'];
      } else {
          error_log("Error en COUNT: " . $this->bd->error);
          return 0;
      }
    }

    public function ejecutarConsulta($sql) {
  $resultado = $this->bd->query($sql);
  if ($resultado) {
    return $resultado->fetch_all(MYSQLI_ASSOC);
  } else {
    error_log("Error en consulta personalizada: " . $this->bd->error);
    return [];
  }
}
}
?>