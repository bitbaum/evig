-- Seed IT-Hilfe technician profiles for RevampIT staff
-- Uses email-based JOINs (no hardcoded UUIDs) and ON CONFLICT for idempotency

-- Georgy: full-stack repair + setup + support
INSERT INTO helper_profiles (user_id, bio, hourly_rate_cents, accepts_gratis, accepts_kulturlegi, service_types, location_postal_code, location_city, location_canton, max_travel_km, is_active)
SELECT u.id,
       'Hardware-Reparaturen, Linux-Installationen und IT-Beratung. Erfahrung mit Laptops, Desktops und Netzwerken.',
       4000, true, true,
       ARRAY['flexible', 'onsite', 'dropoff'],
       '8055', 'Zürich', 'Zürich', 20, true
FROM users u WHERE u.email = 'georgy.butaev@revamp-it.ch'
ON CONFLICT (user_id) DO NOTHING;

-- Test Admin: setup + data recovery
INSERT INTO helper_profiles (user_id, bio, hourly_rate_cents, accepts_gratis, accepts_kulturlegi, service_types, location_postal_code, location_city, location_canton, max_travel_km, is_active)
SELECT u.id,
       'Spezialisiert auf Betriebssystem-Installationen, Datenrettung und Backup-Lösungen.',
       3500, true, true,
       ARRAY['flexible', 'remote', 'dropoff'],
       '8005', 'Zürich', 'Zürich', 15, true
FROM users u WHERE u.email = 'testadmin@revamp-it.ch'
ON CONFLICT (user_id) DO NOTHING;

-- Staff Test: support + network
INSERT INTO helper_profiles (user_id, bio, hourly_rate_cents, accepts_gratis, accepts_kulturlegi, service_types, location_postal_code, location_city, location_canton, max_travel_km, is_active)
SELECT u.id,
       'Netzwerk-Einrichtung, WLAN-Optimierung und allgemeine IT-Unterstützung.',
       3000, true, true,
       ARRAY['flexible', 'onsite', 'remote'],
       '8003', 'Zürich', 'Zürich', 10, true
FROM users u WHERE u.email = 'stafftest@revamp-it.ch'
ON CONFLICT (user_id) DO NOTHING;

-- Skills for Georgy
INSERT INTO user_skills (user_id, skill_id, category_id)
SELECT u.id, s.skill_id, s.category_id
FROM users u
CROSS JOIN (VALUES
  ('hardware_diagnosis', 'repair'),
  ('screen_repair', 'repair'),
  ('battery_replacement', 'repair'),
  ('ssd_upgrade', 'repair'),
  ('cleaning', 'repair'),
  ('os_installation', 'setup'),
  ('linux_install', 'setup'),
  ('troubleshooting', 'support'),
  ('wifi_setup', 'network'),
  ('router_config', 'network')
) AS s(skill_id, category_id)
WHERE u.email = 'georgy.butaev@revamp-it.ch'
ON CONFLICT DO NOTHING;

-- Skills for Test Admin
INSERT INTO user_skills (user_id, skill_id, category_id)
SELECT u.id, s.skill_id, s.category_id
FROM users u
CROSS JOIN (VALUES
  ('os_installation', 'setup'),
  ('linux_install', 'setup'),
  ('software_setup', 'setup'),
  ('data_recovery', 'data'),
  ('backup_setup', 'data'),
  ('data_migration', 'data'),
  ('troubleshooting', 'support')
) AS s(skill_id, category_id)
WHERE u.email = 'testadmin@revamp-it.ch'
ON CONFLICT DO NOTHING;

-- Skills for Staff Test
INSERT INTO user_skills (user_id, skill_id, category_id)
SELECT u.id, s.skill_id, s.category_id
FROM users u
CROSS JOIN (VALUES
  ('wifi_setup', 'network'),
  ('router_config', 'network'),
  ('network_troubleshooting', 'network'),
  ('smart_home', 'network'),
  ('troubleshooting', 'support'),
  ('remote_support', 'support'),
  ('training', 'support')
) AS s(skill_id, category_id)
WHERE u.email = 'stafftest@revamp-it.ch'
ON CONFLICT DO NOTHING;
