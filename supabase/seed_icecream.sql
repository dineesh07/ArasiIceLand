-- Seed script for Arun Ice Creams subcategories and services
do $$
declare
  v_icecream_id uuid;
  v_bars_id uuid;
  v_ibar_id uuid;
  v_icone_id uuid;
  v_shake_id uuid;
  v_cups_id uuid;
  v_tubs_id uuid;
  v_spec_id uuid;
begin
  -- 1. Ensure Ice Cream Category exists
  select id into v_icecream_id from categories where name = 'Ice Cream';
  if v_icecream_id is null then
    insert into categories (name, sort_order) values ('Ice Cream', 2) returning id into v_icecream_id;
  end if;

  -- 2. Deactivate previous dummy ice cream services
  update services set active = false where category_id = v_icecream_id and subcategory_id is null;

  -- 3. Upsert Subcategories
  insert into subcategories (category_id, name, sort_order) values
    (v_icecream_id, 'Bars', 1),
    (v_icecream_id, 'iBar', 2),
    (v_icecream_id, 'i-Cone', 3),
    (v_icecream_id, 'Ice Cream Shake', 4),
    (v_icecream_id, 'Cups', 5),
    (v_icecream_id, 'Tubs', 6),
    (v_icecream_id, 'Specialities', 7)
  on conflict (category_id, name) do update set sort_order = excluded.sort_order;

  select id into v_bars_id from subcategories where category_id = v_icecream_id and name = 'Bars';
  select id into v_ibar_id from subcategories where category_id = v_icecream_id and name = 'iBar';
  select id into v_icone_id from subcategories where category_id = v_icecream_id and name = 'i-Cone';
  select id into v_shake_id from subcategories where category_id = v_icecream_id and name = 'Ice Cream Shake';
  select id into v_cups_id from subcategories where category_id = v_icecream_id and name = 'Cups';
  select id into v_tubs_id from subcategories where category_id = v_icecream_id and name = 'Tubs';
  select id into v_spec_id from subcategories where category_id = v_icecream_id and name = 'Specialities';

  -- 4. Bars (Active: 15, Inactive: 6)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_bars_id, 'Kulfi King', null, 'FIXED', 'piece', 50, true, 1),
    (v_icecream_id, v_bars_id, 'Yummy Bears', null, 'FIXED', 'piece', 30, true, 2),
    (v_icecream_id, v_bars_id, 'Chocobar', null, 'FIXED', 'piece', 30, true, 3),
    (v_icecream_id, v_bars_id, '2-in-1 Mango & Vanilla', null, 'FIXED', 'piece', 35, true, 4),
    (v_icecream_id, v_bars_id, '2-in-1 Strawberry & Blackcurrant', null, 'FIXED', 'piece', 30, true, 5),
    (v_icecream_id, v_bars_id, 'Spiral Mango & Litchi', null, 'FIXED', 'piece', 25, true, 6),
    (v_icecream_id, v_bars_id, 'Spiral Wildberry, Pineapple & Vanilla', null, 'FIXED', 'piece', 25, true, 7),
    (v_icecream_id, v_bars_id, 'Jolly Train', null, 'FIXED', 'piece', 25, true, 8),
    (v_icecream_id, v_bars_id, 'Fun Wheel', null, 'FIXED', 'piece', 30, true, 9),
    (v_icecream_id, v_bars_id, 'Whale', null, 'FIXED', 'piece', 30, true, 10),
    (v_icecream_id, v_bars_id, 'Watermelon', null, 'FIXED', 'piece', 25, true, 11),
    (v_icecream_id, v_bars_id, 'Little Love', null, 'FIXED', 'piece', 25, true, 12),
    (v_icecream_id, v_bars_id, 'Mini Chocobar', null, 'FIXED', 'piece', 20, true, 13),
    (v_icecream_id, v_bars_id, 'Likstick Grape', null, 'FIXED', 'piece', 15, true, 14),
    (v_icecream_id, v_bars_id, 'Likstick Orange', null, 'FIXED', 'piece', 15, true, 15),
    (v_icecream_id, v_bars_id, 'Trio', null, 'FIXED', 'piece', 25, false, 16),
    (v_icecream_id, v_bars_id, 'Neapolitan', null, 'FIXED', 'piece', 25, false, 17),
    (v_icecream_id, v_bars_id, 'Smiley', null, 'FIXED', 'piece', 25, false, 18),
    (v_icecream_id, v_bars_id, 'Bazooka', null, 'FIXED', 'piece', 15, false, 19),
    (v_icecream_id, v_bars_id, 'Triples', null, 'FIXED', 'piece', 10, false, 20),
    (v_icecream_id, v_bars_id, 'Popitos', null, 'FIXED', 'piece', 5, false, 21)
  on conflict do nothing;

  -- 5. iBar (Active: 3, Inactive: 2)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_ibar_id, 'Almond Crunch', null, 'FIXED', 'piece', 90, true, 22),
    (v_icecream_id, v_ibar_id, 'Belgian Chocolate (iBar mini)', null, 'FIXED', 'piece', 40, true, 23),
    (v_icecream_id, v_ibar_id, 'Raspberry Ripple (iBar mini)', null, 'FIXED', 'piece', 40, true, 24),
    (v_icecream_id, v_ibar_id, 'Classic Vanilla', null, 'FIXED', 'piece', 60, false, 25),
    (v_icecream_id, v_ibar_id, 'Irish Coffee', null, 'FIXED', 'piece', 35, false, 26)
  on conflict do nothing;

  -- 6. i-Cone (Active: 13, Inactive: 1)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_icone_id, 'Double Chocolate', '100 ml', 'FIXED', 'piece', 60, true, 27),
    (v_icecream_id, v_icone_id, 'Blackcurrant', '100 ml', 'FIXED', 'piece', 60, true, 28),
    (v_icecream_id, v_icone_id, 'Butterscotch', '100 ml', 'FIXED', 'piece', 60, true, 29),
    (v_icecream_id, v_icone_id, 'Red Velvet', '100 ml', 'FIXED', 'piece', 60, true, 30),
    (v_icecream_id, v_icone_id, 'Belgian Chocolate', '100 ml', 'FIXED', 'piece', 60, true, 31),
    (v_icecream_id, v_icone_id, 'Strawberry Cheese Cake', '100 ml', 'FIXED', 'piece', 55, true, 32),
    (v_icecream_id, v_icone_id, 'Vanilla', '100 ml', 'FIXED', 'piece', 55, true, 33),
    (v_icecream_id, v_icone_id, 'Caribbean Almond', '50 ml', 'FIXED', 'piece', 40, true, 34),
    (v_icecream_id, v_icone_id, 'Kesar Pista', '50 ml', 'FIXED', 'piece', 40, true, 35),
    (v_icecream_id, v_icone_id, 'Raspberry Chocolate Truffle', '50 ml', 'FIXED', 'piece', 40, true, 36),
    (v_icecream_id, v_icone_id, 'Cotton Candy', '50 ml', 'FIXED', 'piece', 40, true, 37),
    (v_icecream_id, v_icone_id, 'Chocolate', '50 ml', 'FIXED', 'piece', 40, true, 38),
    (v_icecream_id, v_icone_id, 'Vanilla', '50 ml', 'FIXED', 'piece', 35, true, 39),
    (v_icecream_id, v_icone_id, 'Almond Praline', '100 ml', 'FIXED', 'piece', 50, false, 40)
  on conflict do nothing;

  -- 7. Ice Cream Shake (Active: 3, Inactive: 0)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_shake_id, 'Strawberry Shake', null, 'FIXED', 'piece', 30, true, 41),
    (v_icecream_id, v_shake_id, 'Chocolate Shake', null, 'FIXED', 'piece', 30, true, 42),
    (v_icecream_id, v_shake_id, 'Cotton Candy Shake', null, 'FIXED', 'piece', 30, true, 43)
  on conflict do nothing;

  -- 8. Cups (Active: 11, Inactive: 0)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_cups_id, 'Chocolate Cup', '85 ml', 'FIXED', 'piece', 35, true, 44),
    (v_icecream_id, v_cups_id, 'Vanilla Cup', '85 ml', 'FIXED', 'piece', 30, true, 45),
    (v_icecream_id, v_cups_id, 'Strawberry Cup', '60 ml', 'FIXED', 'piece', 20, true, 46),
    (v_icecream_id, v_cups_id, 'Vanilla Cup', '60 ml', 'FIXED', 'piece', 15, true, 47),
    (v_icecream_id, v_cups_id, 'Mango Cup', '125 ml', 'FIXED', 'piece', 55, true, 48),
    (v_icecream_id, v_cups_id, 'Blackcurrant Cup', '125 ml', 'FIXED', 'piece', 55, true, 49),
    (v_icecream_id, v_cups_id, 'Kulfi Maharaj Cup', '125 ml', 'FIXED', 'piece', 55, true, 50),
    (v_icecream_id, v_cups_id, 'Italian Delight Cup', '125 ml', 'FIXED', 'piece', 55, true, 51),
    (v_icecream_id, v_cups_id, 'Butterscotch Cup', '125 ml', 'FIXED', 'piece', 45, true, 52),
    (v_icecream_id, v_cups_id, 'Kesar Pista Cup', '125 ml', 'FIXED', 'piece', 45, true, 53),
    (v_icecream_id, v_cups_id, 'Vanilla Cup', '125 ml', 'FIXED', 'piece', 45, true, 54)
  on conflict do nothing;

  -- 9. Tubs (Active: 25, Inactive: 1)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_tubs_id, 'Almond Crisp', '1000 ml', 'FIXED', 'piece', 320, true, 55),
    (v_icecream_id, v_tubs_id, 'Dark Chocolate', '1000 ml', 'FIXED', 'piece', 320, true, 56),
    (v_icecream_id, v_tubs_id, 'Italian Delight', '1000 ml', 'FIXED', 'piece', 320, true, 57),
    (v_icecream_id, v_tubs_id, 'Butterscotch', '1000 ml', 'FIXED', 'piece', 300, true, 58),
    (v_icecream_id, v_tubs_id, 'Brownie Banoffee', '1000 ml', 'FIXED', 'piece', 300, true, 59),
    (v_icecream_id, v_tubs_id, 'Sweet Butter', '1000 ml', 'FIXED', 'piece', 300, true, 60),
    (v_icecream_id, v_tubs_id, 'Caramel Peanut Butter', '1000 ml', 'FIXED', 'piece', 300, true, 61),
    (v_icecream_id, v_tubs_id, 'Strawberry Blast', '1000 ml', 'FIXED', 'piece', 290, true, 62),
    (v_icecream_id, v_tubs_id, 'Blueberry & Cheese Duet', '1000 ml', 'FIXED', 'piece', 290, true, 63),
    (v_icecream_id, v_tubs_id, 'Red Velvet & Salted Caramel Duet', '1000 ml', 'FIXED', 'piece', 290, true, 64),
    (v_icecream_id, v_tubs_id, 'Vanilla', '1000 ml', 'FIXED', 'piece', 260, true, 65),
    (v_icecream_id, v_tubs_id, 'Raj Bhog', '500 ml', 'FIXED', 'piece', 190, true, 66),
    (v_icecream_id, v_tubs_id, 'Pista', '500 ml', 'FIXED', 'piece', 180, true, 67),
    (v_icecream_id, v_tubs_id, 'Chocolate', '500 ml', 'FIXED', 'piece', 180, true, 68),
    (v_icecream_id, v_tubs_id, 'Gajar Ka Halwa', '500 ml', 'FIXED', 'piece', 170, true, 69),
    (v_icecream_id, v_tubs_id, 'Mango', '500 ml', 'FIXED', 'piece', 170, true, 70),
    (v_icecream_id, v_tubs_id, 'Butterscotch & Chocolate', '500 ml', 'FIXED', 'piece', 170, true, 71),
    (v_icecream_id, v_tubs_id, 'Vanilla & Blackcurrant Duet', '500 ml', 'FIXED', 'piece', 170, true, 72),
    (v_icecream_id, v_tubs_id, 'Butterscotch', '500 ml', 'FIXED', 'piece', 160, true, 73),
    (v_icecream_id, v_tubs_id, 'Strawberry', '500 ml', 'FIXED', 'piece', 150, true, 74),
    (v_icecream_id, v_tubs_id, 'Vanilla', '500 ml', 'FIXED', 'piece', 150, true, 75),
    (v_icecream_id, v_tubs_id, 'Coffee', '250 ml', 'FIXED', 'piece', 95, true, 76),
    (v_icecream_id, v_tubs_id, 'Butterscotch', '250 ml', 'FIXED', 'piece', 95, true, 77),
    (v_icecream_id, v_tubs_id, 'Jackfruit', '250 ml', 'FIXED', 'piece', 95, true, 78),
    (v_icecream_id, v_tubs_id, 'Vanilla', '250 ml', 'FIXED', 'piece', 85, true, 79),
    (v_icecream_id, v_tubs_id, 'Musk Melon', '250 ml', 'FIXED', 'piece', 90, false, 80)
  on conflict do nothing;

  -- 10. Specialities (Active: 9, Inactive: 5)
  insert into services (category_id, subcategory_id, name, size_label, pricing_type, unit_label, rate, active, sort_order) values
    (v_icecream_id, v_spec_id, 'Bites Vanilla', null, 'FIXED', 'piece', 10, true, 81),
    (v_icecream_id, v_spec_id, 'Bites Choco Toffee', null, 'FIXED', 'piece', 5, true, 82),
    (v_icecream_id, v_spec_id, 'Bites Cotton Candy', null, 'FIXED', 'piece', 5, true, 83),
    (v_icecream_id, v_spec_id, 'Ice Cream Sandwich Cookie & Cream', null, 'FIXED', 'piece', 25, true, 84),
    (v_icecream_id, v_spec_id, 'Mini Ball Chocolate', null, 'FIXED', 'piece', 45, true, 85),
    (v_icecream_id, v_spec_id, 'Mini Ball Vanilla', null, 'FIXED', 'piece', 45, true, 86),
    (v_icecream_id, v_spec_id, 'Cake Slice', null, 'FIXED', 'piece', 70, true, 87),
    (v_icecream_id, v_spec_id, 'Cassata Slice', null, 'FIXED', 'piece', 70, true, 88),
    (v_icecream_id, v_spec_id, 'Pushup', null, 'FIXED', 'piece', 40, true, 89),
    (v_icecream_id, v_spec_id, 'Bites Raspberry', null, 'FIXED', 'piece', 10, false, 90),
    (v_icecream_id, v_spec_id, 'Bites Red Velvet', null, 'FIXED', 'piece', 10, false, 91),
    (v_icecream_id, v_spec_id, 'Bites Lychee', null, 'FIXED', 'piece', 10, false, 92),
    (v_icecream_id, v_spec_id, 'Ice Cream Sandwich Butterscotch', null, 'FIXED', 'piece', 10, false, 93),
    (v_icecream_id, v_spec_id, 'Cassata Ball', null, 'FIXED', 'piece', 600, false, 94)
  on conflict do nothing;

end;
$$;

