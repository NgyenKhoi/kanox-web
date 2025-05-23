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



CREATE TABLE tblFriendSuggestion (
    user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    suggested_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    mutual_friend_count INT NOT NULL,
    suggested_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (user_id, suggested_user_id)
);

------------PROC FOR SUGGEST FRIEND

CREATE PROCEDURE sp_UpdateFriendSuggestions
AS
BEGIN
    SET NOCOUNT ON;

    -- Xóa gợi ý cũ
    DELETE FROM tblFriendSuggestion;

    -- Gợi ý theo thuật toán bạn của bạn (FOAF)
    INSERT INTO tblFriendSuggestion (user_id, suggested_user_id, mutual_friend_count)
    SELECT
        f1.user_id,
        f2.friend_id AS suggested_user_id,
        COUNT(*) AS mutual_friend_count
    FROM tblFriendship f1
    JOIN tblFriendship f2 ON f1.friend_id = f2.user_id
    WHERE 
        f1.friendship_status = 'accepted'
        AND f2.friendship_status = 'accepted'
        AND f1.user_id <> f2.friend_id -- tránh tự gợi ý chính mình

        -- Chưa là bạn
        AND f2.friend_id NOT IN (
            SELECT friend_id FROM tblFriendship 
            WHERE user_id = f1.user_id AND friendship_status = 'accepted'
        )

        -- Không bị block
        AND f2.friend_id NOT IN (
            SELECT blocked_user_id FROM tblBlock WHERE user_id = f1.user_id
            UNION
            SELECT user_id FROM tblBlock WHERE blocked_user_id = f1.user_id
        )

        -- Không theo dõi nhau
        AND f2.friend_id NOT IN (
            SELECT followee_id FROM tblFollow WHERE follower_id = f1.user_id
        )
    GROUP BY f1.user_id, f2.friend_id;
END;

-------------------

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
-----USER DATA-----
INSERT INTO tblUser (
    email, username, phone_number, password,
    persistent_cookie, google_id, is_admin,
    display_name, date_of_birth, bio, gender, status
) VALUES
      ('admin.@gmail.com', 'admin', '0123456789', '123',
       NULL, NULL, 1, N'Admin Hoang', '1990-01-01', N'Bio của Admin', 1, 1),

      ('minhthu@gmail.com', 'minhthu', '0900000001', '123',
       NULL, NULL, 0, N'Minh Thu', '1990-01-01', N'Bio của Minh Thu', 1, 1),

      ('quocanh@gmail.com', 'quocanh', '0900000002', '123',
       NULL, NULL, 0, N'Quoc Anh', '1991-02-02', N'Bio của Quoc Anh', 0, 1),

      ('thanhnga@gmail.com', 'thanhnga', '0900000003', '123',
       NULL, NULL, 0, N'Thanh Nga', '1992-03-03', N'Bio của Thanh Nga', 2, 1),

      ('baotran@gmail.com', 'baotran', '0900000004', '123',
       NULL, NULL, 0, N'Bao Tran', '1993-04-04', N'Bio của Bao Tran', 1, 1),

      ('khanhlinh@gmail.com', 'khanhlinh', '0900000005', '123',
       NULL, NULL, 0, N'Khanh Linh', '1994-05-05', N'Bio của Khanh Linh', 0, 1),

      ('duylong@gmail.com', 'duylong', '0900000006', '123',
       NULL, NULL, 0, N'Duy Long', '1995-06-06', N'Bio của Duy Long', 1, 1),

      ('thuytrang@gmail.com', 'thuytrang', '0900000007', '123',
       NULL, NULL, 0, N'Thuy Trang', '1996-07-07', N'Bio của Thuy Trang', 0, 1),

      ('anhkhoa@gmail.com', 'anhkhoa', '0900000008', '123',
       NULL, NULL, 0, N'Anh Khoa', '1997-08-08', N'Bio của Anh Khoa', 2, 1),

      ('hongnhung@gmail.com', 'hongnhung', '0900000009', '123',
       NULL, NULL, 0, N'Hong Nhung', '1998-09-09', N'Bio của Hong Nhung', 1, 1),

      ('tuanvu@gmail.com', 'tuanvu', '0900000010', '123',
       NULL, NULL, 0, N'Tuan Vu', '1999-10-10', N'Bio của Tuan Vu', 0, 1),

      ('ngocmai@gmail.com', 'ngocmai', '0900000011', '123',
       NULL, NULL, 0, N'Ngoc Mai', '2000-11-11', N'Bio của Ngoc Mai', 2, 1),

      ('phuocloc@gmail.com', 'phuocloc', '0900000012', '123',
       NULL, NULL, 0, N'Phuoc Loc', '2001-12-12', N'Bio của Phuoc Loc', 1, 1),

      ('thanhbinh@gmail.com', 'thanhbinh', '0900000013', '123',
       NULL, NULL, 0, N'Thanh Binh', '2002-01-13', N'Bio của Thanh Binh', 0, 1),

      ('kieuanh@gmail.com', 'kieuanh', '0900000014', '123',
       NULL, NULL, 0, N'Kieu Anh', '2003-02-14', N'Bio của Kieu Anh', 2, 1),

      ('minhduc@gmail.com', 'minhduc', '0900000015', '123',
       NULL, NULL, 0, N'Minh Duc', '2004-03-15', N'Bio của Minh Duc', 1, 1),

      ('lanhuong@gmail.com', 'lanhuong', '0900000016', '123',
       NULL, NULL, 0, N'Lan Huong', '2005-04-16', N'Bio của Lan Huong', 0, 1),

      ('trunghieu@gmail.com', 'trunghieu', '0900000017', '123',
       NULL, NULL, 0, N'Trung Hieu', '2006-05-17', N'Bio của Trung Hieu', 2, 1),

      ('thuylinh@gmail.com', 'thuylinh', '0900000018', '123',
       NULL, NULL, 0, N'Thuy Linh', '2007-06-18', N'Bio của Thuy Linh', 1, 1),

      ('hoangnam@gmail.com', 'hoangnam', '0900000019', '123',
       NULL, NULL, 0, N'Hoang Nam', '2008-07-19', N'Bio của Hoang Nam', 0, 1);
