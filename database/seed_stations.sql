-- =====================================================
-- TotalEnergies Flotilla - Seed Data: Gas Stations
-- Fuente: Cobertura Tarjeta de Flotilla (Junio 2025)
-- =====================================================
-- Estas estaciones son del catálogo oficial TotalEnergies.
-- Se insertan con is_global = 1 y user_id = NULL para que
-- sean visibles a todos los usuarios de la aplicación.
-- =====================================================

-- =====================================================
-- ZONA SUR – DISTRITO NACIONAL / SANTO DOMINGO
-- =====================================================
INSERT INTO gas_stations (user_id, name, address, zone, province, is_global, active) VALUES
(NULL, 'TotalEnergies Bella Norte',        'Av. 27 de Febrero No. 510, Los Restauradores',         'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Centauro',           'Av. Duarte esq. Central No. 377, Ens. Luperón',        'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Colombia',           'Av. República de Colombia casi esq. La Pelona',        'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Dominicana',         'Av. Máximo Gómez No. 106',                             'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies El Pilar',           'Av. Marcos Ruíz esq. Moca',                            'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies El Triángulo',       'Av. Independencia esq. Padre Billini',                 'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies KM 14',              'Autopista Duarte Km 14',                               'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La 27',              'Av. 27 de Febrero No. 350, La Esperilla',              'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La Castellana',      'Av. Gustavo Mejía Ricart esq. Dr. Defilló',            'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La Churchill',       'Av. Winston Churchill No. 100, Urb. Fernández',        'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La Kennedy',         'Av. John F. Kennedy esq. Tiradentes, Ens. La Fe',      'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La Rómulo',          'Av. Rómulo Betancourt esq. Privada, Mirador Sur',      'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Tiradentes',         'Av. Tiradentes No. 10, Ens. Naco',                     'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Los Próceres',       'Av. Los Próceres esq. Av. Sol Poniente',               'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Paraíso',            'Av. Winston Churchill, Ens. Paraíso',                  'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Quisqueya',          'Av. Máximo Gómez No. 32',                              'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies V Centenario',       'Av. V Centenario',                                     'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Plaza Bandera',      'Av. 27 de Febrero esq. Calle H',                       'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Miramar',            'Av. 30 de Mayo Km 5 1/2',                              'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Millennium',         'Av. Rómulo Betancourt',                                'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies On The Boulevard',   'Av. Winston Churchill esq. Francisco Pratts Ramírez',  'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Las Antillas',       'Av. Independencia No. 75',                             'Distrito Nacional',    'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies La Vecina',          'Av. Núñez de Cáceres, Las Praderas',                   'Distrito Nacional',    'Santo Domingo', 1, 1);

-- =====================================================
-- ZONA SUR – SANTO DOMINGO ESTE / OESTE / NORTE
-- =====================================================
INSERT INTO gas_stations (user_id, name, address, zone, province, is_global, active) VALUES
(NULL, 'TotalEnergies Las Américas',       'Autopista Las Américas Km 5',                          'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Las Américas II',    'Autopista Las Américas esq. Calle 4, La Caleta',       'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Los Mina',           'Av. San Vicente de Paúl esq. Arz. Navarrete',          'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Ozama',              'Av. Las Américas esq. Venezuela',                      'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies San Isidro',         'Autopista San Isidro Km 7',                            'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies San Luis',           'Carretera Mella Km 13 1/2, El Almirante',              'Santo Domingo Este',   'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Bella Vista Nte',    'Av. Hermanas Mirabal No. 420, Villa Mella',            'Santo Domingo Norte',  'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Ciudad Modelo',      'Av. Jacobo Majluta, Plaza Ciudad Modelo',              'Santo Domingo Norte',  'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Los Alcarrizos',     'Calle Duarte No. 22',                                  'Santo Domingo Oeste',  'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies San Miguel',         'Av. Isabel Aguiar esq. Guarocuya',                     'Santo Domingo Oeste',  'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies 6 de Noviembre',     'Autopista 6 de Noviembre Km 7',                        'Santo Domingo Norte',  'Santo Domingo', 1, 1),
(NULL, 'TotalEnergies Génesis',            'Autopista 6 de Noviembre Km 9 1/2',                    'Santo Domingo Norte',  'Santo Domingo', 1, 1);

