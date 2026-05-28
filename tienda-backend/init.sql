CREATE DATABASE IF NOT EXISTS tienda
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tienda;

CREATE TABLE categorias (
  id          INT           NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100)  NOT NULL,
  descripcion TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE usuarios (
  id            INT           NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(150)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE productos (
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

CREATE TABLE ventas (
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

CREATE TABLE detalle_ventas (
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

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Bebidas',   'Refrescos, agua, jugos y bebidas en general'),
  ('Botanas',   'Papas, cacahuates y snacks'),
  ('Abarrotes', 'Productos de despensa en general'),
  ('Lácteos',   'Leche, queso, yogurt y derivados');

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Isaac Santos', 'admin@tienda.com',
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
   'admin'),
  ('Erick Santos',  'empleado@tienda.com',
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
   'empleado');

INSERT INTO productos (nombre, precio, stock, descripcion, categoria_id) VALUES
  ('Coca-Cola 600ml',     18.00,  142, 'Refresco de cola botella PET',       1),
  ('Pepsi 600ml',         17.50,   80, 'Refresco de cola botella PET',       1),
  ('Agua mineral 1L',     12.00,   95, 'Agua purificada con gas',            1),
  ('Sabritas original',   16.50,   68, 'Papas fritas sabor original 45g',    2),
  ('Ruffles queso',       18.00,   45, 'Papas onduladas sabor queso 45g',    2),
  ('Pan Bimbo blanco',    45.00,   34, 'Pan de caja blanco grande',          3),
  ('Arroz 1kg',           28.00,   60, 'Arroz blanco grano largo',           3),
  ('Leche Lala entera 1L',28.00,   22, 'Leche entera ultrapasteurizada',     4),
  ('Queso Oaxaca 400g',   85.00,   15, 'Queso Oaxaca para quesadillas',      4);

INSERT INTO ventas (usuario_id, total, metodo_pago) VALUES
  (2, 88.50, 'efectivo');

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
  (1, 1, 2, 18.00, 36.00),
  (1, 4, 1, 16.50, 16.50),
  (1, 3, 3, 12.00, 36.00);