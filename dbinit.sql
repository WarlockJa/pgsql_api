CREATE TABLE users (email VARCHAR(255) PRIMARY KEY, password CHAR(60), email_confirmed BOOL, name VARCHAR(255), surname TEXT, picture TEXT, locale char(5), refreshtoken TEXT);
CREATE TABLE todos (id BINARY(16) PRIMARY KEY, useremail VARCHAR(255), title VARCHAR(75), description VARCHAR(255), completed BOOL, reminder BOOL, date_due datetime, date_created datetime DEFAULT CURRENT_TIMESTAMP);