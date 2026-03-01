CREATE DATABASE orders;
go

USE orders;
go

DROP TABLE review;
DROP TABLE shipment;
DROP TABLE productinventory;
DROP TABLE warehouse;
DROP TABLE orderproduct;
DROP TABLE incart;
DROP TABLE product;
DROP TABLE category;
DROP TABLE ordersummary;
DROP TABLE paymentmethod;
DROP TABLE customer;


CREATE TABLE customer (
    customerId          INT IDENTITY,
    firstName           VARCHAR(40),
    lastName            VARCHAR(40),
    email               VARCHAR(50),
    phonenum            VARCHAR(20),
    address             VARCHAR(50),
    city                VARCHAR(40),
    state               VARCHAR(20),
    postalCode          VARCHAR(20),
    country             VARCHAR(40),
    userid              VARCHAR(20),
    password            VARCHAR(30),
    PRIMARY KEY (customerId)
);

CREATE TABLE paymentmethod (
    paymentMethodId     INT IDENTITY,
    paymentType         VARCHAR(20),
    paymentNumber       VARCHAR(30),
    paymentExpiryDate   DATE,
    customerId          INT,
    PRIMARY KEY (paymentMethodId),
    FOREIGN KEY (customerId) REFERENCES customer(customerid)
        ON UPDATE CASCADE ON DELETE CASCADE 
);

CREATE TABLE ordersummary (
    orderId             INT IDENTITY,
    orderDate           DATETIME,
    totalAmount         DECIMAL(10,2),
    shiptoAddress       VARCHAR(50),
    shiptoCity          VARCHAR(40),
    shiptoState         VARCHAR(20),
    shiptoPostalCode    VARCHAR(20),
    shiptoCountry       VARCHAR(40),
    customerId          INT,
    PRIMARY KEY (orderId),
    FOREIGN KEY (customerId) REFERENCES customer(customerid)
        ON UPDATE CASCADE ON DELETE CASCADE 
);

CREATE TABLE category (
    categoryId          INT IDENTITY,
    categoryName        VARCHAR(50),    
    PRIMARY KEY (categoryId)
);

CREATE TABLE product (
    productId           INT IDENTITY,
    productName         VARCHAR(40),
    productPrice        DECIMAL(10,2),
    productImageURL     VARCHAR(100),
    productImage        VARBINARY(MAX),
    productDesc         VARCHAR(1000),
    categoryId          INT,
    PRIMARY KEY (productId),
    FOREIGN KEY (categoryId) REFERENCES category(categoryId)
);

