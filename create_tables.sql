CREATE TABLE employees (employee_id serial PRIMARY KEY, employee_number INT UNIQUE NOT NULL, employee_name VARCHAR ( 50 ) NOT NULL, password VARCHAR ( 128 ) NOT NULL);

CREATE TABLE reservation_timeslots (reservation_timeslot_id serial PRIMARY KEY, start_at TIME NOT NULL, end_at TIME NOT NULL);

CREATE TABLE tables (table_id serial PRIMARY KEY, number_of_chairs INT NOT NULL, is_active bool NOT NULL);

CREATE TABLE reservations (reservation_id serial PRIMARY KEY, reservation_timeslot_id INT NOT NULL, table_id INT NOT NULL, reservation_date DATE NOT NULL);