INSERT INTO tblFriendship (
    user_id, friend_id, friendship_status, created_at, status
) VALUES
      (1, 2, 'accepted', '2025-05-01 10:00:00', 1), -- Admin Hoang và Minh Thu là bạn
      (1, 3, 'pending', '2025-05-02 11:00:00', 1),  -- Admin Hoang gửi lời mời cho Quoc Anh
      (2, 4, 'accepted', '2025-05-03 12:00:00', 1), -- Minh Thu và Thanh Nga là bạn
      (2, 5, 'rejected', '2025-05-04 13:00:00', 1), -- Minh Thu từ chối Bao Tran
      (3, 6, 'pending', '2025-05-05 14:00:00', 1),  -- Quoc Anh gửi lời mời cho Khanh Linh
      (4, 7, 'accepted', '2025-05-06 15:00:00', 1), -- Thanh Nga và Duy Long là bạn
      (5, 8, 'pending', '2025-05-07 16:00:00', 1),  -- Bao Tran gửi lời mời cho Thuy Trang
      (6, 9, 'accepted', '2025-05-08 17:00:00', 1), -- Khanh Linh và Anh Khoa là bạn
      (7, 10, 'rejected', '2025-05-09 18:00:00', 1),-- Duy Long từ chối Hong Nhung
      (8, 11, 'pending', '2025-05-10 19:00:00', 1), -- Thuy Trang gửi lời mời cho Ngoc Mai
      (9, 12, 'accepted', '2025-05-11 20:00:00', 1),-- Anh Khoa và Phuoc Loc là bạn
      (10, 13, 'pending', '2025-05-12 21:00:00', 1),-- Hong Nhung gửi lời mời cho Thanh Binh
      (11, 14, 'accepted', '2025-05-13 22:00:00', 1),-- Ngoc Mai và Kieu Anh là bạn
      (12, 15, 'rejected', '2025-05-14 23:00:00', 1),-- Phuoc Loc từ chối Minh Duc
      (13, 16, 'pending', '2025-05-15 09:00:00', 1), -- Thanh Binh gửi lời mời cho Lan Huong
      (14, 17, 'accepted', '2025-05-16 10:00:00', 1),-- Kieu Anh và Trung Hieu là bạn
      (15, 18, 'pending', '2025-05-17 11:00:00', 1), -- Minh Duc gửi lời mời cho Thuy Linh
      (16, 19, 'accepted', '2025-05-18 12:00:00', 1),-- Lan Huong và Thuy Linh là bạn
      (17, 1, 'rejected', '2025-05-19 13:00:00', 1), -- Trung Hieu từ chối Admin Hoang
      (18, 2, 'pending', '2025-05-20 14:00:00', 1); -- Thuy Linh gửi lời mời cho Minh Thu