CREATE TABLE orderproduct (
    orderId             INT,
    productId           INT,
    quantity            INT,
    price               DECIMAL(10,2),  
    PRIMARY KEY (orderId, productId),
    FOREIGN KEY (orderId) REFERENCES ordersummary(orderId)
        ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (productId) REFERENCES product(productId)
        ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE incart (
    orderId             INT,
    productId           INT,
    quantity            INT,
    price               DECIMAL(10,2),  
    PRIMARY KEY (orderId, productId),
    FOREIGN KEY (orderId) REFERENCES ordersummary(orderId)
        ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (productId) REFERENCES product(productId)
        ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE warehouse (
    warehouseId         INT IDENTITY,
    warehouseName       VARCHAR(30),    
    PRIMARY KEY (warehouseId)
);

CREATE TABLE shipment (
    shipmentId          INT IDENTITY,
    shipmentDate        DATETIME,   
    shipmentDesc        VARCHAR(100),   
    warehouseId         INT, 
    PRIMARY KEY (shipmentId),
    FOREIGN KEY (warehouseId) REFERENCES warehouse(warehouseId)
        ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE productinventory ( 
    productId           INT,
    warehouseId         INT,
    quantity            INT,
    price               DECIMAL(10,2),  
    PRIMARY KEY (productId, warehouseId),   
    FOREIGN KEY (productId) REFERENCES product(productId)
        ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (warehouseId) REFERENCES warehouse(warehouseId)
        ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE review (
    reviewId            INT IDENTITY,
    reviewRating        INT,
    reviewDate          DATETIME,   
    customerId          INT,
    productId           INT,
    reviewComment       VARCHAR(1000),          
    PRIMARY KEY (reviewId),
    FOREIGN KEY (customerId) REFERENCES customer(customerId)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES product(productId)
        ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO category(categoryName) VALUES ('Clothing');
INSERT INTO category(categoryName) VALUES ('Accessories');
INSERT INTO category(categoryName) VALUES ('Winter Clothing');
INSERT INTO category(categoryName) VALUES ('Blankets');
INSERT INTO category(categoryName) VALUES ('Soft Toys');
INSERT INTO category(categoryName) VALUES ('Stationary');

INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Sweater', 1, 'Woolly knit sweater',25.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Socks',1,'3 pairs of Woolly socks',15.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Cardigan',1,'A warm cardigan',20.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Turtleneck shirt',1,'Woolly turtleneck shirt',22.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Bead bracelet',2,'Bracelet made from beads',5.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Seashell bracelet',2,'Bracelet made with seashells',5.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Earrings',2,'Set of earrings to wear',6.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Bag',2,'A handmade bag',16.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Gloves',3,'Warm woolly gloves',12.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Hat',3,'Warm woolly winter hat',12.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Long Scarf',3,'Very long woolly scarf that is very long',25.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Sherpa fluffy blanket',4,'A very long blanket to wrap yourself in',45.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Woolly Blanket',4,'A very long blanket to wrap yourself in',100.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Teddy bear soft toy',5,'Cuddly teddy bear',20.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Rabbit soft toy',5,'Cuddly rabbit',20.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Giant teddy bear',5,'The biggest teddy bear to cuddle',60.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Bookmark',6,'Handmade bookmark for your books',4.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Notebook',6,'A book for writing',10.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Set of 10 pens',6,'Pens for writing',12.00);
INSERT product(productName, categoryId, productDesc, productPrice) VALUES ('Set of 20 postal cards and envelopes',6,'Cards to write letters to friends',15.50);


INSERT INTO warehouse(warehouseName) VALUES ('Vancouver warehouse');
INSERT INTO warehouse(warehouseName) VALUES ('Kelowna Warehouse');
INSERT INTO warehouse(warehouseName) VALUES ('Edmonton warehouse');
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (1, 1, 20, 18);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (2, 1, 20, 19);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (3, 1, 20, 10);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (4, 1, 25, 22);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (5, 1, 23, 21.35);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (6, 1, 33, 25);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (7, 2, 18, 30);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (8, 2, 20, 40);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (9, 2, 27, 97);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (11, 2, 31, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (12, 2, 21, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (13, 2, 26, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (14, 2, 23, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (15, 3, 26, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (16, 3, 28, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (17, 3, 36, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (18, 3, 15, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (19, 3, 29, 31);
INSERT INTO productInventory(productId, warehouseId, quantity, price) VALUES (20, 3, 21, 31);



INSERT INTO customer (firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid, password) VALUES ('Arnold', 'Anderson', 'a.anderson@gmail.com', '204-111-2222', '103 AnyWhere Street', 'Winnipeg', 'MB', 'R3X 45T', 'Canada', 'arnold' , '304Arnold!');
INSERT INTO customer (firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid, password) VALUES ('Bobby', 'Brown', 'bobby.brown@hotmail.ca', '572-342-8911', '222 Bush Avenue', 'Boston', 'MA', '22222', 'United States', 'bobby' , '304Bobby!');
INSERT INTO customer (firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid, password) VALUES ('Candace', 'Cole', 'cole@charity.org', '333-444-5555', '333 Central Crescent', 'Chicago', 'IL', '33333', 'United States', 'candace' , '304Candace!');
INSERT INTO customer (firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid, password) VALUES ('Darren', 'Doe', 'oe@doe.com', '250-807-2222', '444 Dover Lane', 'Kelowna', 'BC', 'V1V 2X9', 'Canada', 'darren' , '304Darren!');
INSERT INTO customer (firstName, lastName, email, phonenum, address, city, state, postalCode, country, userid, password) VALUES ('Elizabeth', 'Elliott', 'engel@uiowa.edu', '555-666-7777', '555 Everwood Street', 'Iowa City', 'IA', '52241', 'United States', 'beth' , '304Beth!');

-- Order 1 can be shipped as have enough inventory
DECLARE @orderId int
INSERT INTO ordersummary (customerId, orderDate, totalAmount) VALUES (1, '2019-10-15 10:25:55', 91.70)
SELECT @orderId = @@IDENTITY
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 1, 1, 18)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 5, 2, 21.35)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 10, 1, 31);

INSERT INTO ordersummary (customerId, orderDate, totalAmount) VALUES (2, '2019-10-16 18:00:00', 106.75)
SELECT @orderId = @@IDENTITY
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 5, 5, 21.35);

-- Order 3 cannot be shipped as do not have enough inventory for item 7
INSERT INTO ordersummary (customerId, orderDate, totalAmount) VALUES (3, '2019-10-15 3:30:22', 140)
SELECT @orderId = @@IDENTITY
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 6, 2, 25)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 7, 3, 30);

INSERT INTO ordersummary (customerId, orderDate, totalAmount) VALUES (2, '2019-10-17 05:45:11', 327.85)
SELECT @orderId = @@IDENTITY
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 3, 4, 10)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 8, 3, 40)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 13, 3, 23.25)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 15, 2, 21.05)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 18, 4, 14);

INSERT INTO ordersummary (customerId, orderDate, totalAmount) VALUES (5, '2019-10-15 10:25:55', 277.40)
SELECT @orderId = @@IDENTITY
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 5, 4, 21.35)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 19, 2, 81)
INSERT INTO orderproduct (orderId, productId, quantity, price) VALUES (@orderId, 20, 3, 10);

