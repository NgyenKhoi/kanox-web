--USE master
--IF EXISTS(select * from sys.databases where name='SOCIAL-MEDIA-PROJECT')
--BEGIN
--	ALTER DATABASE [SOCIAL-MEDIA-PROJECT] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
--	DROP DATABASE [SOCIAL-MEDIA-PROJECT]
--END
--CREATE DATABASE [SOCIAL-MEDIA-PROJECT]
--GO
--USE [SOCIAL-MEDIA-PROJECT]
--GO
--CREATE LOGIN guestuser WITH PASSWORD = 'De190699';
--GO
--CREATE USER guestuser FOR LOGIN guestuser;
--GO
--EXEC sp_addrolemember N'db_owner', N'guestuser';
--GO

--AUTHENTICATION

CREATE TABLE tblUser (
    id INT PRIMARY KEY IDENTITY(1, 1),
    email NVARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(30) NOT NULL UNIQUE,
    phone_number VARCHAR(12) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    persistent_cookie VARCHAR(255),
    google_id VARCHAR(255),
    is_admin BIT DEFAULT 0,
    display_name NVARCHAR(50),
    date_of_birth DATE,
    bio NVARCHAR(255),
    gender TINYINT CHECK (gender IN (0, 1, 2)),
    profile_privacy_setting VARCHAR(20) CHECK (profile_privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
    status BIT NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_InsertPrivacySettings
ON tblUser
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO tblPrivacySettings (user_id, post_viewer, comment_viewer, story_viewer, profile_viewer, message_viewer, updated_at)
        SELECT i.id, 'public', 'public', 'public', 'public', 'friends', GETDATE()
        FROM inserted i
        LEFT JOIN tblPrivacySettings ps ON ps.user_id = i.id
        WHERE ps.user_id IS NULL;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;

CREATE TABLE tblPrivacySettings (
    user_id INT PRIMARY KEY FOREIGN KEY REFERENCES tblUser(id),
    post_viewer VARCHAR(20) CHECK (post_viewer IN ('public', 'friends', 'only_me', 'custom')) DEFAULT 'public',
    comment_viewer VARCHAR(20) CHECK (comment_viewer IN ('public', 'friends', 'only_me', 'custom')) DEFAULT 'public',
    story_viewer VARCHAR(20) CHECK (story_viewer IN ('public', 'friends', 'only_me', 'custom')) DEFAULT 'public',
    profile_viewer VARCHAR(20) CHECK (profile_viewer IN ('public', 'friends', 'only_me', 'custom')) DEFAULT 'public',
    message_viewer VARCHAR(20) CHECK (message_viewer IN ('public', 'friends', 'only_me')) DEFAULT 'friends',
    updated_at DATETIME DEFAULT GETDATE()
);

--Lưu danh sách quyền riêng tư tùy chỉnh của người dùng.

CREATE TABLE tblCustomPrivacyLists (
    id INT PRIMARY KEY IDENTITY(1, 1),
    user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    list_name NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1,
	CONSTRAINT UQ_User_ListName UNIQUE (user_id, list_name)
);

--Lưu danh sách người dùng trong mỗi danh sách custom.

CREATE TABLE tblCustomPrivacyListMembers (
    list_id INT NOT NULL FOREIGN KEY REFERENCES tblCustomPrivacyLists(id),
    member_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    added_at DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1,
    PRIMARY KEY (list_id, member_user_id)
);

CREATE TRIGGER trg_ValidateCustomPrivacyListMembers
ON tblCustomPrivacyListMembers
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN tblCustomPrivacyLists cpl ON i.list_id = cpl.id
        WHERE i.member_user_id = cpl.user_id
    )
    BEGIN
        RAISERROR('Cannot add list owner as a member.', 16, 1);
        RETURN;
    END
    INSERT INTO tblCustomPrivacyListMembers (list_id, member_user_id, added_at, status)
    SELECT list_id, member_user_id, added_at, status
    FROM inserted;
END;

--Lưu cài đặt quyền riêng tư riêng lẻ cho từng nội dung (post, comment, story, profile).

CREATE TABLE tblContentPrivacy (
    content_id INT NOT NULL,
    content_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id),
    privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
    custom_list_id INT NULL FOREIGN KEY REFERENCES tblCustomPrivacyLists(id),
    updated_at DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1,
    PRIMARY KEY (content_id, content_type_id)
);

