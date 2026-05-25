CREATE DATABASE IF NOT EXISTS tienda
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tienda;

CREATE TABLE IF NOT EXISTS categorias (
  id          INT           NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100)  NOT NULL,
  descripcion TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT           NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(150)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS productos (
  id           INT            NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(200)   NOT NULL,
  precio       DECIMAL(10,2)  NOT NULL,
  stock        INT            NOT NULL DEFAULT 0,
  descripcion  TEXT,
  categoria_id INT,
  activo       BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ventas (
  id           INT            NOT NULL AUTO_INCREMENT,
  usuario_id   INT            NOT NULL,
  total        DECIMAL(10,2)  NOT NULL,
  fecha        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago  VARCHAR(50)    NOT NULL DEFAULT 'efectivo',
  PRIMARY KEY (id),
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id              INT            NOT NULL AUTO_INCREMENT,
  venta_id        INT            NOT NULL,
  producto_id     INT            NOT NULL,
  cantidad        INT            NOT NULL,
  precio_unitario DECIMAL(10,2)  NOT NULL,
  subtotal        DECIMAL(10,2)  NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (venta_id)
    REFERENCES ventas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (producto_id)
    REFERENCES productos(id)
    ON DELETE RESTRICT
);

INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
  ('Bebidas',   'Refrescos, agua, jugos y bebidas en general'),
  ('Botanas',   'Papas, cacahuates y snacks'),
  ('Abarrotes', 'Productos de despensa en general'),
  ('Lácteos',   'Leche, queso, yogurt y derivados');

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Isaac Santos', 'admin@tienda.com',
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'admin'),
  ('Juan Torres', 'empleado@tienda.com',
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'empleado');