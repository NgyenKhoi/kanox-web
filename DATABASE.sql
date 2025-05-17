USE master
IF EXISTS(select * from sys.databases where name='SOCIAL-MEDIA-PROJECT')
BEGIN
	ALTER DATABASE [SOCIAL-MEDIA-PROJECT] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
	DROP DATABASE [SOCIAL-MEDIA-PROJECT]
END
CREATE DATABASE [SOCIAL-MEDIA-PROJECT]
GO
USE [SOCIAL-MEDIA-PROJECT]
GO
CREATE TABLE tblUser
(
	id int PRIMARY KEY IDENTITY(1, 1),
	email nvarchar(50) NOT NULL UNIQUE,
	username varchar(30) NOT NULL UNIQUE,
	phoneNumber varchar(12) not null UNIQUE,
	password varchar(50) NOT NULL,
	persistentCookie varchar(255),
	googleId varchar(255),	
	isAdmin bit DEFAULT 0,
	displayName nvarchar(50),
	dateOfBirth date,
	status bit NOT NULL DEFAULT 1,
	bio nvarchar(255),
	gender bit NOT NULL,
)

create table tblSession (
id int PRIMARY KEY IDENTITY(1, 1),
device varchar(255) not null,
ipAddress varchar(255) not null,
createdTime DATETIME NOT NULL DEFAULT GETDATE(),
expiredTime DATETIME NOT NULL DEFAULT GETDATE(),
)