-- =====================================================
-- ZONA SUR – PROVINCIAS
-- =====================================================
INSERT INTO gas_stations (user_id, name, address, zone, province, is_global, active) VALUES
(NULL, 'TotalEnergies Baní',               'Calle Principal La Montería No. 7',                    'Zona Sur',             'Peravia',              1, 1),
(NULL, 'Auto Paniagua',                    'Carretera Padre Las Casas',                            'Zona Sur',             'Azua',                 1, 1),
(NULL, 'Sanjuanera',                       'Carretera Sánchez Km 1 1/2',                           'Zona Sur',             'San Juan',             1, 1),
(NULL, 'Las Damas',                        'Av. Casandra Damirón Km 2 1/2',                        'Zona Sur',             'Barahona',             1, 1),
(NULL, 'Big Star Coral',                   'Av. Libertad No. 1',                                   'Zona Sur',             'Pedernales',           1, 1);

-- =====================================================
-- ZONA ESTE
-- =====================================================
INSERT INTO gas_stations (user_id, name, address, zone, province, is_global, active) VALUES
(NULL, 'TotalEnergies La Cucama',          'Autovía del Este, Boca Chica',                         'Zona Este',            'Santo Domingo',        1, 1),
(NULL, 'TotalEnergies Megapuerto',         'Autopista Las Américas Km 27',                         'Zona Este',            'Santo Domingo',        1, 1),
(NULL, 'TotalEnergies Juan Dolio',         'Autovía del Este Km 56',                               'Zona Este',            'San Pedro de Macorís', 1, 1),
(NULL, 'TotalEnergies Buenavista',         'Av. Circunvalación, San Pedro de Macorís',             'Zona Este',            'San Pedro de Macorís', 1, 1),
(NULL, 'TotalEnergies San Pedro',          'Av. Rolando Martínez No. 2',                           'Zona Este',            'San Pedro de Macorís', 1, 1),
(NULL, 'TotalEnergies Aeropuerto Romana',  'Autovía del Coral',                                    'Zona Este',            'La Romana',            1, 1),
(NULL, 'TotalEnergies Bayahibe',           'Autovía de Bayahibe',                                  'Zona Este',            'La Romana',            1, 1),
(NULL, 'TotalEnergies Punta Cana',         'Cruce Bávaro – Punta Cana',                            'Zona Este',            'La Altagracia',        1, 1),
(NULL, 'TotalEnergies Bávaro',             'Autopista Punta Cana – Macao',                         'Zona Este',            'La Altagracia',        1, 1),
(NULL, 'TotalEnergies Downtown',           'Boulevard Turístico del Este',                         'Zona Este',            'La Altagracia',        1, 1),
(NULL, 'TotalEnergies Miches',             'Carretera Bávaro – Miches',                            'Zona Este',            'El Seibo',             1, 1);

-- =====================================================
-- ZONA NORTE / CIBAO
-- =====================================================
INSERT INTO gas_stations (user_id, name, address, zone, province, is_global, active) VALUES
(NULL, 'TotalEnergies Aeropuerto Cibao',   'Av. Víctor Manuel Espaillat',                          'Zona Norte',           'Santiago',             1, 1),
(NULL, 'TotalEnergies Gurabo',             'Carretera Luperón Km 6 1/2',                           'Zona Norte',           'Santiago',             1, 1),
(NULL, 'TotalEnergies La Universitaria',   'Av. Estrella Sadhalá, frente a la PUCMM',              'Zona Norte',           'Santiago',             1, 1),
(NULL, 'TotalEnergies Navarrete',          'Autopista Duarte',                                     'Zona Norte',           'Santiago',             1, 1),
(NULL, 'TotalEnergies Bonao',              'Autopista Duarte Km 8 1/2',                            'Zona Norte',           'Monseñor Nouel',       1, 1),
(NULL, 'TotalEnergies La Vega',            'Autopista Duarte, salida La Vega',                     'Zona Norte',           'La Vega',              1, 1),
(NULL, 'TotalEnergies Moca',               'Duarte No. 30',                                        'Zona Norte',           'Espaillat',            1, 1),
(NULL, 'TotalEnergies Salcedo',            'Prol. Hermanas Mirabal No. 69',                        'Zona Norte',           'Hermanas Mirabal',     1, 1),
(NULL, 'TotalEnergies Puerto Plata',       'Av. Manolo Tavárez Justo',                             'Zona Norte',           'Puerto Plata',         1, 1),
(NULL, 'TotalEnergies SFM',                'Av. Los Mártires, San Francisco de Macorís',           'Zona Norte',           'Duarte',               1, 1);