INSERT INTO tblFollow (
    follower_id, followee_id, created_at, status
) VALUES
      (2, 1, '2025-05-01 10:00:00', 1),  -- Minh Thu theo dõi Admin Hoang
      (3, 1, '2025-05-02 11:00:00', 1),  -- Quoc Anh theo dõi Admin Hoang
      (4, 2, '2025-05-03 12:00:00', 1),  -- Thanh Nga theo dõi Minh Thu
      (5, 3, '2025-05-04 13:00:00', 1),  -- Bao Tran theo dõi Quoc Anh
      (6, 4, '2025-05-05 14:00:00', 1),  -- Khanh Linh theo dõi Thanh Nga
      (7, 4, '2025-05-06 15:00:00', 1),  -- Duy Long theo dõi Thanh Nga
      (8, 6, '2025-05-07 16:00:00', 1),  -- Thuy Trang theo dõi Khanh Linh
      (9, 7, '2025-05-08 17:00:00', 1),  -- Anh Khoa theo dõi Duy Long
      (10, 9, '2025-05-09 18:00:00', 1), -- Hong Nhung theo dõi Anh Khoa
      (11, 9, '2025-05-10 19:00:00', 1), -- Ngoc Mai theo dõi Anh Khoa
      (12, 11, '2025-05-11 20:00:00', 1),-- Phuoc Loc theo dõi Ngoc Mai
      (13, 12, '2025-05-12 21:00:00', 1),-- Thanh Binh theo dõi Phuoc Loc
      (14, 12, '2025-05-13 22:00:00', 1),-- Kieu Anh theo dõi Phuoc Loc
      (15, 14, '2025-05-14 23:00:00', 1),-- Minh Duc theo dõi Kieu Anh
      (16, 14, '2025-05-15 09:00:00', 1),-- Lan Huong theo dõi Kieu Anh
      (17, 15, '2025-05-16 10:00:00', 1),-- Trung Hieu theo dõi Minh Duc
      (18, 16, '2025-05-17 11:00:00', 1),-- Thuy Linh theo dõi Lan Huong
      (19, 16, '2025-05-18 12:00:00', 1),-- Hoang Nam theo dõi Lan Huong
      (1, 18, '2025-05-19 13:00:00', 1), -- Admin Hoang theo dõi Thuy Linh
      (2, 19, '2025-05-20 14:00:00', 1); -- Minh Thu theo dõi Hoang Nam
INSERT INTO tblBlock (
    user_id, blocked_user_id, created_at, status
) VALUES
      (1, 19, '2025-05-01 10:00:00', 1), -- Admin Hoang chặn Hoang Nam
      (2, 18, '2025-05-02 11:00:00', 1), -- Minh Thu chặn Thuy Linh
      (3, 17, '2025-05-03 12:00:00', 1), -- Quoc Anh chặn Trung Hieu
      (4, 16, '2025-05-04 13:00:00', 1), -- Thanh Nga chặn Lan Huong
      (5, 15, '2025-05-05 14:00:00', 1), -- Bao Tran chặn Minh Duc
      (6, 14, '2025-05-06 15:00:00', 1), -- Khanh Linh chặn Kieu Anh
      (7, 13, '2025-05-07 16:00:00', 1), -- Duy Long chặn Thanh Binh
      (8, 12, '2025-05-08 17:00:00', 1), -- Thuy Trang chặn Phuoc Loc
      (9, 11, '2025-05-09 18:00:00', 1), -- Anh Khoa chặn Ngoc Mai
      (10, 1, '2025-05-10 19:00:00', 1), -- Hong Nhung chặn Admin Hoang
      (11, 2, '2025-05-11 20:00:00', 1), -- Ngoc Mai chặn Minh Thu
      (12, 3, '2025-05-12 21:00:00', 1), -- Phuoc Loc chặn Quoc Anh
      (13, 5, '2025-05-13 22:00:00', 1), -- Thanh Binh chặn Bao Tran
      (14, 6, '2025-05-14 23:00:00', 1), -- Kieu Anh chặn Khanh Linh
      (15, 7, '2025-05-15 09:00:00', 1); -- Minh Duc chặn Duy Long
('user2@gmail.com', 'user2', '0900000002', '123',
 NULL, NULL, 0, N'User Two', '1991-02-02', N'Bio của user2', 0, 1),