CREATE TRIGGER trg_ValidateContentPrivacy
ON tblContentPrivacy
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @invalid_content TABLE (content_id INT, content_type_id INT);

    INSERT INTO @invalid_content (content_id, content_type_id)
    SELECT i.content_id, i.content_type_id
    FROM inserted i
    WHERE 
        (i.content_type_id = 1 AND NOT EXISTS (SELECT 1 FROM tblPost WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 2 AND NOT EXISTS (SELECT 1 FROM tblComment WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 3 AND NOT EXISTS (SELECT 1 FROM tblStory WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 4 AND NOT EXISTS (SELECT 1 FROM tblUser WHERE id = i.content_id AND status = 1));

    IF EXISTS (SELECT 1 FROM @invalid_content)
    BEGIN
        DECLARE @error_msg NVARCHAR(4000);
        SELECT @error_msg = 'Invalid content_id ' + CAST(content_id AS NVARCHAR(10)) + ' for content_type_id ' + CAST(content_type_id AS NVARCHAR(10))
        FROM @invalid_content;
        RAISERROR(@error_msg, 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;

-----------------------PROC FOR UPDATE USER PROFILE----------------------------------
CREATE PROCEDURE sp_UpdateProfilePrivacy
    @user_id INT,
    @privacy_setting VARCHAR(20),
    @custom_list_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @profile_content_type_id INT;
    SELECT @profile_content_type_id = id FROM tblTargetType WHERE code = 'PROFILE';

    BEGIN TRY
        -- Kiểm tra user_id
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
        BEGIN
            RAISERROR('Invalid or inactive user_id.', 16, 1);
            RETURN;
        END

        -- Kiểm tra privacy_setting
        IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
        BEGIN
            RAISERROR('Invalid privacy_setting value.', 16, 1);
            RETURN;
        END

        -- Kiểm tra custom_list_id
        IF @privacy_setting = 'custom' AND (@custom_list_id IS NULL OR NOT EXISTS (SELECT 1 FROM tblCustomPrivacyLists WHERE id = @custom_list_id AND user_id = @user_id AND status = 1))
        BEGIN
            RAISERROR('Invalid or missing custom_list_id for custom privacy.', 16, 1);
            RETURN;
        END

        -- Cập nhật quyền riêng tư hồ sơ
        UPDATE tblUser
        SET profile_privacy_setting = @privacy_setting
        WHERE id = @user_id;

		UPDATE tblPrivacySettings
		SET profile_viewer = @privacy_setting,
			updated_at = GETDATE()
		WHERE user_id = @user_id;

        -- Giao dịch để đảm bảo tính nguyên tử
        BEGIN TRANSACTION;

        -- Xóa quyền riêng tư cũ
        DELETE FROM tblContentPrivacy
        WHERE content_id = @user_id AND content_type_id = @profile_content_type_id;

        -- Chèn quyền riêng tư mới nếu không phải 'default'
        IF @privacy_setting != 'default'
        BEGIN
            INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
            VALUES (@user_id, @profile_content_type_id, @privacy_setting, @custom_list_id, GETDATE(), 1);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;

--------------------------------------------------------------------

---------------TRIGGER FOR SOFT DELETE USER---------------

CREATE TRIGGER trg_SoftDelete_User
ON tblUser
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        DECLARE @deletedUsers TABLE (id INT);
        INSERT INTO @deletedUsers(id)
        SELECT id FROM inserted WHERE status = 0 AND id IN (SELECT id FROM deleted WHERE status = 1);

        IF NOT EXISTS (SELECT 1 FROM @deletedUsers)
            RETURN;

        -- Thêm log hoạt động cho soft delete
        INSERT INTO tblActivityLog (user_id, action_type_id, action_time, ip_address, device, status)
        SELECT id, (SELECT id FROM tblActionType WHERE name = 'USER_SOFT_DELETE'), GETDATE(), NULL, NULL, 1
        FROM @deletedUsers;

        -- Gộp các cập nhật liên quan đến status
        UPDATE cp
        SET status = 0
        FROM tblContentPrivacy cp
        WHERE cp.status = 1 AND cp.content_id IN (
            SELECT id FROM tblPost WHERE owner_id IN (SELECT id FROM @deletedUsers) AND status = 1
            UNION
            SELECT id FROM tblComment WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1
            UNION
            SELECT id FROM tblStory WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1
            UNION
            SELECT id FROM tblUser WHERE id IN (SELECT id FROM @deletedUsers) AND status = 1
        );

        UPDATE tblPost 
        SET status = 0 
        WHERE owner_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblFriendship 
        SET status = 0 
        WHERE (user_id IN (SELECT id FROM @deletedUsers) OR friend_id IN (SELECT id FROM @deletedUsers)) AND status = 1;

        UPDATE tblFollow 
        SET status = 0 
        WHERE (follower_id IN (SELECT id FROM @deletedUsers) OR followee_id IN (SELECT id FROM @deletedUsers)) AND status = 1;

        UPDATE tblBlock 
        SET status = 0 
        WHERE (user_id IN (SELECT id FROM @deletedUsers) OR blocked_user_id IN (SELECT id FROM @deletedUsers)) AND status = 1;

        UPDATE tblStory 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblStoryViewer 
        SET status = 0 
        WHERE viewer_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblStoryReply 
        SET status = 0 
        WHERE (sender_id IN (SELECT id FROM @deletedUsers) 
               OR story_id IN (SELECT id FROM tblStory WHERE user_id IN (SELECT id FROM @deletedUsers))) AND status = 1;

        UPDATE tblChatMember 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblMessage 
        SET status = 0 
        WHERE sender_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblComment 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblSavedPost 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblHiddenPost 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblPostTag 
        SET status = 0 
        WHERE tagged_user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblActivityLog 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblNotification 
        SET status_id = 2 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status_id = 1;

        UPDATE tblGroupMember 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblPage 
        SET status = 0 
        WHERE owner_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblReport 
        SET status = 0 
        WHERE reporter_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblReaction 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblCustomPrivacyLists 
        SET status = 0 
        WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        UPDATE tblCustomPrivacyListMembers 
        SET status = 0 
        WHERE member_user_id IN (SELECT id FROM @deletedUsers) AND status = 1;

        -- Cập nhật thời gian cho tblPrivacySettings
        UPDATE tblPrivacySettings 
        SET updated_at = GETDATE() 
        WHERE user_id IN (SELECT id FROM @deletedUsers);
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;

------------------------------------------------------------

CREATE TABLE tblSession (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	device NVARCHAR(255),
	ip_address NVARCHAR(45),
	created_at DATETIME DEFAULT GETDATE(),
	expired_time DATETIME,
	status BIT DEFAULT 1
);

CREATE TABLE tblPasswordReset (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	token VARCHAR(255) NOT NULL UNIQUE,
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
	expiration_date DATETIME NULL,
    PRIMARY KEY (user_id, suggested_user_id)
);

------------PROC FOR SUGGEST FRIEND

CREATE PROCEDURE sp_UpdateFriendSuggestions
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Xóa gợi ý hết hạn
        DELETE FROM tblFriendSuggestion WHERE expiration_date <= GETDATE();

        -- Tạo bảng tạm để lưu gợi ý mới
        DECLARE @NewSuggestions TABLE (
            user_id INT,
            suggested_user_id INT,
            mutual_friend_count INT,
            suggested_at DATETIME
        );

        -- Gợi ý theo thuật toán bạn của bạn (FOAF)
        INSERT INTO @NewSuggestions (user_id, suggested_user_id, mutual_friend_count, suggested_at)
        SELECT
            f1.user_id,
            f2.friend_id AS suggested_user_id,
            COUNT(*) AS mutual_friend_count,
            GETDATE() AS suggested_at
        FROM tblFriendship f1
        JOIN tblFriendship f2 ON f1.friend_id = f2.user_id
        WHERE 
            f1.friendship_status = 'accepted'
            AND f2.friendship_status = 'accepted'
            AND f1.user_id <> f2.friend_id
            AND f1.user_id IN (SELECT id FROM tblUser WHERE status = 1)
            AND f2.friend_id IN (SELECT id FROM tblUser WHERE status = 1)
            AND f2.friend_id NOT IN (
                SELECT friend_id FROM tblFriendship 
                WHERE user_id = f1.user_id AND friendship_status = 'accepted'
            )
            AND f2.friend_id NOT IN (
                SELECT blocked_user_id FROM tblBlock WHERE user_id = f1.user_id AND status = 1
                UNION
                SELECT user_id FROM tblBlock WHERE blocked_user_id = f1.user_id AND status = 1
            )
            AND f2.friend_id NOT IN (
                SELECT followee_id FROM tblFollow WHERE follower_id = f1.user_id AND status = 1
            )
            -- Kiểm tra bạn chung không bị chặn bởi suggested_user_id và ngược lại
            AND NOT EXISTS (
                SELECT 1 FROM tblBlock b
                WHERE (b.user_id = f1.friend_id AND b.blocked_user_id = f2.friend_id AND b.status = 1)
                   OR (b.user_id = f2.friend_id AND b.blocked_user_id = f1.friend_id AND b.status = 1)
            )
        GROUP BY f1.user_id, f2.friend_id;

        -- Sử dụng MERGE để cập nhật hoặc chèn gợi ý
        MERGE INTO tblFriendSuggestion AS target
        USING @NewSuggestions AS source
        ON target.user_id = source.user_id AND target.suggested_user_id = source.suggested_user_id
        WHEN MATCHED THEN
            UPDATE SET 
                mutual_friend_count = source.mutual_friend_count,
                suggested_at = source.suggested_at,
                expiration_date = DATEADD(DAY, 7, GETDATE())
        WHEN NOT MATCHED THEN
            INSERT (user_id, suggested_user_id, mutual_friend_count, suggested_at, expiration_date)
            VALUES (source.user_id, source.suggested_user_id, source.mutual_friend_count, source.suggested_at, DATEADD(DAY, 7, GETDATE()));
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
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

    -- Kiểm tra user_id và friend_id tồn tại và active
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive user_id.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @friend_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive friend_id.', 16, 1);
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

    -- Kiểm tra xem user_id có bị chặn bởi friend_id hoặc ngược lại
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE (user_id = @friend_id AND blocked_user_id = @user_id AND status = 1) OR
              (user_id = @user_id AND blocked_user_id = @friend_id AND status = 1)
    )
    BEGIN
        RAISERROR('Cannot send friend request due to block status.', 16, 1);
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
    media_url VARCHAR(255) NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
    privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
    background_color VARCHAR(50),
    status BIT DEFAULT 1
);

CREATE PROCEDURE sp_CleanExpiredStories
AS
BEGIN
    SET NOCOUNT ON;

    -- Cập nhật trạng thái của story hết hạn
    UPDATE tblStory
    SET status = 0
    WHERE expire_time <= GETDATE() AND status = 1;

    -- Cập nhật trạng thái của quyền riêng tư liên quan
    UPDATE tblContentPrivacy
    SET status = 0
    WHERE content_type_id = 3 
      AND content_id IN (
          SELECT id FROM tblStory WHERE expire_time <= GETDATE() AND status = 0
      )
      AND status = 1;
END;

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

---------------------PROC FOR CREATE STORY---------------------------

CREATE PROCEDURE sp_CreateStory
    @user_id INT,
    @caption NVARCHAR(255),
    @media_url VARCHAR(255),
    @media_type VARCHAR(10),
    @privacy_setting VARCHAR(20),
    @background_color VARCHAR(20) = NULL,
    @custom_list_id INT = NULL,
    @new_story_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Kiểm tra user_id có tồn tại và active không
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
        BEGIN
            THROW 50001, 'Invalid or inactive user_id.', 1;
            RETURN;
        END

        -- Kiểm tra media_url không rỗng
        IF @media_url IS NULL OR LTRIM(RTRIM(@media_url)) = ''
        BEGIN
            THROW 50002, 'Media URL cannot be empty.', 1;
            RETURN;
        END

        -- Kiểm tra media_type hợp lệ
        IF @media_type NOT IN ('image', 'video')
        BEGIN
            THROW 50003, 'Invalid media_type value.', 1;
            RETURN;
        END

        -- Kiểm tra từ khóa bị cấm trong caption
        IF @caption IS NOT NULL AND EXISTS (
            SELECT 1 FROM tblBannedKeyword bk
            WHERE @caption LIKE '%' + bk.keyword + '%' AND bk.status = 1
        )
        BEGIN
            THROW 50004, 'Caption contains banned keywords.', 1;
            RETURN;
        END

        -- Kiểm tra chính sách nội dung trong caption
        IF @caption IS NOT NULL
        BEGIN
            DECLARE @policy_valid BIT;
            EXEC sp_CheckContentPolicy @caption, @policy_valid OUTPUT;
            IF @policy_valid = 0
            BEGIN
                THROW 50005, 'Caption violates platform policies.', 1;
                RETURN;
            END
        END

        -- Kiểm tra privacy_setting hợp lệ
        IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
        BEGIN
            THROW 50006, 'Invalid privacy_setting value.', 1;
            RETURN;
        END

        -- Kiểm tra custom_list_id nếu privacy_setting là 'custom'
        IF @privacy_setting = 'custom' AND (
            @custom_list_id IS NULL OR 
            NOT EXISTS (
                SELECT 1 FROM tblCustomPrivacyLists 
                WHERE id = @custom_list_id AND user_id = @user_id AND status = 1
            )
        )
        BEGIN
            THROW 50007, 'Invalid or missing custom_list_id for custom privacy.', 1;
            RETURN;
        END

        -- Kiểm tra xem user_id có bị chặn bởi bất kỳ ai trong custom_list_id hoặc chủ danh sách không
        IF @privacy_setting = 'custom' AND @custom_list_id IS NOT NULL
        BEGIN
            IF EXISTS (
                SELECT 1 FROM tblBlock b
                JOIN tblCustomPrivacyListMembers cplm ON b.blocked_user_id = cplm.member_user_id
                WHERE cplm.list_id = @custom_list_id AND b.user_id = @user_id AND b.status = 1
            )
            BEGIN
                THROW 50008, 'User is blocked by one or more members in the custom list.', 1;
                RETURN;
            END

            IF EXISTS (
                SELECT 1 FROM tblBlock b
                JOIN tblCustomPrivacyLists cpl ON cpl.user_id = b.blocked_user_id
                WHERE cpl.id = @custom_list_id AND b.user_id = @user_id AND b.status = 1
            )
            BEGIN
                THROW 50009, 'User is blocked by the owner of the custom list.', 1;
                RETURN;
            END
        END

        -- Thêm câu chuyện mới
        INSERT INTO tblStory (user_id, caption, media_url, media_type, privacy_setting, background_color, created_at, status)
        VALUES (@user_id, @caption, @media_url, @media_type, @privacy_setting, @background_color, GETDATE(), 1);

        -- Lấy ID câu chuyện vừa thêm
        SET @new_story_id = SCOPE_IDENTITY();

        -- Lưu quyền riêng tư vào tblContentPrivacy nếu không phải 'default'
        IF @privacy_setting != 'default'
        BEGIN
            INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
            VALUES (@new_story_id, 3, @privacy_setting, @custom_list_id, GETDATE(), 1);
        END

        -- Ghi log hoạt động
        DECLARE @action_type_id INT;
        SELECT @action_type_id = id FROM tblActionType WHERE name = 'STORY_CREATE';

        EXEC sp_LogActivity @user_id, @action_type_id, NULL, NULL, 1, @new_story_id, 'STORY';
    END TRY
    BEGIN CATCH
        -- Ghi lại lỗi chi tiết để debug
        THROW;
    END CATCH
END;


---------------------------------------------------------------

--POST

CREATE TABLE tblPost (
    id INT PRIMARY KEY IDENTITY(1, 1),
    owner_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    created_at DATETIME DEFAULT GETDATE(),
    content NVARCHAR(MAX),
    privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
    media_url VARCHAR(255),
    status BIT DEFAULT 1
);

CREATE TABLE tblComment (
    id INT PRIMARY KEY IDENTITY(1, 1),
    parent_comment_id INT NULL,
    user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
    post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
    content NVARCHAR(1000),
    privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
    created_at DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1,
    CONSTRAINT FK_Comment_Parent FOREIGN KEY (parent_comment_id) REFERENCES tblComment(id)
);

-----------------------PROC FOR CREATE COMMENT----------------------------

CREATE PROCEDURE sp_CreateComment
    @user_id INT,
    @post_id INT,
    @parent_comment_id INT = NULL,
    @content NVARCHAR(1000),
    @privacy_setting VARCHAR(20),
    @custom_list_id INT = NULL,
    @new_comment_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @has_access BIT;
    DECLARE @parent_comment_owner_id INT;

    -- Kiểm tra user_id và post_id
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive user_id.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM tblPost WHERE id = @post_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive post_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra quyền truy cập bài viết
    EXEC sp_CheckContentAccess @user_id, @post_id, 1, @has_access OUTPUT;
    IF @has_access = 0
    BEGIN
        RAISERROR('User does not have permission to comment on this post.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem user_id có bị chặn bởi owner_id của bài viết không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = (SELECT owner_id FROM tblPost WHERE id = @post_id) AND blocked_user_id = @user_id AND status = 1
    )
    BEGIN
        RAISERROR('User is blocked from commenting on this post.', 16, 1);
        RETURN;
    END

    -- Kiểm tra parent_comment_id
    IF @parent_comment_id IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM tblComment WHERE id = @parent_comment_id AND status = 1)
        BEGIN
            RAISERROR('Invalid or inactive parent_comment_id.', 16, 1);
            RETURN;
        END

        -- Lấy user_id của parent_comment
        SELECT @parent_comment_owner_id = user_id FROM tblComment WHERE id = @parent_comment_id;

        -- Kiểm tra xem user_id có bị chặn bởi user_id của parent_comment không
        IF EXISTS (
            SELECT 1 FROM tblBlock
            WHERE user_id = @parent_comment_owner_id AND blocked_user_id = @user_id AND status = 1
        )
        BEGIN
            RAISERROR('User is blocked from replying to this comment.', 16, 1);
            RETURN;
        END
    END

    -- Kiểm tra content
    IF @content IS NULL OR LTRIM(RTRIM(@content)) = ''
    BEGIN
        RAISERROR('Content cannot be empty.', 16, 1);
        RETURN;
    END

    -- Kiểm tra từ khóa bị cấm
    IF EXISTS (
        SELECT 1 FROM tblBannedKeyword bk
        WHERE @content LIKE '%' + bk.keyword + '%' AND bk.status = 1
    )
    BEGIN
        RAISERROR('Content contains banned keywords.', 16, 1);
        RETURN;
    END

    -- Kiểm tra chính sách nội dung
    DECLARE @policy_valid BIT;
    EXEC sp_CheckContentPolicy @content, @policy_valid OUTPUT;
    IF @policy_valid = 0
    BEGIN
        RAISERROR('Content violates platform policies.', 16, 1);
        RETURN;
    END

    -- Kiểm tra privacy_setting
    IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
    BEGIN
        RAISERROR('Invalid privacy_setting value.', 16, 1);
        RETURN;
    END

    -- Kiểm tra custom_list_id
    IF @privacy_setting = 'custom' AND (@custom_list_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM tblCustomPrivacyLists 
        WHERE id = @custom_list_id AND user_id = @user_id AND status = 1)
    )
    BEGIN
        RAISERROR('Invalid or missing custom_list_id for custom privacy.', 16, 1);
        RETURN;
    END

    -- Thêm bình luận
    INSERT INTO tblComment (user_id, post_id, parent_comment_id, content, privacy_setting, created_at, status)
    VALUES (@user_id, @post_id, @parent_comment_id, @content, @privacy_setting, GETDATE(), 1);

    -- Lấy ID bình luận
    SET @new_comment_id = SCOPE_IDENTITY();

    -- Lưu quyền riêng tư
    IF @privacy_setting != 'default'
    BEGIN
        INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
        VALUES (@new_comment_id, 2, @privacy_setting, @custom_list_id, GETDATE(), 1);
    END

    -- Ghi log hoạt động
    DECLARE @action_type_id INT;
    SELECT @action_type_id = id FROM tblActionType WHERE name = 'COMMENT_CREATE';

    EXEC sp_LogActivity @user_id, @action_type_id, NULL, NULL, 1, @new_comment_id, 'COMMENT';
