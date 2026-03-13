-- =====================================================
-- TotalEnergies Flotilla - MySQL Schema
-- Compatible with MySQL 8.0+
-- =====================================================

CREATE DATABASE IF NOT EXISTS flotilla_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE flotilla_db;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id             BIGINT          NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100)    NOT NULL,
    email          VARCHAR(150)    NOT NULL UNIQUE,
    password       VARCHAR(255)    NOT NULL,
    role           VARCHAR(20)     NOT NULL DEFAULT 'USER',
    active         TINYINT(1)      NOT NULL DEFAULT 1,
    refresh_token  VARCHAR(500)    NULL,
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CARD CONFIGURATION (one per user)
-- =====================================================
CREATE TABLE IF NOT EXISTS card_configs (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL UNIQUE,
    card_name           VARCHAR(150)    NOT NULL DEFAULT 'Tarjeta Flotilla',
    monthly_limit       DECIMAL(12,2)   NOT NULL DEFAULT 10000.00,
    cutoff_start_day    INT             NOT NULL DEFAULT 29,
    cutoff_end_day      INT             NOT NULL DEFAULT 2,
    recharge_day        INT             NOT NULL DEFAULT 3,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'DOP',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_config_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GAS STATIONS
-- is_global = 1  → catálogo TotalEnergies, visible a todos los usuarios
-- is_global = 0  → estación personalizada del usuario
-- user_id NULL   → solo permitido cuando is_global = 1
-- =====================================================
CREATE TABLE IF NOT EXISTS gas_stations (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NULL,
    name        VARCHAR(150)    NOT NULL,
    address     VARCHAR(255)    NULL,
    zone        VARCHAR(100)    NULL,
    province    VARCHAR(100)    NULL,
    is_global   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = catálogo TotalEnergies visible a todos',
    active      TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_stations_user   (user_id),
    INDEX idx_stations_global (is_global, active),
    CONSTRAINT fk_station_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FUEL EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS fuel_expenses (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    station_id      BIGINT          NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    date            DATETIME        NOT NULL,
    cycle_id        VARCHAR(7)      NOT NULL COMMENT 'Format: YYYY-MM',
    odometer        INT             NULL,
    notes           VARCHAR(500)    NULL,
    receipt_image   VARCHAR(255)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_expenses_user_cycle (user_id, cycle_id),
    INDEX idx_expenses_date (date),
    CONSTRAINT fk_expense_user    FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_expense_station FOREIGN KEY (station_id) REFERENCES gas_stations(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