('user3@gmail.com', 'user3', '0900000003', '123',
 NULL, NULL, 0, N'User Three', '1992-03-03', N'Bio của user3', 2, 1),

('user4@gmail.com', 'user4', '0900000004', '123',
 NULL, NULL, 0, N'User Four', '1993-04-04', N'Bio của user4', 1, 1),

('user5@gmail.com', 'user5', '0900000005', '123',
 NULL, NULL, 0, N'User Five', '1994-05-05', N'Bio của user5', 0, 1);

INSERT INTO tblGroup (owner_id, name, description, created_at, status)
VALUES
(1, N'Programming Group', N'A place to share programming knowledge', GETDATE(), 1),
(2, N'Book Club', N'Read and review books together', GETDATE(), 1),
(3, N'Travel Group', N'Share travel experiences', GETDATE(), 1),
(4, N'Cooking Group', N'For those who love cooking and cuisine', GETDATE(), 1),
(5, N'Sports Group', N'Discuss about sports', GETDATE(), 1),
(6, N'Music Group', N'Share good music every day', GETDATE(), 1),
(1, N'Tech Group', N'Latest technology news', GETDATE(), 1),
(2, N'English Learning Group', N'Learn English together', GETDATE(), 1),
(3, N'Photography Group', N'Share beautiful photos and techniques', GETDATE(), 1),
(4, N'Movie Group', N'Movie discussions', GETDATE(), 1);

INSERT INTO tblPage (owner_id, name, description, created_at, status)
VALUES
(1, N'Tech News Page', N'Update technology news', GETDATE(), 1),
(2, N'Travel Blog', N'Share travel experiences', GETDATE(), 1),
(3, N'Vietnamese Cuisine', N'Explore delicious Vietnamese food', GETDATE(), 1),
(4, N'Book Review', N'Book reviews and ratings', GETDATE(), 1),
(5, N'Fitness Life', N'Healthy living every day', GETDATE(), 1),
(6, N'Pop Music', N'Top trending pop music', GETDATE(), 1),
(1, N'English Zone', N'Learn English together', GETDATE(), 1),
(2, N'Photo Art', N'Photography art', GETDATE(), 1),
(3, N'Good Movies', N'Introduce good movies', GETDATE(), 1),
(4, N'Creative Corner', N'Creative space for everyone', GETDATE(), 1);

INSERT INTO tblGroupMember (group_id, user_id, join_at, is_admin, status)
VALUES
-- Group 1: owner 1, add user 2, 3
(1, 1, GETDATE(), 1, 1),
(1, 2, GETDATE(), 0, 1),
(1, 3, GETDATE(), 0, 1),
-- Group 2: owner 2, add user 1, 4
(2, 2, GETDATE(), 1, 1),
(2, 1, GETDATE(), 0, 1),
(2, 4, GETDATE(), 0, 1),
-- Group 3: owner 3, add user 2, 5
(3, 3, GETDATE(), 1, 1),
(3, 2, GETDATE(), 0, 1),
(3, 5, GETDATE(), 0, 1),
-- Group 4: owner 4, add user 1, 6
(4, 4, GETDATE(), 1, 1),
(4, 1, GETDATE(), 0, 1),
(4, 6, GETDATE(), 0, 1),
-- Group 5: owner 5, add user 3, 4
(5, 5, GETDATE(), 1, 1),
(5, 3, GETDATE(), 0, 1),
(5, 4, GETDATE(), 0, 1),
-- Group 6: owner 6, add user 2, 5
(6, 6, GETDATE(), 1, 1),
(6, 2, GETDATE(), 0, 1),
(6, 5, GETDATE(), 0, 1),
-- Group 7: owner 1, add user 4, 5
(7, 1, GETDATE(), 1, 1),
(7, 4, GETDATE(), 0, 1),
(7, 5, GETDATE(), 0, 1),
-- Group 8: owner 2, add user 3, 6
(8, 2, GETDATE(), 1, 1),
(8, 3, GETDATE(), 0, 1),
(8, 6, GETDATE(), 0, 1),
-- Group 9: owner 3, add user 1, 2
(9, 3, GETDATE(), 1, 1),
(9, 1, GETDATE(), 0, 1),
(9, 2, GETDATE(), 0, 1),
-- Group 10: owner 4, add user 5, 6
(10, 4, GETDATE(), 1, 1),
(10, 5, GETDATE(), 0, 1),
(10, 6, GETDATE(), 0, 1);