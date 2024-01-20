CREATE DATABASE cyklowaze;
USE cyklowaze;

CREATE TABLE `data_cache` (
	`id_main` INT(11) NOT NULL AUTO_INCREMENT,
	`counter_id` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`counter_direction_id` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
	`agr_date` DATE NULL DEFAULT NULL,
	`tot_cycle` INT(11) NULL DEFAULT NULL,
	`tot_peds` INT(11) NULL DEFAULT NULL,
	`avg_temp` DOUBLE NULL DEFAULT NULL,
	`quality` TINYINT(4) NULL DEFAULT NULL,
	PRIMARY KEY (`id_main`) USING BTREE,
	INDEX `Index 2` (`counter_id`, `counter_direction_id`, `agr_date`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=670
;