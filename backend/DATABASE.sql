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

--AUTHENTICATION

CREATE TABLE tblUser (
	id INT PRIMARY KEY IDENTITY(1, 1),
	email NVARCHAR(50) NOT NULL UNIQUE,
	username VARCHAR(30) NOT NULL UNIQUE,
	phone_number VARCHAR(12) NOT NULL UNIQUE,
	password VARCHAR(50) NOT NULL,
	persistent_cookie VARCHAR(255),
	google_id VARCHAR(255),
	is_admin BIT DEFAULT 0,
	display_name NVARCHAR(50),
	date_of_birth DATE,
	bio NVARCHAR(255),
	gender TINYINT CHECK (gender IN (0, 1, 2)),
	status BIT NOT NULL DEFAULT 1
);

---------------TRIGGER FOR SOFT DELETE USER---------------

CREATE TRIGGER trg_SoftDelete_User
ON tblUser
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @deletedUsers TABLE (id INT);
    INSERT INTO @deletedUsers(id)
    SELECT id FROM inserted WHERE status = 0 AND id IN (SELECT id FROM deleted WHERE status = 1);

    -- POST
    UPDATE tblPost SET status = 0 WHERE owner_id IN (SELECT id FROM @deletedUsers);

    -- FRIENDSHIP
    UPDATE tblFriendship SET status = 0 
    WHERE user_id IN (SELECT id FROM @deletedUsers) OR friend_id IN (SELECT id FROM @deletedUsers);

    -- FOLLOW
    UPDATE tblFollow SET status = 0 
    WHERE follower_id IN (SELECT id FROM @deletedUsers) OR followee_id IN (SELECT id FROM @deletedUsers);

    -- BLOCK
    UPDATE tblBlock SET status = 0 
    WHERE user_id IN (SELECT id FROM @deletedUsers) OR blocked_user_id IN (SELECT id FROM @deletedUsers);

    -- STORY
    UPDATE tblStory SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);
    UPDATE tblStoryViewer SET status = 0 WHERE viewer_id IN (SELECT id FROM @deletedUsers);
    UPDATE tblStoryReply SET status = 0 
    WHERE sender_id IN (SELECT id FROM @deletedUsers) 
       OR story_id IN (SELECT id FROM tblStory WHERE user_id IN (SELECT id FROM @deletedUsers));

    -- CHAT MEMBER
    UPDATE tblChatMember SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- MESSAGE
    UPDATE tblMessage SET content = NULL 
    WHERE sender_id IN (SELECT id FROM @deletedUsers);

    -- COMMENT
    UPDATE tblComment SET content = NULL 
    WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- SAVED / HIDDEN POST
    UPDATE tblSavedPost SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);
    UPDATE tblHiddenPost SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);
    UPDATE tblPostTag SET status = 0 WHERE tagged_user_id IN (SELECT id FROM @deletedUsers);

    -- ACTIVITY LOG
    UPDATE tblActivityLog SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- NOTIFICATION
    UPDATE tblNotification SET read_status = 'read' 
    WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- GROUP MEMBER
    UPDATE tblGroupMember SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- PAGE (không có member nên chỉ cần cập nhật owner page)
    UPDATE tblPage SET status = 0 WHERE owner_id IN (SELECT id FROM @deletedUsers);

    -- REPORT
    UPDATE tblReport SET status = 0 WHERE reporter_id IN (SELECT id FROM @deletedUsers);

    -- REACTION
    UPDATE tblReaction SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);

    -- ACCOUNT UPGRADE
    UPDATE tblAccountUpgrade SET status = 0 WHERE user_id IN (SELECT id FROM @deletedUsers);
END

------------------------------------------------------------

CREATE TABLE tblSession (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	device TEXT,
	ip_address TEXT,
	created_at DATETIME DEFAULT GETDATE(),
	expired_time DATETIME,
	status BIT DEFAULT 1
);

CREATE TABLE tblPasswordReset (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	token VARCHAR(255),
	token_expire_time DATETIME,
	is_used BIT DEFAULT 0,
	status BIT DEFAULT 1
);

--SOCIAL RELATIONSHIP

CREATE TABLE tblFriendship (
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	friend_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	friendship_status VARCHAR(10) CHECK (friendship_status IN ('pending', 'accepted', 'rejected')),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (user_id, friend_id),
	CHECK (user_id <> friend_id)
);

