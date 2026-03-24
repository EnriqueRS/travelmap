-- Architecture of the database for TravelMap
-- PostgreSQL with PostGIS

-- Extensions needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    is_public BOOLEAN DEFAULT false,
    theme_preference VARCHAR(20) DEFAULT 'auto', -- 'light', 'dark', 'auto'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries table
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    iso_alpha2 VARCHAR(2) UNIQUE NOT NULL, -- US, MX, ES
    iso_alpha3 VARCHAR(3) UNIQUE NOT NULL, -- USA, MEX, ESP
    name VARCHAR(100) NOT NULL,
    continent VARCHAR(50),
    geometry GEOMETRY(POLYGON, 4326), -- Polygon of the country with PostGIS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'ongoing', 'completed', 'cancelled'
    start_date DATE,
    end_date DATE,
    total_cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    is_public BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(POINT, 4326) NOT NULL, -- Lat/Lng con PostGIS
    country_id INTEGER REFERENCES countries(id),
    visit_date DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50), -- 'city', 'landmark', 'nature', 'restaurant', etc.
    status VARCHAR(20) DEFAULT 'visited', -- 'visited', 'planned', 'wishlist'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    caption TEXT,
    taken_at TIMESTAMP WITH TIME ZONE,
    upload_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerary Days table
CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE,
    title VARCHAR(200),
    notes TEXT,
    weather VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, day_number)
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    activity_type VARCHAR(50), -- 'flight', 'accommodation', 'dining', 'sightseeing', etc.
    cost DECIMAL(8,2),
    booking_reference VARCHAR(100),
    coordinates GEOMETRY(POINT, 4326), -- For activities without location_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklists table
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    checklist_type VARCHAR(50) DEFAULT 'packing', -- 'packing', 'documents', 'tasks'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist Items table
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    item_text VARCHAR(300) NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    quantity INTEGER DEFAULT 1,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--  User Statistics table
CREATE TABLE user_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    countries_visited INTEGER DEFAULT 0,
    total_locations INTEGER DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10,2),
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_trip_id ON locations(trip_id);
CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
CREATE INDEX idx_locations_country_id ON locations(country_id);
CREATE INDEX idx_photos_location_id ON photos(location_id);
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_itinerary_days_trip_id ON itinerary_days(trip_id);
CREATE INDEX idx_activities_itinerary_day_id ON activities(itinerary_day_id);
CREATE INDEX idx_countries_geometry ON countries USING GIST(geometry);

-- Useful views
CREATE VIEW user_trip_summary AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT t.id) as total_trips,
    COUNT(DISTINCT l.country_id) as countries_visited,
    COUNT(DISTINCT l.id) as total_locations,
    COUNT(DISTINCT p.id) as total_photos
FROM users u
LEFT JOIN trips t ON u.id = t.user_id
LEFT JOIN locations l ON u.id = l.user_id
LEFT JOIN photos p ON u.id = p.user_id
GROUP BY u.id, u.username;

--  Function to update statistics
CREATE OR REPLACE FUNCTION update_user_statistics(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_statistics (user_id, countries_visited, total_locations, total_trips)
    VALUES (
        user_uuid,
        (SELECT COUNT(DISTINCT country_id) FROM locations WHERE user_id = user_uuid AND country_id IS NOT NULL),
        (SELECT COUNT(*) FROM locations WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM trips WHERE user_id = user_uuid AND status = 'completed')
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        countries_visited = EXCLUDED.countries_visited,
        total_locations = EXCLUDED.total_locations,
        total_trips = EXCLUDED.total_trips,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;