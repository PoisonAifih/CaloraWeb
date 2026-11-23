-- The kitchen's real menu replaces the placeholder seed dishes. Old dishes are switched off rather
-- than deleted because past catering plans still reference them. Nutrition values are per-bowl
-- estimates; adjust them on the admin Menus tab.
UPDATE "menus" SET "active" = false WHERE "id" IN ('P04', 'P07', 'P09', 'P11', 'P13', 'P15');

INSERT INTO "menus" ("id", "name", "meal_type", "calories", "protein_g", "carbs_g", "fat_g", "allergens_json", "dietary_tags_json", "inventory_available", "serving_size", "active") VALUES
  ('C01', 'Oyakodon', 'LUNCH', 650, 35, 85, 17, '["egg", "soy", "wheat"]', '["none"]', 50, '1 bowl', true),
  ('C02', 'Teriyaki Chicken', 'LUNCH', 620, 38, 80, 15, '["soy", "wheat", "sesame"]', '["none"]', 50, '1 bowl', true),
  ('C03', 'Nasi Goreng Ayam', 'LUNCH', 680, 30, 85, 24, '["egg", "soy"]', '["none"]', 50, '1 bowl', true),
  ('C04', 'Chicken Katsu', 'LUNCH', 750, 38, 85, 28, '["egg", "wheat", "soy"]', '["none"]', 50, '1 bowl', true),
  ('C05', 'Kung Pao Chicken', 'LUNCH', 650, 36, 75, 22, '["peanut", "soy", "wheat"]', '["none"]', 50, '1 bowl', true),
  ('C06', 'Mama''s Chicken', 'LUNCH', 600, 36, 72, 17, '[]', '["none"]', 50, '1 bowl', true),
  ('C07', 'Korean Chicken', 'LUNCH', 760, 34, 92, 27, '["soy", "wheat", "sesame"]', '["none"]', 50, '1 bowl', true),
  ('C08', 'Chicken Pad Thai', 'LUNCH', 680, 32, 88, 22, '["peanut", "egg", "fish", "soy"]', '["none"]', 50, '1 bowl', true),
  ('C09', 'Marinara Chicken Pasta', 'LUNCH', 650, 38, 82, 17, '["wheat", "milk"]', '["none"]', 50, '1 bowl', true),
  ('C10', 'Chicken Poke Bowl', 'LUNCH', 580, 36, 68, 17, '["soy", "sesame"]', '["none"]', 50, '1 bowl', true),
  ('C11', 'Mac ''n Cheese Cordon Bleu', 'LUNCH', 820, 40, 80, 36, '["wheat", "milk", "egg"]', '["none"]', 50, '1 bowl', true)
ON CONFLICT ("id") DO NOTHING;