CREATE TABLE tblFollow (
	follower_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	followee_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE tblBlock (
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	blocked_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (user_id, blocked_user_id)
);

--------------PROC VALIDATE AND ADD FRIEND--------------

CREATE PROCEDURE sp_SendFriendRequest
    @user_id INT,
    @friend_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Không gửi lời mời bản thân
    IF @user_id = @friend_id
    BEGIN
        RAISERROR('Cannot send friend request to yourself.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem đã có record chưa
    IF EXISTS (
        SELECT 1 FROM tblFriendship
        WHERE (user_id = @user_id AND friend_id = @friend_id) OR
              (user_id = @friend_id AND friend_id = @user_id)
    )
    BEGIN
        RAISERROR('Friend request or friendship already exists.', 16, 1);
        RETURN;
    END

    -- Thêm record với trạng thái pending
    INSERT INTO tblFriendship(user_id, friend_id, friendship_status, created_at, status)
    VALUES (@user_id, @friend_id, 'pending', GETDATE(), 1);
END;
------------------------------------------

--STORY

CREATE TABLE tblStory (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	created_at DATETIME DEFAULT GETDATE(),
	expire_time AS DATEADD(HOUR, 24, created_at) PERSISTED,
	caption NVARCHAR(255),
	media_url VARCHAR(255),
	media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
	background_color VARCHAR(20),
	status BIT DEFAULT 1
);

CREATE TABLE tblStoryViewer (
	story_id INT NOT NULL FOREIGN KEY REFERENCES tblStory(id),
	viewer_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	view_time DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (story_id, viewer_id)
);

CREATE TABLE tblStoryReply (
	id INT PRIMARY KEY IDENTITY(1, 1),
	story_id INT NOT NULL FOREIGN KEY REFERENCES tblStory(id),
	sender_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	message VARCHAR(255),
	sent_time DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

--POST

CREATE TABLE tblPost (
	id INT PRIMARY KEY IDENTITY(1, 1),
	owner_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	created_at DATETIME DEFAULT GETDATE(),
	content NVARCHAR(MAX),
	visibility VARCHAR(20) CHECK (visibility IN ('public', 'friends', 'only_me', 'custom')) NOT NULL,
	media_url VARCHAR(255),
	status BIT DEFAULT 1
);

CREATE TABLE tblComment (
	id INT PRIMARY KEY IDENTITY(1, 1),
	parent_comment_id INT NULL,
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
	content NVARCHAR(1000),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	CONSTRAINT FK_Comment_Parent FOREIGN KEY (parent_comment_id) REFERENCES tblComment(id) 
);

CREATE TABLE tblSavedPost (
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
	save_time DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (user_id, post_id)
);

CREATE TABLE tblHiddenPost (
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
	hidden_time DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1,
	PRIMARY KEY (user_id, post_id)
);

CREATE TABLE tblPostTag (
	id INT PRIMARY KEY IDENTITY(1, 1),
	post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
	tagged_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	status BIT DEFAULT 1
);

--CHAT

CREATE TABLE tblChat (
	id INT PRIMARY KEY IDENTITY(1, 1),
	is_group BIT DEFAULT 0,
	name NVARCHAR(100) NOT NULL,
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);
--------------PROC VALIDATE AND CREATE POST--------------

CCREATE PROCEDURE sp_CreatePost
    @owner_id INT,
    @content NVARCHAR(MAX),
    @visibility VARCHAR(20),
    @media_url VARCHAR(255) = NULL,
    @tagged_user_ids NVARCHAR(MAX) = NULL,  -- Danh sách user_id được tag, dạng '1,2,3'
    @new_post_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra owner_id có tồn tại và active không
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @owner_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive owner_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra content không rỗng
    IF @content IS NULL OR LTRIM(RTRIM(@content)) = ''
    BEGIN
        RAISERROR('Content cannot be empty.', 16, 1);
        RETURN;
    END

    -- Kiểm tra visibility hợp lệ
    IF @visibility NOT IN ('public', 'friends', 'only_me', 'custom')
    BEGIN
        RAISERROR('Invalid visibility value.', 16, 1);
        RETURN;
    END

    -- Thêm bài viết mới
    INSERT INTO tblPost (owner_id, content, visibility, media_url, created_at, status)
    VALUES (@owner_id, @content, @visibility, @media_url, GETDATE(), 1);

    -- Lấy ID bài viết vừa thêm
    SET @new_post_id = SCOPE_IDENTITY();

    -- Xử lý tag người dùng (nếu có)
    IF @tagged_user_ids IS NOT NULL AND LTRIM(RTRIM(@tagged_user_ids)) <> ''
    BEGIN
        DECLARE @pos INT = 1, @len INT, @id_str VARCHAR(20);
        DECLARE @tagged_user_id INT;

        SET @tagged_user_ids = @tagged_user_ids + ',';  -- Thêm dấu phẩy cuối để dễ tách

        WHILE CHARINDEX(',', @tagged_user_ids, @pos) > 0
        BEGIN
            SET @len = CHARINDEX(',', @tagged_user_ids, @pos) - @pos;
            SET @id_str = SUBSTRING(@tagged_user_ids, @pos, @len);
            SET @pos = CHARINDEX(',', @tagged_user_ids, @pos) + 1;

            -- Chuyển sang INT và kiểm tra tồn tại user
            IF ISNUMERIC(@id_str) = 1
            BEGIN
                SET @tagged_user_id = CAST(@id_str AS INT);
                IF EXISTS (SELECT 1 FROM tblUser WHERE id = @tagged_user_id AND status = 1)
                BEGIN
                    INSERT INTO tblPostTag (post_id, tagged_user_id, status)
                    VALUES (@new_post_id, @tagged_user_id, 1);
                END
            END
        END
    END
END;
------------------------------------------

--------------PROC VALIDATE AND SAVE POST--------------

CREATE PROCEDURE sp_SavePost
    @user_id INT,
    @post_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra user tồn tại và active
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive user_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra post tồn tại và active
    IF NOT EXISTS (SELECT 1 FROM tblPost WHERE id = @post_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive post_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem đã lưu trước đó chưa
    IF EXISTS (SELECT 1 FROM tblSavedPost WHERE user_id = @user_id AND post_id = @post_id AND status = 1)
    BEGIN
        RAISERROR('Post already saved.', 16, 1);
        RETURN;
    END

    -- Nếu đã lưu trước đó mà status = 0, cập nhật lại status = 1 và thời gian
    IF EXISTS (SELECT 1 FROM tblSavedPost WHERE user_id = @user_id AND post_id = @post_id AND status = 0)
    BEGIN
        UPDATE tblSavedPost
        SET status = 1,
            save_time = GETDATE()
        WHERE user_id = @user_id AND post_id = @post_id;
    END
    ELSE
    BEGIN
        -- Thêm mới bản ghi lưu bài viết
        INSERT INTO tblSavedPost (user_id, post_id, save_time, status)
        VALUES (@user_id, @post_id, GETDATE(), 1);
    END
END;
------------------------------------------

--------------PROC VALIDATE AND HIDE POST--------------

CREATE PROCEDURE sp_HidePost
    @user_id INT,
    @post_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra user tồn tại và active
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive user_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra post tồn tại và active
    IF NOT EXISTS (SELECT 1 FROM tblPost WHERE id = @post_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive post_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem đã ẩn trước đó chưa
    IF EXISTS (SELECT 1 FROM tblHiddenPost WHERE user_id = @user_id AND post_id = @post_id AND status = 1)
    BEGIN
        RAISERROR('Post already hidden.', 16, 1);
        RETURN;
    END

    -- Nếu đã ẩn trước đó mà status = 0, cập nhật lại status = 1 và thời gian
    IF EXISTS (SELECT 1 FROM tblHiddenPost WHERE user_id = @user_id AND post_id = @post_id AND status = 0)
    BEGIN
        UPDATE tblHiddenPost
        SET status = 1,
            hidden_time = GETDATE()
        WHERE user_id = @user_id AND post_id = @post_id;
    END
    ELSE
    BEGIN
        -- Thêm mới bản ghi ẩn bài viết
        INSERT INTO tblHiddenPost (user_id, post_id, hidden_time, status)
        VALUES (@user_id, @post_id, GETDATE(), 1);
    END
END;
------------------------------------------

--------------TRIGGER FOR CHECK NAME OF GROUP IS NULL?--------------

CREATE TRIGGER trg_ValidateChatName
ON tblChat
INSTEAD OF INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

	--check if it's a group, name is not null or trim
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE is_group = 1 AND (name IS NULL OR LTRIM(RTRIM(name)) = '')
    )
    BEGIN
        RAISERROR('Name of group is compulsory when is_group = 1.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Insert or update valid data
    IF NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO tblChat (is_group, name, created_at, status)
        SELECT is_group, name, created_at, status
        FROM inserted;
    END
    ELSE
    BEGIN
        UPDATE c
        SET 
            c.is_group = i.is_group,
            c.name = i.name,
            c.created_at = i.created_at,
            c.status = i.status
        FROM tblChat c
        JOIN inserted i ON c.id = i.id;
    END
END;

------------------------------------------

CREATE TABLE tblChatMember (
	chat_id INT NOT NULL FOREIGN KEY REFERENCES tblChat(id),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	joined_at DATETIME DEFAULT GETDATE(),
	is_admin BIT DEFAULT 0,
	is_spam BIT DEFAULT 0,
	status BIT DEFAULT 1,
	PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE tblMessageType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description NVARCHAR(255)
);

CREATE TABLE tblMessage (
	id INT PRIMARY KEY IDENTITY(1, 1),
	chat_id INT NOT NULL FOREIGN KEY REFERENCES tblChat(id),
	sender_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	type_id INT NOT NULL FOREIGN KEY REFERENCES tblMessageType(id),
	content NVARCHAR(MAX),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

CREATE TABLE tblCallSession (
	id INT PRIMARY KEY IDENTITY(1, 1),
	chat_id INT NOT NULL FOREIGN KEY REFERENCES tblChat(id),
	host_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	start_time DATETIME,
	end_time DATETIME,
	status BIT DEFAULT 1
);

--ACTIVITY LOGS

CREATE TABLE tblActionType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description NVARCHAR(255)
);

CREATE TABLE tblActivityLog (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	action_type_id INT NOT NULL FOREIGN KEY REFERENCES tblActionType(id),
	action_time DATETIME DEFAULT GETDATE(),
	ip_address VARCHAR(50),
	device VARCHAR(100),
	status BIT DEFAULT 1
);
---------PROC AUTO ADD LOG ACTIVITY---------
CREATE PROCEDURE sp_LogActivity
    @user_id INT,
    @action_type_id INT,
    @ip_address VARCHAR(50),
    @device VARCHAR(100),
    @status BIT = 1,
    @target_id INT = NULL,
    @target_type NVARCHAR(50) = NULL
AS
BEGIN
    INSERT INTO tblActivityLog (user_id, action_type_id, ip_address, device, status, action_time, target_id, target_type)
    VALUES (@user_id, @action_type_id, @ip_address, @device, @status, GETDATE(), @target_id, @target_type);
END

--NOTIFICATION

CREATE TABLE tblNotificationType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description VARCHAR(255)
);

CREATE TABLE tblNotification (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	type_id INT NOT NULL FOREIGN KEY REFERENCES tblNotificationType(id),
	message NVARCHAR(255),
	created_at DATETIME DEFAULT GETDATE(),
	read_status VARCHAR(20) CHECK (read_status IN ('unread', 'read', 'marked_unread'))
);

CREATE PROCEDURE sp_AddNotification
    @user_id INT,
    @type_id INT,
    @message NVARCHAR(255),
    @target_id INT,
    @target_type_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @is_valid BIT;

    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target for notification.', 16, 1);
        RETURN;
    END

    INSERT INTO tblNotification (
        user_id, type_id, message, create_time, read_status
    )
    VALUES (
        @user_id, @type_id, @message, GETDATE(), 'unread'
    );
END;


--GROUP & PAGE

CREATE TABLE tblGroup (
	id INT PRIMARY KEY IDENTITY(1, 1),
	owner_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	name NVARCHAR(100),
	description NVARCHAR(255),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

CREATE TABLE tblGroupMember (
	group_id INT NOT NULL FOREIGN KEY REFERENCES tblGroup(id),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	join_at DATETIME DEFAULT GETDATE(),
	is_admin BIT DEFAULT 0,
	status BIT DEFAULT 1,
	PRIMARY KEY (group_id, user_id)
);

CREATE TABLE tblPage (
	id INT PRIMARY KEY IDENTITY(1, 1),
	owner_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	name NVARCHAR(100),
	description NVARCHAR(255),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

--TARGET

CREATE TABLE tblTargetType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	code VARCHAR(50)
);
 
---------PROC VALIDATE TARGET EXISTS---------

CREATE PROCEDURE sp_ValidateTargetExists
    @target_id INT,
    @target_type_id INT,
    @is_valid BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @exists BIT = 0;

    -- Tùy vào target_type_id map với bảng nào
    IF @target_type_id = 1 AND EXISTS (SELECT 1 FROM tblPost WHERE id = @target_id AND status = 1)
        SET @exists = 1;
    ELSE IF @target_type_id = 2 AND EXISTS (SELECT 1 FROM tblComment WHERE id = @target_id AND status = 1)
        SET @exists = 1;
    ELSE IF @target_type_id = 3 AND EXISTS (SELECT 1 FROM tblStory WHERE id = @target_id AND status = 1)
        SET @exists = 1;
    -- Tiếp tục với các bảng khác tùy vào dữ liệu add vào 

    SET @is_valid = @exists;
END;
----------------------------------

--REPORT

CREATE TABLE tblReport (
	id INT PRIMARY KEY IDENTITY(1, 1),
	reporter_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	target_id INT NOT NULL,
	target_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id),
	reason NVARCHAR(255),
	report_time DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

----------------PROC FOR ADD REPORT----------------

CREATE PROCEDURE sp_AddReport
    @reporter_id INT,
    @target_id INT,
    @target_type_id INT,
    @reason NVARCHAR(255),
    @status BIT = 1
AS
BEGIN
    DECLARE @is_valid BIT;

    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target_id or target_type_id.', 16, 1);
        RETURN;
    END

    INSERT INTO tblReport (reporter_id, target_id, target_type_id, reason, report_time, status)
    VALUES (@reporter_id, @target_id, @target_type_id, @reason, GETDATE(), @status);
END;
---------------------------------------

--REACTION

CREATE TABLE tblReactionType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description VARCHAR(255),
	status BIT DEFAULT 1
);

CREATE TABLE tblReaction (
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	reaction_type_id INT NOT NULL FOREIGN KEY REFERENCES tblReactionType(id),
	target_id INT NOT NULL,
	target_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id),
	created_at DATETIME DEFAULT GETDATE(),
	PRIMARY KEY (user_id, target_id, target_type_id)
);

CREATE PROCEDURE sp_AddReaction
    @user_id INT,
    @reaction_type_id INT,
    @target_id INT,
    @target_type_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @is_valid BIT;

    -- Kiểm tra target có tồn tại và hợp lệ không
    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target_id or target_type_id.', 16, 1);
        RETURN;
    END

    -- Tránh duplicate reaction
    IF EXISTS (
        SELECT 1 FROM tblReaction 
        WHERE user_id = @user_id AND target_id = @target_id AND target_type_id = @target_type_id
    )
    BEGIN
        RAISERROR('Reaction already exists for this target.', 16, 1);
        RETURN;
    END

    INSERT INTO tblReaction (
        user_id, reaction_type_id, target_id, target_type_id, created_time
    )
    VALUES (
        @user_id, @reaction_type_id, @target_id, @target_type_id, GETDATE()
    );
END;

--ACCOUNT UPGRADE

CREATE TABLE tblUpgradeType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description VARCHAR(255)
);

CREATE TABLE tblAccountUpgrade (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	upgrade_type_id INT NOT NULL FOREIGN KEY REFERENCES tblUpgradeType(id),
	upgrade_at DATETIME DEFAULT GETDATE(),
	expire_time DATETIME,
	status BIT DEFAULT 1
);

--ANALYTICS, BANNED KEYWORD, CONTENT POLICY 

CREATE TABLE tblAnalytics (
	id INT PRIMARY KEY IDENTITY(1, 1),
	field_name VARCHAR(50),
	field_value VARCHAR(100),
	update_time DATETIME,
	status BIT DEFAULT 1
);

CREATE TABLE tblBannedKeyword (
	id INT PRIMARY KEY IDENTITY(1, 1),
	keyword VARCHAR(100),
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);

CREATE TABLE tblContentPolicy (
	id INT PRIMARY KEY IDENTITY(1, 1),
	policy_name NVARCHAR(100),
	description NVARCHAR(255),
	status BIT DEFAULT 1
);

-----ADD DATA FROM HERE------
-----USER DATA-----
INSERT INTO tblUser (
    email, username, phone_number, password,
    persistent_cookie, google_id, is_admin,
    display_name, date_of_birth, bio, gender, status
) VALUES
('admin@gmail.com', 'admin', '0123456789', '123',
 NULL, NULL, 1, N'Admin', '1990-01-01', N'Bio của Admin', 1, 1),

('user1@gmail.com', 'user1', '0900000001', '123',
 NULL, NULL, 0, N'User One', '1990-01-01', N'Bio của user1', 1, 1),

('user2@gmail.com', 'user2', '0900000002', '123',
 NULL, NULL, 0, N'User Two', '1991-02-02', N'Bio của user2', 0, 1),

('user3@gmail.com', 'user3', '0900000003', '123',
 NULL, NULL, 0, N'User Three', '1992-03-03', N'Bio của user3', 2, 1),

('user4@gmail.com', 'user4', '0900000004', '123',
 NULL, NULL, 0, N'User Four', '1993-04-04', N'Bio của user4', 1, 1),

('user5@gmail.com', 'user5', '0900000005', '123',
 NULL, NULL, 0, N'User Five', '1994-05-05', N'Bio của user5', 0, 1);


--/////////////////////////////////////////////
INSERT INTO tblTargetType (name, code) VALUES
('Post', 'POST'),
('Comment', 'COMMENT'),
('Story', 'STORY'),
('User', 'USER'),
('Group', 'GROUP'),
('Page', 'PAGE'),
('Message', 'MESSAGE'),
('Call', 'CALL'),
('Notification', 'NOTIFICATION'),
('Report', 'REPORT');

INSERT INTO tblReactionType (name, description, status) VALUES
('Like', 'Thumbs up icon', 1),
('Love', 'Heart icon', 1),
('Haha', 'Laughing face icon', 1),
('Wow', 'Surprised face icon', 1),
('Sad', 'Sad face icon', 1),
('Angry', 'Angry face icon', 1),
('Support', 'Supportive reaction', 1),
('Dislike', 'Thumbs down icon', 1),
('Question', 'Question mark icon', 1),
('Celebrate', 'Cheers icon', 1);

INSERT INTO tblReport (reporter_id, target_id, target_type_id, reason, report_time, status) VALUES
(2, 1, 1, 'Inappropriate content', '2023-01-15 09:30:00', 1),
(3, 5, 2, 'Offensive comment', '2023-01-16 14:15:00', 1),
(1, 3, 3, 'Sensitive content in story', '2023-01-17 18:45:00', 1),
(4, 2, 4, 'Fake user profile', '2023-01-18 10:20:00', 1),
(5, 1, 5, 'Group contains illegal content', '2023-01-19 16:30:00', 1),
(2, 4, 6, 'Scam page', '2023-01-20 11:10:00', 1),
(3, 2, 7, 'Spam message', '2023-01-21 13:25:00', 1),
(1, 1, 8, 'Harassment call', '2023-01-22 15:40:00', 1),
(4, 3, 9, 'Fake notification', '2023-01-23 09:05:00', 1),
(5, 2, 10, 'False report', '2023-01-24 17:50:00', 1);

INSERT INTO tblReaction (user_id, reaction_type_id, target_id, target_type_id, created_at) VALUES
(1, 1, 1, 1, '2023-01-15 08:30:00'),
(2, 2, 1, 1, '2023-01-15 09:15:00'),
(3, 3, 2, 2, '2023-01-16 10:20:00'),
(4, 1, 3, 3, '2023-01-17 11:45:00'),
(5, 4, 4, 4, '2023-01-18 12:30:00'),
(1, 5, 5, 5, '2023-01-19 13:15:00'),
(2, 6, 1, 6, '2023-01-20 14:20:00'),
(3, 7, 2, 7, '2023-01-21 15:35:00'),
(4, 8, 3, 8, '2023-01-22 16:40:00'),
(5, 9, 4, 9, '2023-01-23 17:55:00');

