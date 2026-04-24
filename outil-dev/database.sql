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


-- ═══════════════════════════════════════════════════════════════════
--  TABLE : site_content (éditeur de texte)
--  Stocke les contenus éditables du site sous forme clé/valeur
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `site_content` (
  `key`        VARCHAR(120)   NOT NULL  COMMENT 'Identifiant unique ex: coach_off1_name',
  `value`      TEXT           NOT NULL  COMMENT 'Contenu texte brut (jamais de HTML)',
  `page`       VARCHAR(40)    DEFAULT NULL COMMENT 'Page source : index, coaching, paddock, track',
  `updated_at` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` VARCHAR(36)    DEFAULT NULL COMMENT 'UUID utilisateur Supabase',
  PRIMARY KEY (`key`),
  KEY `idx_page` (`page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données par défaut (correspondant aux CONTENT_BLOCKS dans editor.js)
INSERT IGNORE INTO `site_content` (`key`, `value`, `page`) VALUES
-- Index
('index_hero_title',    'JB EMERIC',                                        'index'),
('index_acad_title',    'DEVENIR PILOTE',                                   'index'),
('index_acad_desc',     'Du karting enfant à la compétition officielle.',   'index'),
('index_coach_title',   'LE COACHING JB',                                   'index'),
('index_coach_desc',    'JB coache depuis 1989.',                           'index'),
('index_track_title',   'TRACK-DAYS & STAGES',                              'index'),
('index_paddock_title', 'LE PADDOCK',                                       'index'),
-- Coaching
('coach_off1_tag',      'Offre 01',                                         'coaching'),
('coach_off1_pretitle', 'Pour le pilote amateur',                           'coaching'),
('coach_off1_name',     'COACHING CIRCUIT',                                 'coaching'),
('coach_off1_hook',     'Vous stagnez depuis des années sans savoir pourquoi. JB vous dit exactement ce qui se passe — et comment le corriger dès la session suivante.', 'coaching'),
('coach_off1_cta',      'Réserver une session',                             'coaching'),
('coach_off2_tag',      'Offre 02',                                         'coaching'),
('coach_off2_pretitle', 'Pilote licencié en compétition',                   'coaching'),
('coach_off2_name',     'COACHING COMPÉTITION',                             'coaching'),
('coach_off2_hook',     'Vous avez des chronos, pas les résultats que vous méritez. JB a couru au même niveau, sous la même pression.', 'coaching'),
('coach_off2_cta',      'Parler de ma saison',                              'coaching'),
('coach_faq_q1',        'Faut-il un niveau minimum ?',                      'coaching'),
('coach_faq_a1',        'Aucun. JB coache des débutants complets comme des pilotes en compétition nationale.', 'coaching'),
-- Paddock
('paddock_subtitle',    'Toute l\'actu en un coup d\'œil',                  'paddock'),
('paddock_art1_title',  'Titre de l\'article',                              'paddock'),
('paddock_art1_desc',   'Résumé de l\'article…',                            'paddock'),
('paddock_art2_title',  'Titre de l\'article',                              'paddock'),
('paddock_art2_desc',   'Résumé de l\'article…',                            'paddock'),
-- Track
('track_section_title', 'PROCHAINES SESSIONS DISPONIBLES & EN ATTENTE DE VOTE', 'track'),
('track_section_lead',  'Inscrivez-vous aux sessions confirmées ou votez pour déclencher une date. À partir de 5 pilotes intéressés, JB valide la sortie.', 'track');


-- ═══════════════════════════════════════════════════════════════════
--  TABLE : docs (Bibliothèque technique)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `docs` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200)    NOT NULL,
  `description` TEXT            DEFAULT NULL,
  `category`    ENUM('meca','elec','chas','data','regl','autre')
                                NOT NULL DEFAULT 'meca',
  `type`        ENUM('pdf','schema','video','autre')
                                NOT NULL DEFAULT 'pdf',
  `keywords`    VARCHAR(300)    DEFAULT NULL
                                COMMENT 'Mots-clés séparés par virgule',
  `file_url`    VARCHAR(500)    NOT NULL
                                COMMENT 'URL Supabase Storage',
  `file_size`   VARCHAR(20)     DEFAULT NULL COMMENT 'ex: 2.4 Mo',
  `downloads`   INT             NOT NULL DEFAULT 0,
  `visible`     TINYINT(1)      NOT NULL DEFAULT 1,
  `uploaded_by` VARCHAR(36)     DEFAULT NULL COMMENT 'UUID Supabase Auth',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_visible`  (`visible`),
  FULLTEXT KEY `ft_search` (`title`, `keywords`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════
--  TABLE : forum_threads (Sujets du forum)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `forum_threads` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200)    NOT NULL,
  `tag`         ENUM('meca','elec','chas','data','autre')
                                NOT NULL DEFAULT 'meca',
  `author_id`   VARCHAR(36)     DEFAULT NULL COMMENT 'UUID Supabase Auth',
  `author_name` VARCHAR(80)     DEFAULT NULL COMMENT 'Nom de l auteur',
  `pinned`      TINYINT(1)      NOT NULL DEFAULT 0,
  `locked`      TINYINT(1)      NOT NULL DEFAULT 0,
  `legacy`      TINYINT(1)      NOT NULL DEFAULT 0
                                COMMENT '1 = importé depuis ancien forum',
  `reply_count` SMALLINT        NOT NULL DEFAULT 0,
  `last_reply`  DATETIME        DEFAULT NULL,
  `visible`     TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tag`     (`tag`),
  KEY `idx_pinned`  (`pinned`),
  KEY `idx_visible` (`visible`),
  KEY `idx_last`    (`last_reply`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════
--  TABLE : forum_posts (Messages dans les fils)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `forum_posts` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `thread_id`   INT UNSIGNED    NOT NULL,
  `author_id`   VARCHAR(36)     DEFAULT NULL,
  `author_name` VARCHAR(80)     DEFAULT NULL,
  `is_coach`    TINYINT(1)      NOT NULL DEFAULT 0
                                COMMENT '1 = message JB / modérateur',
  `content`     TEXT            NOT NULL,
  `edited_at`   DATETIME        DEFAULT NULL,
  `deleted`     TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_thread`  (`thread_id`),
  KEY `idx_author`  (`author_id`),
  CONSTRAINT `fk_post_thread`
    FOREIGN KEY (`thread_id`) REFERENCES `forum_threads`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Trigger : incrémenter reply_count ──────────────────────────────
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS after_post_insert
AFTER INSERT ON `forum_posts`
FOR EACH ROW BEGIN
  UPDATE `forum_threads`
  SET reply_count = reply_count + 1,
      last_reply  = NEW.created_at
  WHERE id = NEW.thread_id;
END$$
DELIMITER ;

-- ── Données de démo ─────────────────────────────────────────────────
INSERT IGNORE INTO `forum_threads` (`title`,`tag`,`author_name`,`pinned`,`reply_count`,`last_reply`) VALUES
('Réglage freinage RX8 — quelle pression de pédale ?', 'meca', 'Lucas M.', 1, 7, NOW()),
('Comment lire la télémétrie MXS Strada — tutoriel débutant', 'data', 'Sophie R.', 0, 3, NOW()),
('[ARCHIVE] Géométrie Lotus Elise — réglages circuit Le Luc', 'chas', 'Forum Legacy', 0, 12, '2023-06-15 10:00:00'),
('OBD2 en piste — quels capteurs surveiller en live ?', 'elec', 'Thomas V.', 0, 5, NOW());

-- Mettre à jour legacy pour les anciens sujets
UPDATE `forum_threads` SET `legacy`=1 WHERE `author_name`='Forum Legacy';
