-- Désactivation temporaire des contraintes pour éviter les conflits lors de la création des tables
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Création du schema
DROP SCHEMA IF EXISTS `dogs`;
CREATE SCHEMA IF NOT EXISTS `dogs` DEFAULT CHARACTER SET utf8;
USE `dogs`;

-- Table locality
DROP TABLE IF EXISTS `locality`;
CREATE TABLE IF NOT EXISTS `locality` (
  `idlocality` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NULL,
  `postal_code` VARCHAR(10) NULL,
  `postal_comp` VARCHAR(10) NULL,
  `toponyme` VARCHAR(10) NULL,
  `canton_code` VARCHAR(10) NULL,
  `langage_code` VARCHAR(10) NULL,
  PRIMARY KEY (`idlocality`)
) ENGINE=InnoDB;

-- Table clients
DROP TABLE IF EXISTS `clients`;
CREATE TABLE IF NOT EXISTS `clients` (
  `idclients` INT NOT NULL AUTO_INCREMENT,
  `last_name` VARCHAR(20) NULL,
  `first_name` VARCHAR(20) NULL,
  `gender` VARCHAR(1) NULL,
  `mail` VARCHAR(20) NULL,
  `phone` VARCHAR(20) NULL,
  `adress` VARCHAR(20) NULL,
  `locality_idlocality` INT NOT NULL,
  PRIMARY KEY (`idclients`),
  INDEX `fk_clients_locality1_idx` (`locality_idlocality` ASC),
  CONSTRAINT `fk_clients_locality1`
    FOREIGN KEY (`locality_idlocality`)
    REFERENCES `locality` (`idlocality`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB;

-- Table dogs
DROP TABLE IF EXISTS `dogs`;
CREATE TABLE IF NOT EXISTS `dogs` (
  `iddogs` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(20) NULL,
  `gender` VARCHAR(1) NULL,
  `sterilized` TINYINT NULL,
  `birth_date` DATETIME NULL,
  `envy` VARCHAR(20) NULL,
  PRIMARY KEY (`iddogs`)
) ENGINE=InnoDB;

-- Table services
DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `idservices` INT NOT NULL AUTO_INCREMENT,
  `date` DATETIME NULL,
  `zone` VARCHAR(20) NULL,
  `time` VARCHAR(10) NULL,
  `dogs_iddogs` INT NOT NULL,
  `clients_idclients` INT NOT NULL,
  `locality_idlocality` INT NOT NULL,
  PRIMARY KEY (`idservices`),
  INDEX `fk_services_dogs_idx` (`dogs_iddogs` ASC),
  INDEX `fk_services_clients1_idx` (`clients_idclients` ASC),
  INDEX `fk_services_locality1_idx` (`locality_idlocality` ASC),
  CONSTRAINT `fk_services_dogs`
    FOREIGN KEY (`dogs_iddogs`)
    REFERENCES `dogs` (`iddogs`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_services_clients1`
    FOREIGN KEY (`clients_idclients`)
    REFERENCES `clients` (`idclients`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_services_locality1`
    FOREIGN KEY (`locality_idlocality`)
    REFERENCES `locality` (`idlocality`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB;

-- Table races
DROP TABLE IF EXISTS `races`;
CREATE TABLE IF NOT EXISTS `races` (
  `idraces` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NULL,
  `category` VARCHAR(20) NULL,
  `morphology` VARCHAR(20) NULL,
  `classification` VARCHAR(20) NULL,
  `min_size_m` VARCHAR(5) NULL,
  `max_size_m` VARCHAR(5) NULL,
  `min_size_f` VARCHAR(5) NULL,
  `max_size_f` VARCHAR(5) NULL,
  `min_weight_m` VARCHAR(5) NULL,
  `max_weight_m` VARCHAR(5) NULL,
  `min_weight_f` VARCHAR(5) NULL,
  `max_weight_f` VARCHAR(5) NULL,
  `years` INT(2) NULL,
  PRIMARY KEY (`idraces`)
) ENGINE=InnoDB;

-- Table races_has_dogs
DROP TABLE IF EXISTS `races_has_dogs`;
CREATE TABLE IF NOT EXISTS `races_has_dogs` (
  `races_idraces` INT NOT NULL,
  `dogs_iddogs` INT NOT NULL,
  PRIMARY KEY (`races_idraces`, `dogs_iddogs`),
  INDEX `fk_races_has_dogs_dogs1_idx` (`dogs_iddogs` ASC),
  INDEX `fk_races_has_dogs_races1_idx` (`races_idraces` ASC),
  CONSTRAINT `fk_races_has_dogs_races1`
    FOREIGN KEY (`races_idraces`)
    REFERENCES `races` (`idraces`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_races_has_dogs_dogs1`
    FOREIGN KEY (`dogs_iddogs`)
    REFERENCES `dogs` (`iddogs`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB;

-- Table diseases
DROP TABLE IF EXISTS `diseases`;
CREATE TABLE IF NOT EXISTS `diseases` (
  `iddiseases` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NULL,
  `description` VARCHAR(45) NULL,
  `symptoms` VARCHAR(45) NULL,
  `prevention` VARCHAR(45) NULL,
  `heal` VARCHAR(45) NULL,
  `vaccin` TINYINT NULL,
  `zoonose` TINYINT NULL,
  PRIMARY KEY (`iddiseases`)
) ENGINE=InnoDB;

-- Table diseases_has_dogs
DROP TABLE IF EXISTS `diseases_has_dogs`;
CREATE TABLE IF NOT EXISTS `diseases_has_dogs` (
  `diseases_iddiseases` INT NOT NULL,
  `dogs_iddogs` INT NOT NULL,
  PRIMARY KEY (`diseases_iddiseases`, `dogs_iddogs`),
  INDEX `fk_diseases_has_dogs_dogs1_idx` (`dogs_iddogs` ASC),
  INDEX `fk_diseases_has_dogs_diseases1_idx` (`diseases_iddiseases` ASC),
  CONSTRAINT `fk_diseases_has_dogs_diseases1`
    FOREIGN KEY (`diseases_iddiseases`)
    REFERENCES `diseases` (`iddiseases`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_diseases_has_dogs_dogs1`
    FOREIGN KEY (`dogs_iddogs`)
    REFERENCES `dogs` (`iddogs`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB;

-- Remise des contraintes
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- Inserts exemples
INSERT INTO locality (name, postal_code, postal_comp, toponyme, canton_code, langage_code) VALUES
('Lausanne', '1400', 'Lausanne', 'truc', 'VD', 'FR');

INSERT INTO clients (last_name, first_name, gender, mail, phone, adress, locality_idlocality) VALUES
('Gontran', 'Gerard', 'M', 'gerardgontran@mail', '034636u676', 'marron4', 1);

INSERT INTO races (name, category, morphology, classification, min_size_m, max_size_m, min_size_f, max_size_f, min_weight_m, max_weight_m, min_weight_f, max_weight_f, years) VALUES
('Bouldog', 'petit', 'quadrupede', 'peluche', '1m', '1m03', '1m', '1m03', '3kg', '5kg', '3kg', '5kg', 5);

INSERT INTO dogs (first_name, gender, sterilized, birth_date, envy) VALUES
('Brutus', 'M', 1, '2012-04-02', 'os pouic pouic');

INSERT INTO races_has_dogs (races_idraces, dogs_iddogs) VALUES
(1, 1);

INSERT INTO diseases (name, description, symptoms, prevention, heal, vaccin, zoonose) VALUES
('lyme', 'Maladie infligée par les tiques', 'douleurs', 'pastille anti-tique', 'Medicament', 1, 0);

INSERT INTO diseases_has_dogs (diseases_iddiseases, dogs_iddogs) VALUES
(1, 1);

INSERT INTO services (date, zone, time, dogs_iddogs, clients_idclients, locality_idlocality) VALUES
('2015-04-02 14:00:00', 'Restaurant', '2h', 1, 1, 1);