END;


---------------------------------------------------------------------

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
	name NVARCHAR(100) NULL,
	created_at DATETIME DEFAULT GETDATE(),
	status BIT DEFAULT 1
);
--------------PROC VALIDATE AND CREATE POST--------------

CREATE PROCEDURE sp_CreatePost
    @owner_id INT,
    @content NVARCHAR(MAX),
    @privacy_setting VARCHAR(20),
    @media_url VARCHAR(255) = NULL,
    @tagged_user_ids NVARCHAR(MAX) = NULL,
    @custom_list_id INT = NULL,
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

    -- Kiểm tra từ khóa bị cấm
    IF EXISTS (
        SELECT 1 FROM tblBannedKeyword bk
        WHERE @content LIKE '%' + bk.keyword + '%' AND bk.status = 1
    )
    BEGIN
        RAISERROR('Content contains banned keywords.', 16, 1);
        RETURN;
    END

    -- Kiểm tra chính sách nội dung
    DECLARE @policy_valid BIT;
    EXEC sp_CheckContentPolicy @content, @policy_valid OUTPUT;
    IF @policy_valid = 0
    BEGIN
        RAISERROR('Content violates platform policies.', 16, 1);
        RETURN;
    END

    -- Kiểm tra privacy_setting hợp lệ
    IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
    BEGIN
        RAISERROR('Invalid privacy_setting value.', 16, 1);
        RETURN;
    END

    -- Kiểm tra custom_list_id nếu privacy_setting là 'custom'
    IF @privacy_setting = 'custom' AND (@custom_list_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM tblCustomPrivacyLists 
        WHERE id = @custom_list_id AND user_id = @owner_id AND status = 1))
    BEGIN
        RAISERROR('Invalid or missing custom_list_id for custom privacy.', 16, 1);
        RETURN;
    END

    -- Kiểm tra nếu owner_id bị chặn bởi người trong custom_list_id hoặc chủ danh sách
    IF @privacy_setting = 'custom' AND @custom_list_id IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1 FROM tblBlock b
            JOIN tblCustomPrivacyListMembers cplm ON b.blocked_user_id = cplm.member_user_id
            WHERE cplm.list_id = @custom_list_id AND b.user_id = @owner_id AND b.status = 1
        )
        BEGIN
            RAISERROR('User is blocked by one or more members in the custom list.', 16, 1);
            RETURN;
        END
        IF EXISTS (
            SELECT 1 FROM tblBlock b
            JOIN tblCustomPrivacyLists cpl ON cpl.user_id = b.blocked_user_id
            WHERE cpl.id = @custom_list_id AND b.user_id = @owner_id AND b.status = 1
        )
        BEGIN
            RAISERROR('User is blocked by the owner of the custom list.', 16, 1);
            RETURN;
        END
    END

    -- Thêm bài viết mới
    INSERT INTO tblPost (owner_id, content, privacy_setting, media_url, created_at, status)
    VALUES (@owner_id, @content, @privacy_setting, @media_url, GETDATE(), 1);

    -- Lấy ID bài viết vừa thêm
    SET @new_post_id = SCOPE_IDENTITY();

    -- Lưu quyền riêng tư nếu cần
    IF @privacy_setting != 'default'
    BEGIN
        INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
        VALUES (@new_post_id, 1, @privacy_setting, @custom_list_id, GETDATE(), 1);
    END

    -- Xử lý tag người dùng
    IF @tagged_user_ids IS NOT NULL AND LTRIM(RTRIM(@tagged_user_ids)) <> ''
    BEGIN
        DECLARE @pos INT = 1, @len INT, @id_str VARCHAR(20);
        DECLARE @tagged_user_id INT;
        DECLARE @has_access BIT;

        SET @tagged_user_ids = @tagged_user_ids + ',';

        WHILE CHARINDEX(',', @tagged_user_ids, @pos) > 0
        BEGIN
            SET @len = CHARINDEX(',', @tagged_user_ids, @pos) - @pos;
            SET @id_str = SUBSTRING(@tagged_user_ids, @pos, @len);
            SET @pos = CHARINDEX(',', @tagged_user_ids, @pos) + 1;

            IF ISNUMERIC(@id_str) = 1
            BEGIN
                SET @tagged_user_id = CAST(@id_str AS INT);
                EXEC sp_CheckContentAccess @tagged_user_id, @new_post_id, 1, @has_access OUTPUT;

                IF @has_access = 1 
                   AND EXISTS (SELECT 1 FROM tblUser WHERE id = @tagged_user_id AND status = 1)
                   AND NOT EXISTS (
                       SELECT 1 FROM tblBlock 
                       WHERE user_id = @owner_id AND blocked_user_id = @tagged_user_id AND status = 1
                   )
                BEGIN
                    INSERT INTO tblPostTag (post_id, tagged_user_id, status)
                    VALUES (@new_post_id, @tagged_user_id, 1);
                END
            END
        END
    END

    -- Ghi log hoạt động
    DECLARE @action_type_id INT;
    SELECT @action_type_id = id FROM tblActionType WHERE name = 'POST_CREATE';

    EXEC sp_LogActivity @owner_id, @action_type_id, NULL, NULL, 1, @new_post_id, 'POST';
