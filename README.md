# restaurants_reservation_api

**Before you start make sure you have installed:**

- [NodeJS](https://www.npmjs.com/) that includes `npm`
- [PostgreSQL](https://www.postgresql.org/)




**Before using the api for the first time:**

- Create the .env file
- Install the dependencies
- Create the needed tables in your database
- Insert the timeslots of table reservation to the database




How to create the .env file:
- Create a new file in the root folder and name it: '.env'
- Write the environment variables of your environment (see the image) 
 <br> ![image](https://user-images.githubusercontent.com/48700453/128815877-365e5761-4ad8-439c-a76c-3f71c84c2fff.png)
- Save the file


How to install the dependencies:
- Run the following command
```bash
npm install
```

 How to create the needed tables in your database:
 - Run the following queries in your RDBMS
 ```bash
CREATE TABLE employees (employee_id serial PRIMARY KEY, employee_number INT UNIQUE NOT NULL,employee_name VARCHAR ( 50 ) NOT NULL, password VARCHAR ( 128 ) NOT NULL);
CREATE TABLE reservation_timeslots (reservation_timeslot_id serial PRIMARY KEY, start_at TIME NOT NULL, end_at TIME NOT NULL);
CREATE TABLE tables (table_id serial PRIMARY KEY, number_of_chairs INT NOT NULL, is_active bool NOT NULL);
CREATE TABLE reservations (reservation_id serial PRIMARY KEY, reservation_timeslot_id INT NOT NULL, table_id INT NOT NULL, reservation_date DATE NOT NULL);
```
Note: SQL file is included<br><br>


How to insert the timeslots of table reservation to the database:
- Run the following query in your RDBMS to insert reservation timeslot
 ```bash
INSERT INTO reservation_timeslots (start_at, end_at) VALUES ([TIME value], [TIME value]);
```
Example:
 ```bash
INSERT INTO reservation_timeslots (start_at, end_at) VALUES ('12:30', '13:45');
```




**API functions**
- /login
- /signup
- /check_timeslotes
- /new_reservation
- /get_reservation
- /delete_reservation


/login 
- Funtion type: post
- Function parameters: employee_number, password
- return: token
- ![algorithim 1](https://user-images.githubusercontent.com/48700453/128823622-8586deca-8bd3-4f6b-9f5c-9ca2a7382a6f.jpg)
<br> <br>

/signup
- Funtion type: post
- Function parameters: employee_number, employee_number, password
- return: token
- ![algorithim 1 (1)](https://user-images.githubusercontent.com/48700453/128828790-1cb97eac-9e95-47c7-9e40-6a876d023141.jpg)
<br> <br>

/check_timeslotes
- Funtion type: get
- Function parameters: token, number_of_chairs
- return: available reservations data
- ![algorithim 1 (3)](https://user-images.githubusercontent.com/48700453/128828848-033296eb-f2ac-4334-b956-dd23ddd4ab66.jpg)
<br> <br>

/new_reservation
- Funtion type: post
- Function parameters: token, reservation_timeslot_id, table_id
- return: success / fail
- ![algorithim 1 (4)](https://user-images.githubusercontent.com/48700453/128828892-542a3b8e-6c24-46f6-a85e-b5d100a1d5f9.jpg)
<br> <br>

/get_reservation
- Funtion type: get
- Function parameters: token, page_number (page of results), is_ascending ('true' or 'false')
- return: a page of reservations data of today that sorted ascending or descending that has up to 10 results, hasNextPage (a bool that showes if their is a next page pf results)
- ![algorithim 1](https://user-images.githubusercontent.com/48700453/128828944-3b801cf7-966e-4feb-9962-6eeeac66b71a.png)
<br> <br>

/delete_reservation
- Funtion type: delete
- Function parameters: token, reservation_id 
- return: 'success' / 'no such data reservation'
- ![algorithim 1 (5)](https://user-images.githubusercontent.com/48700453/128829018-255e94e4-4af0-4d76-9214-fb2eca20de7e.jpg)

<br> <br>