-- New SQL DDL for lab 8
UPDATE Product SET productImageURL = 'img/1.jpg' WHERE ProductId = 1;
UPDATE Product SET productImageURL = 'img/2.jpg' WHERE ProductId = 2;
UPDATE Product SET productImageURL = 'img/3.jpg' WHERE ProductId = 3;
UPDATE Product SET productImageURL = 'img/4.jpg' WHERE ProductId = 4;
UPDATE Product SET productImageURL = 'img/5.jpg' WHERE ProductId = 5;
UPDATE Product SET productImageURL = 'img/6.jpg' WHERE ProductId = 6;
UPDATE Product SET productImageURL = 'img/7.jpg' WHERE ProductId = 7;
UPDATE Product SET productImageURL = 'img/8.jpg' WHERE ProductId = 8;
UPDATE Product SET productImageURL = 'img/9.jpg' WHERE ProductId = 9;
UPDATE Product SET productImageURL = 'img/10.jpg' WHERE ProductId = 10;
UPDATE Product SET productImageURL = 'img/11.jpg' WHERE ProductId = 11;
UPDATE Product SET productImageURL = 'img/12.jpg' WHERE ProductId = 12;
UPDATE Product SET productImageURL = 'img/13.jpg' WHERE ProductId = 13;
UPDATE Product SET productImageURL = 'img/14.jpg' WHERE ProductId = 14;
UPDATE Product SET productImageURL = 'img/15.jpg' WHERE ProductId = 15;
UPDATE Product SET productImageURL = 'img/16.jpg' WHERE ProductId = 16;
UPDATE Product SET productImageURL = 'img/17.jpg' WHERE ProductId = 17;
UPDATE Product SET productImageURL = 'img/18.jpg' WHERE ProductId = 18;
UPDATE Product SET productImageURL = 'img/19.jpg' WHERE ProductId = 19;
UPDATE Product SET productImageURL = 'img/20.jpg' WHERE ProductId = 20;