END;

------------------------------------------

--------------PROC VALIDATE AND SAVE POST--------------

CREATE PROCEDURE sp_SavePost
    @user_id INT,
    @post_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @has_access BIT;
    DECLARE @owner_id INT;

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

    -- Lấy owner_id của bài viết
    SELECT @owner_id = owner_id FROM tblPost WHERE id = @post_id;

    -- Kiểm tra quyền truy cập
    EXEC sp_CheckContentAccess @user_id, @post_id, 1, @has_access OUTPUT;
    IF @has_access = 0
    BEGIN
        RAISERROR('User does not have permission to save this post.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem user_id có bị chặn bởi owner_id không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = @owner_id AND blocked_user_id = @user_id AND status = 1
    )
    BEGIN
        RAISERROR('User is blocked from saving this post.', 16, 1);
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

    DECLARE @has_access BIT;
    DECLARE @owner_id INT;

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

    -- Lấy owner_id của bài viết
    SELECT @owner_id = owner_id FROM tblPost WHERE id = @post_id;

    -- Kiểm tra quyền truy cập
    EXEC sp_CheckContentAccess @user_id, @post_id, 1, @has_access OUTPUT;
    IF @has_access = 0
    BEGIN
        RAISERROR('User does not have permission to hide this post.', 16, 1);
        RETURN;
    END

    -- Kiểm tra xem user_id có bị chặn bởi owner_id không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = @owner_id AND blocked_user_id = @user_id AND status = 1
    )
    BEGIN
        RAISERROR('User is blocked from hiding this post.', 16, 1);
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

    -- Kiểm tra tên nhóm không rỗng hoặc NULL cho is_group = 1
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE is_group = 1 AND (name IS NULL OR LTRIM(RTRIM(name)) = '')
    )
    BEGIN
        RAISERROR('Tên nhóm là bắt buộc khi is_group = 1.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Chèn hoặc cập nhật dữ liệu hợp lệ
    IF NOT EXISTS (SELECT * FROM deleted)
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
	description NVARCHAR(255),
	status BIT DEFAULT 1 
);

