-- =============================================================
-- Fase 0 · Seed — 23 empleados + tasa BCV
-- Idempotente: usa ON CONFLICT
-- =============================================================

-- Empleados
insert into admin.empleados (cedula, nombre_completo, cta_bancaria, banco, cargo, salario_base_usd) values
  ('V-4422394',  'Moreno Meneses Alexis Jose',       '0134 105777 0001003048', '0134 Banesco', 'Director General', 900),
  ('V-9765636',  'Prieto de Moreno Anelsy T.',       '0134 105779 0001003050', '0134 Banesco', 'Directora',        900),
  ('V-21516025', 'Moreno Prieto Romario Alex',       '0134 105775 0001003049', '0134 Banesco', null,               700),
  ('V-11071274', 'Linares Ochoa Maria Eugenia',      '0134 094551 9461239312', '0134 Banesco', null,               450),
  ('V-12069847', 'Gonzalez Rodriguez Josefa',        '0134 086612 0001262320', '0134 Banesco', null,               500),
  ('V-14869808', 'Gimenez Coa Rosanyely',            '0134 094636 0001330797', '0134 Banesco', null,               450),
  ('V-20145273', 'Brett Sevilla Leandro Alfonzo',    '0134 086615 0001215732', '0134 Banesco', null,               450),
  ('V-19445347', 'Key Salgado Angelo Jose',          '0134 037161 3711041512', '0134 Banesco', null,               450),
  ('V-11561083', 'Torres Sanoja Gustavo Enrique',    '0134 033339 3331011172', '0134 Banesco', null,               450),
  ('V-30697436', 'Guevara Silva Alan Isaac',         '0134 086619 0001396411', '0134 Banesco', null,               400),
  ('V-14680970', 'Varela Alarcon Daniel Fernando',   '0134 037161 3711041560', '0134 Banesco', null,               450),
  ('V-19396799', 'Vaamondez Guillen Alba R.',        '0134 086615 0001402307', '0134 Banesco', null,               300),
  ('V-21534596', 'Romero Ravelo Nayare Irene',       '0134 086619 0001273370', '0134 Banesco', null,               300),
  ('V-16556750', 'Perez Lopez Yerlimar Liseth',      '0134 033251 3321061090', '0134 Banesco', null,               300),
  ('V-14521877', 'Escalona Gamez Roger Orlando',     '0134 042321 4231050796', '0134 Banesco', null,               260),
  ('V-22276162', 'Granadino Danglade Luis E.',       '0134 086610 0001235466', '0134 Banesco', null,               250),
  ('V-24914682', 'Camacho Rigual Luis Augusto',      '0134 086617 0001260040', '0134 Banesco', null,               250),
  ('V-29987507', 'Moreno Prieto Joseph Alberto',     '0134 037165 3711041577', '0134 Banesco', null,               400),
  ('V-17428830', 'Caideco Tequia Jean Carlos',       '0134 037166 3711041571', '0134 Banesco', null,               260),
  ('V-21063692', 'Gatica Torres Genesis Patric.',    '0134 086615 0001414957', '0134 Banesco', null,               160),
  ('V-25023951', 'Somaza Hernandez Yeefran',         '0134 086615 0001434285', '0134 Banesco', null,               400),
  ('V-23186563', 'Mendez Montilla Kelvis Alfr.',     '0134 086616 0001436075', '0134 Banesco', null,               400),
  ('V-30726464', 'Sierra Ramos Nancy Paola',         '0134 086617 0001449027', '0134 Banesco', null,               250)
on conflict (cedula) do nothing;

-- Tasa BCV inicial
insert into admin.tasas_cambio (fecha, bs_usd, bs_eur, fuente)
values (current_date, 471.7000, 543.9413, 'BCV')
on conflict (fecha) do nothing;

-- Verificacion: debe dar 23 y 9630
-- select count(*) from admin.empleados;
-- select sum(salario_base_usd) from admin.empleados;
