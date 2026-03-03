CREATE TABLE accident_reports (
	id INTEGER NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	severity VARCHAR NOT NULL, 
	description TEXT, 
	weather VARCHAR, 
	road_condition VARCHAR, 
	vehicle_type VARCHAR, 
	speed FLOAT, 
	time_of_day VARCHAR, 
	traffic_density VARCHAR, 
	reported_at DATETIME, 
	verified BOOLEAN, 
	evidence_files TEXT, 
	PRIMARY KEY (id)
)
CREATE TABLE risk_predictions (
	id INTEGER NOT NULL, 
	latitude FLOAT, 
	longitude FLOAT, 
	risk_score FLOAT, 
	severity VARCHAR, 
	speed FLOAT, 
	weather VARCHAR, 
	road_condition VARCHAR, 
	vehicle_type VARCHAR, 
	time_of_day VARCHAR, 
	traffic_density VARCHAR, 
	shap_values TEXT, 
	predicted_at DATETIME, 
	PRIMARY KEY (id)
)
CREATE TABLE near_misses (
	id INTEGER NOT NULL, 
	latitude FLOAT, 
	longitude FLOAT, 
	near_miss_score FLOAT, 
	pattern_type VARCHAR, 
	vehicle_speed FLOAT, 
	time_gap FLOAT, 
	detected_at DATETIME, 
	PRIMARY KEY (id)
)
CREATE TABLE realtime_alerts (
	id INTEGER NOT NULL, 
	latitude FLOAT, 
	longitude FLOAT, 
	alert_type VARCHAR, 
	severity VARCHAR, 
	message TEXT, 
	active BOOLEAN, 
	created_at DATETIME, 
	expires_at DATETIME, 
	PRIMARY KEY (id)
)
CREATE TABLE route_analyses (
	id INTEGER NOT NULL, 
	start_lat FLOAT, 
	start_lng FLOAT, 
	end_lat FLOAT, 
	end_lng FLOAT, 
	route_polyline TEXT, 
	safety_score FLOAT, 
	total_risk_points INTEGER, 
	high_risk_zones TEXT, 
	analyzed_at DATETIME, 
	PRIMARY KEY (id)
)
CREATE TABLE traffic_reports (
	id INTEGER NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	road VARCHAR, 
	severity VARCHAR, 
	description TEXT, 
	reported_at DATETIME, 
	expires_at DATETIME, 
	PRIMARY KEY (id)
)