CREATE TABLE tblMessage (
	id INT PRIMARY KEY IDENTITY(1, 1),
	chat_id INT NOT NULL FOREIGN KEY REFERENCES tblChat(id),
	sender_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	type_id INT NOT NULL FOREIGN KEY REFERENCES tblMessageType(id),
	content NVARCHAR(MAX),
	created_at DATETIME DEFAULT GETDATE(),
	media_url VARCHAR(512) NULL,
    media_type VARCHAR(10) NULL,
	status BIT DEFAULT 1,
    CONSTRAINT CK_tblMessage_media_type CHECK (media_type IN ('image', 'video', NULL))
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
	target_id INT NULL,
    target_type NVARCHAR(50) NULL,
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
END;


--NOTIFICATION

CREATE TRIGGER trg_SoftDelete_Notification
ON tblContentPrivacy
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE status = 0)
    BEGIN
        UPDATE tblNotification
        SET status_id = 2
        WHERE target_id IN (SELECT content_id FROM inserted WHERE status = 0)
        AND target_type_id IN (SELECT content_type_id FROM inserted WHERE status = 0)
        AND status_id = 1;
    END
END;

CREATE TABLE tblNotificationType (
	id INT PRIMARY KEY IDENTITY(1, 1),
	name VARCHAR(50),
	description VARCHAR(255),
	status BIT DEFAULT 1,
);

