-- ═══════════════════════════════════════════════════════════════════
--  JB EMERIC — Schéma Base de Données
--  MySQL 8.0+ / MariaDB 10.6+
--  Encodage : UTF8MB4
-- ═══════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET time_zone = '+01:00';
SET foreign_key_checks = 0;

CREATE DATABASE IF NOT EXISTS `jbemeric`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `jbemeric`;

-- ─────────────────────────────────────────────
--  TABLE : users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `nom`             VARCHAR(80)     NOT NULL,
  `prenom`          VARCHAR(80)     NOT NULL,
  `email`           VARCHAR(180)    NOT NULL,
  `password`        VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
  `role`            ENUM('admin','moderateur','client')
                                    NOT NULL DEFAULT 'client',
  `telephone`       VARCHAR(20)     DEFAULT NULL,
  `niveau`          ENUM('debutant','amateur','confirme','competition')
                                    DEFAULT 'amateur',
  `licence_ffsa`    VARCHAR(20)     DEFAULT NULL,
  `email_verified`  TINYINT(1)      NOT NULL DEFAULT 0,
  `token_reset`     VARCHAR(64)     DEFAULT NULL,
  `token_expire`    DATETIME        DEFAULT NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : circuits
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `circuits` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `nom`         VARCHAR(120)    NOT NULL,
  `slug`        VARCHAR(120)    NOT NULL,
  `region`      ENUM('PACA','Occitanie','Auvergne-Rhône-Alpes',
                      'Bretagne','Normandie','Grand Est','Autre France')
                                NOT NULL DEFAULT 'PACA',
  `departement` VARCHAR(3)      DEFAULT NULL COMMENT 'Ex: 83, 13, 30',
  `ville`       VARCHAR(80)     DEFAULT NULL,
  `lat`         DECIMAL(10,7)   DEFAULT NULL,
  `lng`         DECIMAL(10,7)   DEFAULT NULL,
  `longueur_km` DECIMAL(4,2)    DEFAULT NULL,
  `photo_url`   VARCHAR(500)    DEFAULT NULL,
  `site_web`    VARCHAR(300)    DEFAULT NULL,
  `priorite`    TINYINT         NOT NULL DEFAULT 5
                                COMMENT '1=haute (PACA) … 10=basse',
  `actif`       TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug` (`slug`),
  KEY `idx_region` (`region`),
  KEY `idx_priorite` (`priorite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : vehicules
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vehicules` (
  `id`                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `nom`               VARCHAR(120)  NOT NULL,
  `marque`            VARCHAR(60)   NOT NULL,
  `modele`            VARCHAR(60)   NOT NULL,
  `annee`             YEAR          DEFAULT NULL,
  `propriete`         ENUM('jb_emeric','partenaire') NOT NULL,
  `type_vehicule`     ENUM('GT','Tourisme','Monoplace',
                           'Sport légère','Prestige route')
                                    NOT NULL DEFAULT 'Tourisme',
  `puissance_ch`      SMALLINT      DEFAULT NULL,
  `boite`             ENUM('Manuelle','Séquentielle','DCT/PDK','Auto')
                                    DEFAULT 'Manuelle',
  `concessionnaire`   VARCHAR(150)  DEFAULT NULL,
  `contact_concess`   VARCHAR(180)  DEFAULT NULL,
  `photo_url`         VARCHAR(500)  DEFAULT NULL,
  `visible_site`      TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : events
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `events` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `circuit_id`      INT UNSIGNED    NOT NULL,
  `titre`           VARCHAR(200)    DEFAULT NULL
                                    COMMENT 'Override du nom circuit',
  `date_event`      DATE            NOT NULL,
  `heure_debut`     TIME            DEFAULT '09:00:00',
  `heure_fin`       TIME            DEFAULT '17:00:00',
  `type`            ENUM('Track-Day','Stage GT','Stage Tourisme',
                          'Stage Monoplace','Stage Coaching',
                          'Journée Entreprise')
                                    NOT NULL DEFAULT 'Track-Day',
  `status`          ENUM('Draft','Potential','Open','Full','Annulé')
                                    NOT NULL DEFAULT 'Draft',
  `prix`            DECIMAL(8,2)    NOT NULL DEFAULT 0,
  `prix_location`   DECIMAL(8,2)    DEFAULT NULL
                                    COMMENT 'Supplément location véhicule JB',
  `prix_coaching`   DECIMAL(8,2)    DEFAULT NULL
                                    COMMENT 'Supplément coaching sur place',
  `nb_places`       TINYINT         NOT NULL DEFAULT 10,
  `nb_inscrits`     TINYINT         NOT NULL DEFAULT 0,
  `nb_votes`        SMALLINT        NOT NULL DEFAULT 0,
  `vehicule_id`     INT UNSIGNED    DEFAULT NULL,
  `description`     TEXT            DEFAULT NULL,
  `visible_site`    TINYINT(1)      NOT NULL DEFAULT 0,
  `source_veille`   VARCHAR(300)    DEFAULT NULL
                                    COMMENT 'URL source du scraper',
  `created_by`      INT UNSIGNED    DEFAULT NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_circuit`    (`circuit_id`),
  KEY `idx_date`       (`date_event`),
  KEY `idx_status`     (`status`),
  KEY `idx_visible`    (`visible_site`),
  CONSTRAINT `fk_event_circuit`
    FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_event_vehicule`
    FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_event_creator`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : votes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `votes` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `event_id`    INT UNSIGNED    NOT NULL,
  `user_id`     INT UNSIGNED    DEFAULT NULL,
  `ip_hash`     VARCHAR(64)     DEFAULT NULL
                                COMMENT 'Hash SHA256 de l IP (RGPD)',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vote_user`  (`event_id`, `user_id`),
  UNIQUE KEY `uq_vote_ip`    (`event_id`, `ip_hash`),
  CONSTRAINT `fk_vote_event`
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vote_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : inscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inscriptions` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `event_id`        INT UNSIGNED    NOT NULL,
  `user_id`         INT UNSIGNED    NOT NULL,
  `option_coaching` TINYINT(1)      NOT NULL DEFAULT 0,
  `option_location` TINYINT(1)      NOT NULL DEFAULT 0,
  `vehicule_perso`  VARCHAR(100)    DEFAULT NULL,
  `checklist_json`  JSON            DEFAULT NULL
                                    COMMENT '{assurance,casque,crochet,reglement}',
  `montant_total`   DECIMAL(8,2)    NOT NULL DEFAULT 0,
  `status`          ENUM('en_attente','confirmee','annulee','remboursee')
                                    NOT NULL DEFAULT 'en_attente',
  `notes`           TEXT            DEFAULT NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscription` (`event_id`, `user_id`),
  KEY `idx_user`   (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_inscr_event`
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_inscr_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TABLE : imports_csv (historique imports Access)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `imports_csv` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `filename`      VARCHAR(200)    NOT NULL,
  `nb_lignes`     INT             DEFAULT 0,
  `nb_ok`         INT             DEFAULT 0,
  `nb_erreurs`    INT             DEFAULT 0,
  `log_json`      JSON            DEFAULT NULL,
  `imported_by`   INT UNSIGNED    DEFAULT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_import_user`
    FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════
--  DONNÉES DE DÉPART
-- ═══════════════════════════════════════════════════════════════════

-- Admin par défaut (password: ChangeMoi2026!)
INSERT INTO `users` (`nom`,`prenom`,`email`,`password`,`role`) VALUES
('Admin','Yoan','admin@jbemeric.com',
 '$2y$12$exampleHashToReplaceWithRealBcrypt', 'admin'),
('Emeric','Jean-Baptiste','jb@jbemeric.com',
 '$2y$12$exampleHashToReplaceWithRealBcrypt', 'moderateur');

-- Circuits PACA
INSERT INTO `circuits` (`nom`,`slug`,`region`,`departement`,`ville`,`lat`,`lng`,`longueur_km`,`priorite`) VALUES
('Circuit du Grand Sambuc',    'grand-sambuc',   'PACA', '13', 'Arles',          43.6276, 4.5842, 2.2, 1),
('Circuit Paul Ricard HTTT',   'paul-ricard',    'PACA', '83', 'Le Castellet',   43.2508, 5.7914, 5.8, 1),
('Circuit de Brignoles',       'brignoles',      'PACA', '83', 'Brignoles',      43.4100, 6.0600, 1.8, 1),
('Circuit de Cuges-les-Pins',  'cuges-les-pins', 'PACA', '13', 'Cuges-les-Pins', 43.2900, 5.6900, 1.5, 1),
('Circuit du Luc',             'le-luc',         'PACA', '83', 'Le Luc-en-P.',   43.3800, 6.3100, 3.1, 1),
('Circuit de Lédenon',         'ledenon',        'Occitanie', '30', 'Lédenon',   43.9600, 4.6300, 3.2, 2),
('Circuit de Nogaro',          'nogaro',         'Occitanie', '32', 'Nogaro',    43.7700, 0.0300, 3.6, 2),
('Circuit d Albi',             'albi',           'Occitanie', '81', 'Albi',      43.9300, 2.0700, 3.9, 2);

-- Véhicules
INSERT INTO `vehicules` (`nom`,`marque`,`modele`,`propriete`,`type_vehicule`,`puissance_ch`,`boite`) VALUES
('BMW 325i HTCC',    'BMW',      '325i',         'jb_emeric',  'Tourisme',    320, 'Séquentielle'),
('Porsche 911 GT3',  'Porsche',  '911 GT3',      'jb_emeric',  'GT',          500, 'DCT/PDK'),
('Lotus Elise',      'Lotus',    'Elise S2',     'jb_emeric',  'Sport légère',220, 'Manuelle'),
('Ferrari F8',       'Ferrari',  'F8 Tributo',   'partenaire', 'GT',          710, 'DCT/PDK'),
('Peugeot 206 S16',  'Peugeot',  '206 S16',      'partenaire', 'Tourisme',    167, 'Manuelle');

SET foreign_key_checks = 1;
