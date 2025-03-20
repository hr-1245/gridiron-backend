import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlayerPositionsAndMappings20250318121000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert static player positions (exactly as provided)
    await queryRunner.query(`
      INSERT INTO "player_position" (code, name)
      VALUES 
        ('TE', 'Tight End'),
        ('QB', 'Quarter Back'),
        ('RB', 'Running Back'),
        ('WR', 'Wide Receiver'),
        ('OL', 'Offensive Line'),
        ('DI', 'Defensive End'),
        ('LB', 'Line backer'),
        ('CB', 'Corner Back'),
        ('S', 'Safety')
        ('IOL', 'Interior Offensive Lineman')
        ('OT', 'Offensive Tackle')
        ('EDGE', 'Edge Rusher')
    `);

    // For "TE"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'TE')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'TE')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('change_of_direction', '',5 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('strength','',6 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('awareness', '',7 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('break_tackle', '',8 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('catch_in_traffic', '',9 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('spectacular_catch', '',10, (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('release', '',11 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('pass_block', '',12 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('pass_block_power', '',13 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('pass_block_finesse', '',14 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('run_block', '',15 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('run_block_power', '',16 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('run_block_finesse', '',17 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('lead_blocking', '',18 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('impact_blocking', '',19 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('jumping', '',20 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('carrying', '',21 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('trucking', '',22 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('catching', '',23 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('stiff_arm', '',24 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('spin_move', '',25 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('juke_move', '',26 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('short_route_running', '',27 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('medium_route_running', '',28 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('deep_route_running', '',29 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('jumping', '',30 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('stamina', '',31 , (SELECT id FROM "player_position" WHERE code = 'TE'))
        ('injury', '',32 , (SELECT id FROM "player_position" WHERE code = 'TE'))
    `);

    // For "QB"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'QB')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'QB')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'QB')),
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'QB')),
        ('awareness', '', 5, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_power', '', 6, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_accuracy_short', '', 7, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_accuracy_mid', '', 8, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_accuracy_deep', '', 9, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_on_the_run', '',  10, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('throw_under_pressure', '',  11, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('play_action', '', 12, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('break_sack', '', 13, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('break_tackle', '', 14, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('trucking', '', 15, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('carrying', '', 16, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('ball_carrier_vision', '', 17, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('spin_move', '', 18, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('juke_move', '', 19, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('stamina', '', 20, (SELECT id FROM "player_position" WHERE code = 'QB'))
        ('injury', '', 21, (SELECT id FROM "player_position" WHERE code = 'QB'))
    `);

    // For "RB"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'RB')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'RB')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('change_of_direction', '', 5, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('strength', '', 6, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('awareness', '', 7, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('break_tackle', '', 8, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('carrying', '', 9, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('trucking', '', 10, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('ball_carrier_vision', '', 13, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('catching', '', 14, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('stiff_arm', '', 15, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('spin_move', '', 16, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('juke_move', '', 17, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('pass_blocking', '', 18, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('catch_in_traffic', '', 19, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('spectacular_catch', '', 20, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('short_route_running', '', 21, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('medium_route_running', '', 22, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('release', '', 23, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('stamina', '', 24, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('return', '', 25, (SELECT id FROM "player_position" WHERE code = 'RB'))
        ('injury', '', 26, (SELECT id FROM "player_position" WHERE code = 'RB'))
    `);

    // For "WR"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'WR')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'WR')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('change_of_direction', '', 6, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('strength', '', 7, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('awareness', '', 8, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('break_tackle', '', 9, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('catch_in_traffic', '', 10, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('spectacular_catch', '', 11, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('release', '', 12, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('jumping', '', 13, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('carrying', '', 14, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('trucking', '', 15, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('ball_carrier_vision', '', 16, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('strength', '', 17, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('catching', '', 18, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('stiff_arm', '', 19, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('spin_move', '', 20, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('juke_move', '', 21, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('short_route_running', '', 22, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('medium_route_running', '', 23, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('deep_route_running', '', 24, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('jumping', '', 25, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('stamina', '', 26, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('return', '', 27, (SELECT id FROM "player_position" WHERE code = 'WR'))
        ('injury', '', 28, (SELECT id FROM "player_position" WHERE code = 'WR'))
    `);

    // For "OL"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'OL')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'OL')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('awareness', '', 4, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('agility', '', 5, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('strength', '', 6, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('lead_block', '', 7, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('impact_blocking', '', 8, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('run_blocking', '', 9, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('pass_blocking', '', 10, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('pass_block_power', '', 11, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('pass_block_finesse', '', 12, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('run_block_power', '', 13, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('run_block_finesse', '', 14, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('stamina', '', 15, (SELECT id FROM "player_position" WHERE code = 'OL'))
        ('injury', '', 16, (SELECT id FROM "player_position" WHERE code = 'OL'))
    `);

    // FOR "DI"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'DI')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'DI')),
        ('accleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('awareness', '', 5, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('strength', '', 6, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('tackling', '', 7, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('hit_power', '', 8, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('power_moves', '', 9, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('finesse_moves', '', 10, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('block_shedding', '', 11, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('pursuit', '', 12, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('play_recognition', '', 13, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('stamina', '', 14, (SELECT id FROM "player_position" WHERE code = 'DI'))
        ('injury', '', 15, (SELECT id FROM "player_position" WHERE code = 'DI'))
    `);

    // For "LB"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'LB')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'LB')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('change_of_direction', '', 5, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('awareness', '', 6, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('strength', '', 7, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('jumping', '', 8, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('tackling', '', 9, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('hit_power', '', 10, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('power_moves', '', 11, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('finesse_moves', '', 12, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('block_shedding', '', 13, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('pursuit', '', 14, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('play_recognition', '', 15, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('man_coverage', '', 16, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('zone_coverage', '', 17, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('stamina', '', 18, (SELECT id FROM "player_position" WHERE code = 'LB'))
        ('injury', '', 19, (SELECT id FROM "player_position" WHERE code = 'LB'))
    `);

    // For "CB"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'CB')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'CB')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('change_of_direction', '', 5, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('awareness', '', 6, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('strength', '', 7, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('jumping', '', 8, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('tackling', '', 9, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('hit_power', '', 10, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('pursuit', '', 14, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('play_recognition', '', 15, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('man_coverage', '', 16, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('zone_coverage', '', 17, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('press', '', 18, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('return', '', 19, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('stamina', '', 20, (SELECT id FROM "player_position" WHERE code = 'CB'))
        ('injury', '', 21, (SELECT id FROM "player_position" WHERE code = 'CB'))
    `);

    // For "S"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'S')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'S')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('change_of_direction', '', 5, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('catching', '', 6, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('awareness', '', 7, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('strength', '', 8, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('block_shed', '', 9, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('jumping', '', 10, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('tackling', '', 11, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('hit_power', '', 12, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('pursuit', '', 13, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('play_recognition', '', 14, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('man_coverage', '', 15, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('zone_coverage', '', 16, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('press', '', 17, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('stamina', '', 18, (SELECT id FROM "player_position" WHERE code = 'S'))
        ('injury', '', 19, (SELECT id FROM "player_position" WHERE code = 'S'))
    `);


    // FOR "IOL"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'IOL')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'IOL')),
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('strength', '', 5, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('lead_block', '', 6, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('impact_blocking', '', 7, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('run_blocking', '', 8, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('pass_blocking', '', 9, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('pass_block_power', '', 10, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('pass_block_finesse', '', 11, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('run_block_power', '', 12, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('run_block_finesse', '', 13, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('stamina', '', 14, (SELECT id FROM "player_position" WHERE code = 'IOL'))
        ('injury', '', 15, (SELECT id FROM "player_position" WHERE code = 'IOL'))
    `);

    // FOR "EDGE"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'EDGE')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('agility', '', 4, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('awareness', '', 5, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('strength', '', 6, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('tackling', '', 7, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('hit_power', '', 8, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('power_moves', '', 9, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('finesse_moves', '', 10, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('block_shedding', '', 11, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('block_shedding', '', 12, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('pursuit', '', 13, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('play_recognition', '', 14, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('stamina', '', 15, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
        ('injury', '', 16, (SELECT id FROM "player_position" WHERE code = 'EDGE'))
    `);

    // For "OT"
    await queryRunner.query(`
      INSERT INTO "position_attribute_mapping" ("attributeKey", "conversionLogic", "displayOrder", "positionId")
      VALUES 
        ('age', '', 1, (SELECT id FROM "player_position" WHERE code = 'OT')),
        ('speed', '', 2, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('acceleration', '', 3, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('awareness', '', 4, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('agility', '', 5, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('strength', '', 6, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('lead_block', '', 7, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('impact_blocking', '', 8, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('run_blocking', '', 9, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('pass_blocking', '', 10, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('pass_block_power', '', 11, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('pass_blocking_finesse', '', 12, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('run_block_power', '', 13, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('run_block_finesse', '', 14, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('stamina', '', 15, (SELECT id FROM "player_position" WHERE code = 'OT'))
        ('injury', '', 16, (SELECT id FROM "player_position" WHERE code = 'OT'))
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all mapping records for these positions.
    await queryRunner.query(`
      DELETE FROM "position_attribute_mapping" 
      WHERE "positionId" IN (
        SELECT id FROM "player_position" WHERE code IN (
          'TE', 'QB', 'RB', 'WR', 'OL',
          'C', 'FB', 'G', 'T', 'DI', 'LB', 'CB', 'S'
        )
      )
    `);

    // Remove the positions.
    await queryRunner.query(`
      DELETE FROM "player_position" 
      WHERE code IN (
          'TE', 'QB', 'RB', 'WR', 'OL',
          'C', 'FB', 'G', 'T', 'DI', 'LB', 'CB', 'S'
      )
    `);
  }
}