CREATE TABLE tblNotification (
	id INT PRIMARY KEY IDENTITY(1, 1),
	user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
	type_id INT NOT NULL FOREIGN KEY REFERENCES tblNotificationType(id),
	message NVARCHAR(255),
	created_at DATETIME DEFAULT GETDATE(),
	target_id INT NULL,
    target_type_id INT NULL FOREIGN KEY REFERENCES tblTargetType(id),
    status_id TINYINT NOT NULL FOREIGN KEY REFERENCES tblNotificationStatus(id) DEFAULT 1,
);

CREATE TABLE tblNotificationStatus (
    id TINYINT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    description NVARCHAR(255),
	status BIT DEFAULT 1,
);

INSERT INTO tblNotificationStatus (id, name, description, status) VALUES
(1, 'unread', N'unread',1),
(2, 'read', N'read',1),
(3, 'marked_unread', N'marked_unread',1);

CREATE PROCEDURE sp_AddNotification
    @user_id INT,
    @type_id INT,
    @message NVARCHAR(255),
    @target_id INT,
    @target_type_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra user_id có tồn tại và active không
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive user_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra type_id có tồn tại và active không
    IF NOT EXISTS (SELECT 1 FROM tblNotificationType WHERE id = @type_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive notification type.', 16, 1);
        RETURN;
    END

    DECLARE @is_valid BIT;
    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target for notification.', 16, 1);
        RETURN;
    END

    INSERT INTO tblNotification (
        user_id, type_id, message, created_at, status_id, target_id, target_type_id
    )
    VALUES (
        @user_id, @type_id, @message, GETDATE(), 1, @target_id, @target_type_id
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
	ELSE IF @target_type_id = 4 AND EXISTS (SELECT 1 FROM tblUser WHERE id = @target_id AND status = 1)
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
    SET NOCOUNT ON;

    -- Kiểm tra reporter_id có tồn tại và active không
    IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @reporter_id AND status = 1)
    BEGIN
        RAISERROR('Invalid or inactive reporter_id.', 16, 1);
        RETURN;
    END

    DECLARE @is_valid BIT;
    DECLARE @owner_id INT;

    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target_id or target_type_id.', 16, 1);
        RETURN;
    END

    -- Lấy owner_id dựa trên target_type_id
    SELECT @owner_id = 
        CASE @target_type_id
            WHEN 1 THEN (SELECT owner_id FROM tblPost WHERE id = @target_id)
            WHEN 2 THEN (SELECT user_id FROM tblComment WHERE id = @target_id)
            WHEN 3 THEN (SELECT user_id FROM tblStory WHERE id = @target_id)
            WHEN 4 THEN (SELECT id FROM tblUser WHERE id = @target_id)
        END;

    -- Kiểm tra xem reporter_id có bị chặn bởi owner_id không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = @owner_id AND blocked_user_id = @reporter_id AND status = 1
    )
    BEGIN
        RAISERROR('User is blocked from reporting this content.', 16, 1);
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
	status BIT DEFAULT 1,
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
    DECLARE @owner_id INT;
    DECLARE @has_access BIT;

    -- Kiểm tra target có tồn tại và hợp lệ không
    EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;

    IF @is_valid = 0
    BEGIN
        RAISERROR('Invalid target_id or target_type_id.', 16, 1);
        RETURN;
    END

    -- Kiểm tra quyền truy cập
    EXEC sp_CheckContentAccess @user_id, @target_id, @target_type_id, @has_access OUTPUT;
    IF @has_access = 0
    BEGIN
        RAISERROR('User does not have permission to react to this content.', 16, 1);
        RETURN;
    END

    -- Lấy owner_id dựa trên target_type_id
    SELECT @owner_id = 
        CASE @target_type_id
            WHEN 1 THEN (SELECT owner_id FROM tblPost WHERE id = @target_id)
            WHEN 2 THEN (SELECT user_id FROM tblComment WHERE id = @target_id)
            WHEN 3 THEN (SELECT user_id FROM tblStory WHERE id = @target_id)
            WHEN 4 THEN (SELECT id FROM tblUser WHERE id = @target_id)
        END;

    -- Kiểm tra xem user_id có bị chặn bởi owner_id không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = @owner_id AND blocked_user_id = @user_id AND status = 1
    )
    BEGIN
        RAISERROR('User is blocked from reacting to this content.', 16, 1);
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
        user_id, reaction_type_id, target_id, target_type_id, created_at, status
    )
    VALUES (
        @user_id, @reaction_type_id, @target_id, @target_type_id, GETDATE(), 1
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

CREATE PROCEDURE sp_CheckContentPolicy
    @content NVARCHAR(MAX),
    @is_valid BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @is_valid = 1;

    -- Kiểm tra nội dung dựa trên chính sách
    IF EXISTS (
        SELECT 1 FROM tblContentPolicy cp
        WHERE cp.status = 1 AND @content LIKE '%' + cp.policy_name + '%'
    )
    BEGIN
        SET @is_valid = 0;
    END
END;

CREATE PROCEDURE sp_CheckContentAccess
    @user_id INT,
    @content_id INT,
    @content_type_id INT,
    @has_access BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @privacy_setting VARCHAR(20);
    DECLARE @custom_list_id INT;
    DECLARE @owner_id INT;

    -- Lấy cài đặt quyền riêng tư từ tblContentPrivacy
    SELECT @privacy_setting = privacy_setting, @custom_list_id = custom_list_id
    FROM tblContentPrivacy
    WHERE content_id = @content_id AND content_type_id = @content_type_id AND status = 1;

    -- Nếu không có cài đặt riêng lẻ hoặc là 'default', lấy từ tblPrivacySettings
    IF @privacy_setting IS NULL OR @privacy_setting = 'default'
    BEGIN
        SELECT @owner_id = 
            CASE @content_type_id
                WHEN 1 THEN (SELECT owner_id FROM tblPost WHERE id = @content_id)
                WHEN 2 THEN (SELECT user_id FROM tblComment WHERE id = @content_id)
                WHEN 3 THEN (SELECT user_id FROM tblStory WHERE id = @content_id)
                WHEN 4 THEN (SELECT id FROM tblUser WHERE id = @content_id)
            END;

        IF @owner_id IS NULL
        BEGIN
            SET @has_access = 0;
            RETURN;
        END;

        SELECT @privacy_setting = 
            CASE @content_type_id
                WHEN 1 THEN post_viewer
                WHEN 2 THEN comment_viewer
                WHEN 3 THEN story_viewer
                WHEN 4 THEN profile_viewer
            END
        FROM tblPrivacySettings
        WHERE user_id = @owner_id;
    END
    ELSE
    BEGIN
        -- Lấy owner_id nếu privacy_setting không phải 'default'
        SELECT @owner_id = 
            CASE @content_type_id
                WHEN 1 THEN (SELECT owner_id FROM tblPost WHERE id = @content_id)
                WHEN 2 THEN (SELECT user_id FROM tblComment WHERE id = @content_id)
                WHEN 3 THEN (SELECT user_id FROM tblStory WHERE id = @content_id)
                WHEN 4 THEN (SELECT id FROM tblUser WHERE id = @content_id)
            END;
    END;

    -- Kiểm tra quyền truy cập
    SET @has_access = 0;

    IF @privacy_setting = 'public'
        SET @has_access = 1;
    ELSE IF @privacy_setting = 'friends' AND EXISTS (
        SELECT 1 FROM tblFriendship
        WHERE user_id = @owner_id AND friend_id = @user_id AND friendship_status = 'accepted' AND status = 1
    )
        SET @has_access = 1;
    ELSE IF @privacy_setting = 'only_me' AND @user_id = @owner_id
        SET @has_access = 1;
    ELSE IF @privacy_setting = 'custom' AND EXISTS (
        SELECT 1 FROM tblCustomPrivacyListMembers
        WHERE list_id = @custom_list_id AND member_user_id = @user_id AND status = 1
    )
        SET @has_access = 1;

    -- Kiểm tra xem user_id có bị chặn bởi owner_id không
    IF EXISTS (
        SELECT 1 FROM tblBlock
        WHERE user_id = @owner_id AND blocked_user_id = @user_id AND status = 1
    )
        SET @has_access = 0;
END;

CREATE TABLE tblErrorLog (
    id INT PRIMARY KEY IDENTITY(1, 1),
    error_message NVARCHAR(4000),
    error_time DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1
);

-----ADD DATA FROM HERE------
--/////////////////////////////////////////////
INSERT INTO tblTargetType (name, code) VALUES
('Post', 'POST'),
('Comment', 'COMMENT'),
('Story', 'STORY'),
('Profile', 'PROFILE'),
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
