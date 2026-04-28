-- PERFORMANS OPTİMİZASYONU: Database Index'leri
-- Bu index'ler büyük veri setlerinde sorgu performansını önemli ölçüde artırır

-- Proje tabloları için index'ler
CREATE INDEX IF NOT EXISTS idx_project_accommodation_items_project_id 
ON project_accommodation_items(project_id);

CREATE INDEX IF NOT EXISTS idx_project_accommodation_items_check_in_date 
ON project_accommodation_items(check_in_date);

CREATE INDEX IF NOT EXISTS idx_project_sales_items_project_id 
ON project_sales_items(project_id);

CREATE INDEX IF NOT EXISTS idx_project_sales_items_main_category 
ON project_sales_items(main_category);

CREATE INDEX IF NOT EXISTS idx_project_purchase_items_project_id 
ON project_purchase_items(project_id);

CREATE INDEX IF NOT EXISTS idx_project_purchase_items_main_category 
ON project_purchase_items(main_category);

CREATE INDEX IF NOT EXISTS idx_project_users_project_id 
ON project_users(project_id);

CREATE INDEX IF NOT EXISTS idx_project_users_user_id 
ON project_users(user_id);

CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_project_id 
ON project_hotel_extras(project_id);

CREATE INDEX IF NOT EXISTS idx_project_transfers_project_id 
ON project_transfers(project_id);

CREATE INDEX IF NOT EXISTS idx_project_events_activities_project_id 
ON project_events_activities(project_id);

CREATE INDEX IF NOT EXISTS idx_project_human_resources_project_id 
ON project_human_resources(project_id);

-- Kategoriler için index'ler
CREATE INDEX IF NOT EXISTS idx_categories_parent_id 
ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order 
ON categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_is_active 
ON categories(is_active) WHERE is_active = true;

-- Composite index'ler (çoklu alan sorguları için)
CREATE INDEX IF NOT EXISTS idx_categories_parent_sort 
ON categories(parent_id, sort_order) WHERE parent_id IS NOT NULL;

-- Projeler için index'ler
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status);

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_agency_id 
ON projects(agency_id) WHERE agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_hotel_id 
ON projects(hotel_id) WHERE hotel_id IS NOT NULL;

-- Kullanıcılar için index'ler
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_active 
ON users(is_active) WHERE is_active = true;

-- Sejour tabloları için index'ler (büyük veri setleri için kritik)
CREATE INDEX IF NOT EXISTS idx_sejours_status 
ON sejours(status);

CREATE INDEX IF NOT EXISTS idx_sejours_created_at 
ON sejours(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sejours_check_in_date 
ON sejours(check_in_date);

CREATE INDEX IF NOT EXISTS idx_sejours_check_out_date 
ON sejours(check_out_date);

-- Sejour accommodation items için index'ler
CREATE INDEX IF NOT EXISTS idx_sejour_accommodation_items_sejour_id 
ON sejour_accommodation_items(sejour_id);

CREATE INDEX IF NOT EXISTS idx_sejour_accommodation_items_check_in_date 
ON sejour_accommodation_items(check_in_date);

-- Teklifler için index'ler
CREATE INDEX IF NOT EXISTS idx_quotes_status 
ON quotes(status);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at 
ON quotes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id 
ON quote_items(quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_items_main_category 
ON quote_items(main_category);

-- Acenteler ve oteller için index'ler
CREATE INDEX IF NOT EXISTS idx_agencies_name 
ON agencies(name);

CREATE INDEX IF NOT EXISTS idx_hotels_name 
ON hotels(name);

CREATE INDEX IF NOT EXISTS idx_hotels_city 
ON hotels(city) WHERE city IS NOT NULL;

-- Tedarikçiler için index'ler
CREATE INDEX IF NOT EXISTS idx_suppliers_name 
ON suppliers(name);

CREATE INDEX IF NOT EXISTS idx_suppliers_active 
ON suppliers(is_active) WHERE is_active = true;

-- NOT: Bu index'ler veri yazma performansını biraz düşürebilir ama okuma performansını çok artırır
-- Büyük veri setlerinde (10,000+ kayıt) bu trade-off kesinlikle değer

