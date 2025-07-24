/*
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
    CREATE LOGIN guestuser WITH PASSWORD = 'De190699';
    GO
    CREATE USER guestuser FOR LOGIN guestuser;
    GO
    EXEC sp_addrolemember N'db_owner', N'guestuser';
    GO
*/
    --AUTHENTICATION
    CREATE TABLE tblUser (
        id INT PRIMARY KEY IDENTITY(1, 1),
        email NVARCHAR(50) NOT NULL UNIQUE,
        username NVARCHAR(30) NOT NULL UNIQUE,
        phone_number VARCHAR(12) UNIQUE null,	
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

	CREATE TABLE tblLocation (
		id INT IDENTITY(1,1) PRIMARY KEY,
		user_id INT NOT NULL,
		latitude FLOAT NOT NULL,
		longitude FLOAT NOT NULL,
		location_name NVARCHAR(255) NULL,
		updated_at DATETIME DEFAULT GETDATE(),
		FOREIGN KEY (user_id) REFERENCES tblUser(id)
	);

	CREATE NONCLUSTERED INDEX IX_tblLocation_user_id
	ON tblLocation(user_id, latitude, longitude);

	CREATE TABLE tblVerifiedEmail (
    id INT PRIMARY KEY IDENTITY(1, 1),
    user_id INT NOT NULL,
    email NVARCHAR(50) NOT NULL,
    verification_code NVARCHAR(10) NOT NULL,
    verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_verified_email_user FOREIGN KEY (user_id) REFERENCES tblUser(id) ON DELETE CASCADE,
    CONSTRAINT uq_verified_email UNIQUE (user_id, email)
);
	--table for temporary save token to verify if email exists or not
	CREATE TABLE tblVerificationToken (
    id INT  PRIMARY KEY IDENTITY(1,1),
    email NVARCHAR(255) NOT NULL,
    username NVARCHAR(50) NOT NULL,
	password VARCHAR(255) NOT NULL,  -- password đã mã hóa (hash)
    phone_number NVARCHAR(20) NOT NULL,
    token NVARCHAR(255) NOT NULL,
    expiry_date DATETIME NOT NULL,
    created_date DATETIME NOT NULL DEFAULT GETDATE(),
	CONSTRAINT UQ_VerificationToken_Email UNIQUE(email)
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
		CREATE PROCEDURE sp_DeleteCustomList
		@user_id INT,
		@list_id INT
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;

			-- Kiểm tra user_id tồn tại và active
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
			BEGIN
				RAISERROR(N'Người dùng không hợp lệ hoặc không hoạt động.', 16, 1);
				RETURN;
			END

			-- Kiểm tra list_id tồn tại và thuộc về user_id
			IF NOT EXISTS (SELECT 1 FROM tblCustomPrivacyLists WHERE id = @list_id AND user_id = @user_id AND status = 1)
			BEGIN
				RAISERROR(N'Danh sách không tồn tại hoặc không thuộc về người dùng.', 16, 1);
				RETURN;
			END

			-- Xóa các thành viên trong danh sách
			UPDATE tblCustomPrivacyListMembers
			SET status = 0
			WHERE list_id = @list_id AND status = 1;

			-- Xóa danh sách
			UPDATE tblCustomPrivacyLists
			SET status = 0
			WHERE id = @list_id AND user_id = @user_id;

			-- Cập nhật các quyền riêng tư liên quan (nếu danh sách được sử dụng)
			UPDATE tblContentPrivacy
			SET custom_list_id = NULL,
				privacy_setting = 'public',
				updated_at = GETDATE()
			WHERE custom_list_id = @list_id AND status = 1;

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	GO


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

	CREATE PROCEDURE sp_GetCustomListMembers
    @user_id INT,
    @list_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Kiểm tra user_id tồn tại và active
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
        BEGIN
            RAISERROR(N'Người dùng không hợp lệ hoặc không hoạt động.', 16, 1);
            RETURN;
        END

        -- Kiểm tra list_id tồn tại và thuộc về user_id
        IF NOT EXISTS (SELECT 1 FROM tblCustomPrivacyLists WHERE id = @list_id AND user_id = @user_id AND status = 1)
        BEGIN
            RAISERROR(N'Danh sách không tồn tại hoặc không thuộc về người dùng.', 16, 1);
            RETURN;
        END

        -- Lấy danh sách thành viên
        SELECT 
            u.id AS member_user_id,
            u.username,
            u.display_name,
            cplm.added_at
        FROM tblCustomPrivacyListMembers cplm
        JOIN tblUser u ON cplm.member_user_id = u.id
        WHERE cplm.list_id = @list_id AND cplm.status = 1 AND u.status = 1
        ORDER BY cplm.added_at DESC;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH;
END;
GO

CREATE PROCEDURE sp_RemoveMemberFromCustomList
    @user_id INT,
    @list_id INT,
    @member_user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra user_id tồn tại và active
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id AND status = 1)
        BEGIN
            RAISERROR(N'Người dùng không hợp lệ hoặc không hoạt động.', 16, 1);
            RETURN;
        END

        -- Kiểm tra list_id tồn tại và thuộc về user_id
        IF NOT EXISTS (SELECT 1 FROM tblCustomPrivacyLists WHERE id = @list_id AND user_id = @user_id AND status = 1)
        BEGIN
            RAISERROR(N'Danh sách không tồn tại hoặc không thuộc về người dùng.', 16, 1);
            RETURN;
        END

        -- Kiểm tra member_user_id tồn tại và active
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @member_user_id AND status = 1)
        BEGIN
            RAISERROR(N'Thành viên không hợp lệ hoặc không hoạt động.', 16, 1);
            RETURN;
        END

        -- Kiểm tra xem thành viên có trong danh sách không
        IF NOT EXISTS (SELECT 1 FROM tblCustomPrivacyListMembers WHERE list_id = @list_id AND member_user_id = @member_user_id AND status = 1)
        BEGIN
            RAISERROR(N'Thành viên không có trong danh sách.', 16, 1);
            RETURN;
        END

        -- Xóa thành viên khỏi danh sách
        UPDATE tblCustomPrivacyListMembers
        SET status = 0
        WHERE list_id = @list_id AND member_user_id = @member_user_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@ErrorMessage, GETDATE());
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH;
END;
GO


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


    CREATE OR ALTER TRIGGER trg_ValidateContentPrivacy
ON tblContentPrivacy
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @invalid_content TABLE (content_id INT, content_type_id INT);
    DECLARE @error_msg NVARCHAR(4000) = '';

    INSERT INTO @invalid_content (content_id, content_type_id)
    SELECT i.content_id, i.content_type_id
    FROM inserted i
    WHERE
        (i.content_type_id = 1 AND NOT EXISTS (SELECT 1 FROM tblPost WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 2 AND NOT EXISTS (SELECT 1 FROM tblComment WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 3 AND NOT EXISTS (SELECT 1 FROM tblStory WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 4 AND NOT EXISTS (SELECT 1 FROM tblUser WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 5 AND NOT EXISTS (SELECT 1 FROM tblMedia WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 6 AND NOT EXISTS (SELECT 1 FROM tblGroup WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 7 AND NOT EXISTS (SELECT 1 FROM tblPage WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 8 AND NOT EXISTS (SELECT 1 FROM tblMessage WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 9 AND NOT EXISTS (SELECT 1 FROM tblCallSession WHERE id = i.content_id AND status = 1))
        OR (i.content_type_id = 10 AND NOT EXISTS (SELECT 1 FROM tblNotification WHERE id = i.content_id AND status_id = 1))
        OR (i.content_type_id = 11 AND NOT EXISTS (SELECT 1 FROM tblReport WHERE id = i.content_id AND status = 1));

    IF EXISTS (SELECT 1 FROM @invalid_content)
    BEGIN
        SELECT @error_msg = @error_msg + 'Invalid content_id ' + CAST(content_id AS NVARCHAR(10)) +
                            ' for content_type_id ' + CAST(content_type_id AS NVARCHAR(10)) + '; '
        FROM @invalid_content;

        IF @error_msg = ''
            SET @error_msg = 'Invalid content detected in tblContentPrivacy.';

        THROW 50001, @error_msg, 1;
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
            -- Bắt đầu giao dịch trước các kiểm tra
            BEGIN TRANSACTION;

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
            IF @@TRANCOUNT > 0
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

    CREATE OR ALTER TRIGGER trg_SoftDelete_User
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

            -- Cập nhật status của media liên quan
            UPDATE m
            SET m.status = 0
            FROM tblMedia m
            WHERE m.status = 1 AND m.target_id IN (
                SELECT id FROM tblPost WHERE owner_id IN (SELECT id FROM @deletedUsers) AND status = 1
                UNION
                SELECT id FROM tblComment WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1
                UNION
                SELECT id FROM tblStory WHERE user_id IN (SELECT id FROM @deletedUsers) AND status = 1
                UNION
                SELECT id FROM tblMessage WHERE sender_id IN (SELECT id FROM @deletedUsers) AND status = 1
            );

            -- Cập nhật các bảng khác như trước
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

	CREATE PROCEDURE sp_AcceptFriendRequest
    @user_id INT,
    @friend_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- Kiểm tra xem có lời mời pending từ friend_id đến user_id không
        IF NOT EXISTS (
            SELECT 1 
            FROM tblFriendship 
            WHERE user_id = @friend_id 
            AND friend_id = @user_id 
            AND friendship_status = 'pending' 
        )
        BEGIN
            RAISERROR ('No pending friend request found.', 16, 1);
        END

        -- Cập nhật trạng thái lời mời thành accepted
        UPDATE tblFriendship
        SET friendship_status = 'accepted'
        WHERE user_id = @friend_id 
        AND friend_id = @user_id 
        AND status = 1;

        -- Kiểm tra số hàng bị ảnh hưởng
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR ('Failed to update friend request status.', 16, 1);
        END

        -- Gửi thông báo
        DECLARE @type_id INT;
        SELECT @type_id = id 
        FROM tblNotificationType 
        WHERE name = 'FRIEND_ACCEPTED' 
        AND status = 1;

        IF @type_id IS NULL
        BEGIN
            INSERT INTO tblNotificationType (name, description, status)
            VALUES ('FRIEND_ACCEPTED', 'Friend request accepted', 1);
            SET @type_id = SCOPE_IDENTITY();
        END

        -- Lấy target_type_id từ tblTargetType
        DECLARE @target_type_id INT;
        SELECT @target_type_id = id 
        FROM tblTargetType 
        WHERE code = 'PROFILE';

        IF @target_type_id IS NULL
        BEGIN
            RAISERROR ('Target type PROFILE does not exist or is inactive.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @message NVARCHAR(255);
        SET @message = 'User ' + CAST(@user_id AS NVARCHAR(10)) + ' accepted your friend request.';
        EXEC sp_AddNotification 
            @user_id = @friend_id, -- Người nhận thông báo
            @type_id = @type_id,
            @message = @message,
            @target_id = @user_id, -- Người chấp nhận là target
            @target_type_id = @target_type_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @error_message NVARCHAR(4000) = 'Error in sp_AcceptFriendRequest: ' + ERROR_MESSAGE();
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (@error_message, GETDATE());
        RAISERROR (@error_message, 16, 1);
        RETURN;
    END CATCH;
END;
GO

	-- Stored Procedure cho từ chối lời mời kết bạn
	CREATE PROCEDURE sp_RejectFriendRequest
		@user_id INT,
		@friend_id INT
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			IF NOT EXISTS (SELECT 1 FROM tblFriendship WHERE user_id = @friend_id AND friend_id = @user_id AND friendship_status = 'pending' AND status = 1)
			BEGIN
				RAISERROR('No pending friend request found.', 16, 1);
				ROLLBACK TRANSACTION;
				RETURN;
			END
			UPDATE tblFriendship
			SET friendship_status = 'rejected'
			WHERE user_id = @friend_id AND friend_id = @user_id;
			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time) VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	GO

	-- Stored Procedure cho hủy kết bạn
	CREATE PROCEDURE sp_CancelFriendship
    @user_id INT,
    @friend_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (
            SELECT 1 
            FROM tblFriendship 
            WHERE (user_id = @user_id AND friend_id = @friend_id OR user_id = @friend_id AND friend_id = @user_id) 
            AND status = 1
        )
        BEGIN
            RAISERROR ('Friendship not found.', 16, 1);
        END

        -- Xóa hoàn toàn bản ghi thay vì cập nhật status
        DELETE FROM tblFriendship
        WHERE (user_id = @user_id AND friend_id = @friend_id) 
        OR (user_id = @friend_id AND friend_id = @user_id);

        -- Kiểm tra xem bản ghi đã xóa thành công không
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR ('Failed to delete friendship record. Record may have been modified.', 16, 1);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (ERROR_MESSAGE(), GETDATE());
        RETURN;
    END CATCH;
END;
GO

	CREATE OR ALTER TRIGGER trg_AfterFriendshipUpdate
ON tblFriendship
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF UPDATE(friendship_status)
        BEGIN
            IF EXISTS (
                SELECT 1 
                FROM inserted i 
                JOIN deleted d ON i.user_id = d.user_id AND i.friend_id = d.friend_id 
                WHERE i.friendship_status = 'accepted' 
                AND d.friendship_status = 'pending' 
            )
            BEGIN
                DECLARE @user_id INT, @friend_id INT, @type_id INT, @target_type_id INT, @display_name NVARCHAR(50);
                SELECT @user_id = i.user_id, @friend_id = i.friend_id
                FROM inserted i;
                SELECT @display_name = display_name FROM tblUser WHERE id = @user_id;
                SELECT @type_id = id 
                FROM tblNotificationType 
                WHERE name = 'FRIEND_ACCEPTED' AND status = 1;
                IF @type_id IS NULL
                BEGIN
                    INSERT INTO tblNotificationType (name, description, status)
                    VALUES ('FRIEND_ACCEPTED', 'Friend request accepted', 1);
                    SET @type_id = SCOPE_IDENTITY();
                END
                SELECT @target_type_id = id 
                FROM tblTargetType 
                WHERE code = 'PROFILE';
                IF @target_type_id IS NULL
                BEGIN
                    INSERT INTO tblErrorLog (error_message, error_time)
                    VALUES ('Target type PROFILE does not exist or is inactive in trg_AfterFriendshipUpdate.', GETDATE());
                    RETURN;
                END
                DECLARE @message NVARCHAR(255);
                SET @message = ISNULL(@display_name, 'User ' + CAST(@user_id AS NVARCHAR(10))) + ' accepted your friend request.';
                EXEC sp_AddNotification 
                    @user_id = @friend_id,
                    @type_id = @type_id,
                    @message = @message,
                    @target_id = @user_id,
                    @target_type_id = @target_type_id;
            END
        END
    END TRY
    BEGIN CATCH
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES ('Error in trg_AfterFriendshipUpdate: ' + ERROR_MESSAGE(), GETDATE());
        RETURN;
    END CATCH;
END;
GO


    CREATE TABLE tblFriendSuggestion (
        user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        suggested_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        mutual_friend_count INT NOT NULL,
        suggested_at DATETIME DEFAULT GETDATE(),
        expiration_date DATETIME NULL,
        PRIMARY KEY (user_id, suggested_user_id)
    );

    ------------PROC FOR SUGGEST FRIEND

	CREATE OR ALTER PROCEDURE sp_UpdateAllFriendSuggestions
		@radius_km FLOAT = 10
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			-- Xóa gợi ý hết hạn
			DELETE FROM tblFriendSuggestion WHERE expiration_date <= GETDATE();

			DECLARE @NewSuggestions TABLE (
				user_id INT,
				suggested_user_id INT,
				mutual_friend_count INT,
				suggested_at DATETIME
			);

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
			GROUP BY f1.user_id, f2.friend_id
			HAVING COUNT(*) >= 1;

			-- Gợi ý dựa trên vị trí
			DECLARE @LocationSuggestions TABLE (
				user_id INT,
				suggested_user_id INT,
				distance_km FLOAT,
				suggested_at DATETIME
			);

			INSERT INTO @LocationSuggestions (user_id, suggested_user_id, distance_km, suggested_at)
			SELECT
				ul1.user_id,
				ul2.user_id AS suggested_user_id,
				ROUND(
					6371 * ACOS(
						COS(RADIANS(ul1.latitude)) * COS(RADIANS(ul2.latitude)) * 
						COS(RADIANS(ul2.longitude) - RADIANS(ul1.longitude)) + 
						SIN(RADIANS(ul1.latitude)) * SIN(RADIANS(ul2.latitude))
					), 2) AS distance_km,
				GETDATE() AS suggested_at
			FROM tblLocation ul1
			CROSS JOIN tblLocation ul2
			WHERE
				ul1.user_id <> ul2.user_id
				AND ul1.user_id IN (SELECT id FROM tblUser WHERE status = 1)
				AND ul2.user_id IN (SELECT id FROM tblUser WHERE status = 1)
				AND 6371 * ACOS(
					COS(RADIANS(ul1.latitude)) * COS(RADIANS(ul2.latitude)) * 
					COS(RADIANS(ul2.longitude) - RADIANS(ul1.longitude)) + 
					SIN(RADIANS(ul1.latitude)) * SIN(RADIANS(ul2.latitude))
				) <= @radius_km
				AND ul2.user_id NOT IN (
					SELECT friend_id FROM tblFriendship
					WHERE user_id = ul1.user_id AND friendship_status = 'accepted'
				)
				AND ul2.user_id NOT IN (
					SELECT blocked_user_id FROM tblBlock WHERE user_id = ul1.user_id AND status = 1
					UNION
					SELECT user_id FROM tblBlock WHERE blocked_user_id = ul1.user_id AND status = 1
				);

			-- Kết hợp gợi ý FOAF và vị trí vào tblFriendSuggestion
			MERGE INTO tblFriendSuggestion AS target
			USING (
				SELECT user_id, suggested_user_id, mutual_friend_count, suggested_at
				FROM @NewSuggestions
				UNION
				SELECT user_id, suggested_user_id, 0 AS mutual_friend_count, suggested_at
				FROM @LocationSuggestions
			) AS source
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

	CREATE PROCEDURE sp_FollowUser
		@follower_id INT,
		@followee_id INT
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			-- Kiểm tra xem follower_id và followee_id có tồn tại trong tblUser không
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @follower_id AND status = 1)
			BEGIN
				RAISERROR ('Follower user ID does not exist or is inactive.', 16, 1);
			END
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @followee_id AND status = 1)
			BEGIN
				RAISERROR ('Followee user ID does not exist or is inactive.', 16, 1);
			END

			IF @follower_id = @followee_id
			BEGIN
				RAISERROR ('Cannot follow yourself.', 16, 1);
			END

			IF EXISTS (
				SELECT 1 
				FROM tblFollow 
				WHERE follower_id = @follower_id 
				AND followee_id = @followee_id 
			)
			BEGIN
				RAISERROR ('Already following or follow record exists.', 16, 1);
			END

			-- Thêm bản ghi follow
			INSERT INTO tblFollow (follower_id, followee_id, created_at, status)
			VALUES (@follower_id, @followee_id, GETDATE(), 1);

			-- Kiểm tra số hàng bị ảnh hưởng
			IF @@ROWCOUNT = 0
			BEGIN
				RAISERROR ('Failed to insert follow record.', 16, 1);
			END

			-- Gửi thông báo
			DECLARE @type_id INT;
			SELECT @type_id = id 
			FROM tblNotificationType 
			WHERE name = 'FOLLOW' 
			AND status = 1;

			IF @type_id IS NULL
			BEGIN
				INSERT INTO tblNotificationType (name, description, status)
				VALUES ('FOLLOW', 'User started following', 1);
				SET @type_id = SCOPE_IDENTITY();
			END

			DECLARE @target_type_id INT;
			SELECT @target_type_id = id 
			FROM tblTargetType 
			WHERE code = 'PROFILE';

			IF @target_type_id IS NULL
			BEGIN
				RAISERROR ('Target type PROFILE does not exist or is inactive.', 16, 1);
				ROLLBACK TRANSACTION;
				RETURN;
			END

			DECLARE @message NVARCHAR(255);
			SET @message = 'User ' + CAST(@follower_id AS NVARCHAR(10)) + ' started following you.';
			EXEC sp_AddNotification 
				@user_id = @followee_id,
				@type_id = @type_id,
				@message = @message,
				@target_id = @follower_id,
				@target_type_id = @target_type_id;

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @error_message NVARCHAR(4000) = 'Error in sp_FollowUser: ' + ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@error_message, GETDATE());
			RAISERROR (@error_message, 16, 1);
			RETURN;
		END CATCH;
	END;
	GO

	CREATE PROCEDURE sp_UnfollowUser
    @follower_id INT,
    @followee_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (
            SELECT 1 
            FROM tblFollow 
            WHERE follower_id = @follower_id 
            AND followee_id = @followee_id 
            AND status = 1
        )
        BEGIN
            RAISERROR ('Not following this user.', 16, 1);
        END

        -- Xóa hoàn toàn bản ghi thay vì cập nhật status
        DELETE FROM tblFollow
        WHERE follower_id = @follower_id 
        AND followee_id = @followee_id;

        -- Kiểm tra xem bản ghi đã xóa thành công không
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR ('Failed to delete follow record. Record may have been modified.', 16, 1);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        INSERT INTO tblErrorLog (error_message, error_time)
        VALUES (ERROR_MESSAGE(), GETDATE());
        RETURN;
    END CATCH;
END;
GO

    CREATE TABLE tblBlock (
        user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        blocked_user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        created_at DATETIME DEFAULT GETDATE(),
        status BIT DEFAULT 1,
        PRIMARY KEY (user_id, blocked_user_id)
    );

	CREATE PROCEDURE sp_BlockUser
		@user_id INT,           -- Người chặn
		@blocked_user_id INT    -- Người bị chặn
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			-- Kiểm tra xem user_id và blocked_user_id có tồn tại trong tblUser không
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @user_id)
			BEGIN
				RAISERROR ('Blocker user ID does not exist.', 16, 1);
			END
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @blocked_user_id)
			BEGIN
				RAISERROR ('Blocked user ID does not exist.', 16, 1);
			END

			IF @user_id = @blocked_user_id
			BEGIN
				RAISERROR ('Cannot block yourself.', 16, 1);
			END

			IF EXISTS (
				SELECT 1 
				FROM tblBlock 
				WHERE user_id = @user_id 
				AND blocked_user_id = @blocked_user_id 
				AND status = 1
			)
			BEGIN
				RAISERROR ('User is already blocked.', 16, 1);
			END

			-- Kiểm tra và xóa friendship hoặc follow nếu có
			UPDATE tblFriendship
			SET status = 0
			WHERE (user_id = @user_id AND friend_id = @blocked_user_id)
			OR (user_id = @blocked_user_id AND friend_id = @user_id);

			UPDATE tblFollow
			SET status = 0
			WHERE (follower_id = @user_id AND followee_id = @blocked_user_id)
			OR (follower_id = @blocked_user_id AND followee_id = @user_id);

			-- Thêm bản ghi chặn
			INSERT INTO tblBlock (user_id, blocked_user_id, created_at, status)
			VALUES (@user_id, @blocked_user_id, GETDATE(), 1);

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @error_message NVARCHAR(4000) = 'Error in sp_BlockUser: ' + ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@error_message, GETDATE());
			RAISERROR (@error_message, 16, 1);
			RETURN;
		END CATCH;
	END;
	GO

	CREATE PROCEDURE sp_UnblockUser
		@user_id INT,           -- Người chặn
		@blocked_user_id INT    -- Người bị chặn
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			IF NOT EXISTS (
				SELECT 1 
				FROM tblBlock 
				WHERE user_id = @user_id 
				AND blocked_user_id = @blocked_user_id 
				AND status = 1
			)
			BEGIN
				RAISERROR ('User is not blocked.', 16, 1);
			END

			-- Xóa hoàn toàn bản ghi thay vì cập nhật status
			DELETE FROM tblBlock
			WHERE user_id = @user_id 
			AND blocked_user_id = @blocked_user_id;

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (ERROR_MESSAGE(), GETDATE());
			RETURN;
		END CATCH;
	END;
	GO


    ------------------------------------------

    --STORY

    CREATE TABLE tblStory (
        id INT PRIMARY KEY IDENTITY(1, 1),
        user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        created_at DATETIME DEFAULT GETDATE(),
        expire_time AS DATEADD(HOUR, 24, created_at) PERSISTED,
        caption NVARCHAR(255),
        privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
        background_color VARCHAR(50),
        status BIT DEFAULT 1
    );

    CREATE OR ALTER PROCEDURE sp_CleanExpiredStories
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

        -- Cập nhật trạng thái của media liên quan
        UPDATE tblMedia
        SET status = 0
        WHERE target_type_id = 3
          AND target_id IN (
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

    CREATE OR ALTER PROCEDURE sp_CreateStory
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
                THROW 50001, 'Người dùng không hợp lệ hoặc không hoạt động.', 1;
                RETURN;
            END

            -- Kiểm tra media_url không rỗng
            IF @media_url IS NULL OR LTRIM(RTRIM(@media_url)) = ''
            BEGIN
                THROW 50002, 'URL media không được để trống.', 1;
                RETURN;
            END

            -- Kiểm tra media_type hợp lệ
            IF @media_type NOT IN ('image', 'video', 'audio')
            BEGIN
                THROW 50003, 'Loại media không hợp lệ.', 1;
                RETURN;
            END

            -- Kiểm tra từ khóa bị cấm trong caption
            IF @caption IS NOT NULL AND EXISTS (
                SELECT 1 FROM tblBannedKeyword bk
                WHERE @caption LIKE '%' + bk.keyword + '%' AND bk.status = 1
            )
            BEGIN
                THROW 50004, 'Mô tả chứa từ khóa bị cấm.', 1;
                RETURN;
            END

            -- Kiểm tra chính sách nội dung trong caption
            IF @caption IS NOT NULL
            BEGIN
                DECLARE @policy_valid BIT;
                EXEC sp_CheckContentPolicy @caption, @policy_valid OUTPUT;
                IF @policy_valid = 0
                BEGIN
                    THROW 50005, 'Mô tả vi phạm chính sách nền tảng.', 1;
                    RETURN;
                END
            END

            -- Kiểm tra privacy_setting hợp lệ
            IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
            BEGIN
                THROW 50006, 'Cài đặt quyền riêng tư không hợp lệ.', 1;
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
                THROW 50007, 'custom_list_id không hợp lệ hoặc thiếu cho quyền riêng tư tùy chỉnh.', 1;
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
                    THROW 50008, 'Người dùng bị chặn bởi một hoặc nhiều thành viên trong danh sách tùy chỉnh.', 1;
                    RETURN;
                END

                IF EXISTS (
                    SELECT 1 FROM tblBlock b
                    JOIN tblCustomPrivacyLists cpl ON cpl.user_id = b.blocked_user_id
                    WHERE cpl.id = @custom_list_id AND b.user_id = @user_id AND b.status = 1
                )
                BEGIN
                    THROW 50009, 'Người dùng bị chặn bởi chủ danh sách tùy chỉnh.', 1;
                    RETURN;
                END
            END

            -- Thêm câu chuyện mới
            INSERT INTO tblStory (user_id, caption, privacy_setting, background_color, created_at, status)
            VALUES (@user_id, @caption, @privacy_setting, @background_color, GETDATE(), 1);

            -- Lấy ID câu chuyện vừa thêm
            SET @new_story_id = SCOPE_IDENTITY();

            -- Thêm media vào tblMedia
            DECLARE @media_type_id INT;
            SELECT @media_type_id = id FROM tblMediaType WHERE name = @media_type AND status = 1;

            IF @media_type_id IS NOT NULL
            BEGIN
                INSERT INTO tblMedia (target_id, target_type_id, media_type_id, media_url, caption, created_at, status)
                VALUES (@new_story_id, 3, @media_type_id, @media_url, @caption, GETDATE(), 1);
            END
            ELSE
            BEGIN
                THROW 50010, 'Loại media không tồn tại trong tblMediaType.', 1;
                RETURN;
            END

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
		group_id INT NULL FOREIGN KEY REFERENCES tblGroup(id),
        status BIT DEFAULT 1,
		latitude FLOAT NULL,
		longitude FLOAT NULL,
		location_name NVARCHAR(255) NULL
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

    CREATE TABLE tblComment (
        id INT PRIMARY KEY IDENTITY(1, 1),
        parent_comment_id INT NULL,
        user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        post_id INT NOT NULL FOREIGN KEY REFERENCES tblPost(id),
        content NVARCHAR(1000),
        privacy_setting VARCHAR(20) CHECK (privacy_setting IN ('public', 'friends', 'only_me', 'custom', 'default')) DEFAULT 'default',
        created_at DATETIME DEFAULT GETDATE(),
		updated_at DATETIME DEFAULT GETDATE(),
        status BIT DEFAULT 1,
        CONSTRAINT FK_Comment_Parent FOREIGN KEY (parent_comment_id) REFERENCES tblComment(id),
    );
	--THIS ALL INDEX IS RELATED TO OPTIMIZE POST--
	CREATE NONCLUSTERED INDEX idx_post_status_created_at ON tblPost (status, created_at);
	CREATE NONCLUSTERED INDEX idx_post_owner_status ON tblPost (owner_id, status);
	CREATE NONCLUSTERED INDEX idx_post_group_status ON tblPost (group_id, status);
	--index for hiddenPost
	CREATE NONCLUSTERED INDEX idx_hidden_post_user_status ON tblHiddenPost (user_id, status) INCLUDE (post_id);
	--index for comment
	CREATE NONCLUSTERED INDEX idx_comment_post_status ON tblComment (post_id, status) INCLUDE (id, content, user_id, created_at, updated_at, parent_comment_id);
	--index for reaction
	CREATE NONCLUSTERED INDEX idx_reaction_target_type_status ON tblReaction (target_id, target_type_id, status) INCLUDE (reaction_type_id);
	--index for privacy
	CREATE NONCLUSTERED INDEX idx_content_privacy_content_type ON tblContentPrivacy (content_id, content_type_id) INCLUDE (privacy_setting, custom_list_id);

	    --------------PROC VALIDATE AND CREATE POST--------------

	CREATE OR ALTER PROCEDURE sp_CreatePost 
		@owner_id INT,
		@content NVARCHAR(MAX),
		@privacy_setting VARCHAR(20),
		@media_urls NVARCHAR(MAX) = NULL,
		@tagged_user_ids NVARCHAR(MAX) = NULL,
		@custom_list_id INT = NULL,
		@group_id INT = NULL,
		@latitude FLOAT = NULL,
		@longitude FLOAT = NULL,
		@location_name NVARCHAR(255) = NULL,
		@new_post_id INT OUTPUT
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			-- Kiểm tra owner_id hợp lệ
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @owner_id AND status = 1)
			BEGIN
				RAISERROR('Người dùng không hợp lệ hoặc không hoạt động.', 16, 1);
				RETURN;
			END

			-- Kiểm tra nội dung
			IF @content IS NULL OR LTRIM(RTRIM(@content)) = ''
			BEGIN
				RAISERROR('Nội dung không được để trống.', 16, 1);
				RETURN;
			END

			-- Kiểm tra từ khóa bị cấm
			IF EXISTS (
				SELECT 1 FROM tblBannedKeyword bk
				WHERE @content LIKE '%' + bk.keyword + '%' AND bk.status = 1
			)
			BEGIN
				RAISERROR('Nội dung chứa từ khóa bị cấm.', 16, 1);
				RETURN;
			END

			-- Chính sách nội dung
			DECLARE @policy_valid BIT;
			EXEC sp_CheckContentPolicy @content, @policy_valid OUTPUT;
			IF @policy_valid = 0
			BEGIN
				RAISERROR('Nội dung vi phạm chính sách nền tảng.', 16, 1);
				RETURN;
			END

			-- Kiểm tra quyền riêng tư
			IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
			BEGIN
				RAISERROR('Cài đặt quyền riêng tư không hợp lệ.', 16, 1);
				RETURN;
			END

			-- Xử lý custom list
			IF @privacy_setting = 'custom' AND (@custom_list_id IS NULL OR NOT EXISTS (
				SELECT 1 FROM tblCustomPrivacyLists
				WHERE id = @custom_list_id AND user_id = @owner_id AND status = 1))
			BEGIN
				RAISERROR('custom_list_id không hợp lệ hoặc thiếu cho quyền riêng tư tùy chỉnh.', 16, 1);
				RETURN;
			END

			IF @privacy_setting = 'custom' AND @custom_list_id IS NOT NULL
			BEGIN
				IF EXISTS (
					SELECT 1 FROM tblBlock b
					JOIN tblCustomPrivacyListMembers cplm ON b.blocked_user_id = cplm.member_user_id
					WHERE cplm.list_id = @custom_list_id AND b.user_id = @owner_id AND b.status = 1)
				BEGIN
					RAISERROR('Người dùng bị chặn bởi thành viên danh sách.', 16, 1);
					RETURN;
				END

				IF EXISTS (
					SELECT 1 FROM tblBlock b
					JOIN tblCustomPrivacyLists cpl ON cpl.user_id = b.blocked_user_id
					WHERE cpl.id = @custom_list_id AND b.user_id = @owner_id AND b.status = 1)
				BEGIN
					RAISERROR('Người dùng bị chặn bởi chủ danh sách.', 16, 1);
					RETURN;
				END
			END

			-- Kiểm tra nếu là post group thì group_id phải hợp lệ và user là thành viên
			IF @group_id IS NOT NULL
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM tblGroup g
					JOIN tblGroupMember gm ON gm.group_id = g.id
					WHERE g.id = @group_id AND g.status = 1
						  AND gm.user_id = @owner_id AND gm.status = 1)
				BEGIN
					RAISERROR('Không thể đăng vào nhóm: Nhóm không tồn tại hoặc bạn không phải thành viên.', 16, 1);
					RETURN;
				END
			END

			-- Tạo bài viết
			INSERT INTO tblPost (owner_id, content, privacy_setting, group_id, created_at, status, latitude, longitude, location_name)
			VALUES (@owner_id, @content, @privacy_setting, @group_id, GETDATE(), 1, @latitude, @longitude, @location_name);

			SET @new_post_id = SCOPE_IDENTITY();

			-- Lưu privacy riêng nếu không default
			IF @privacy_setting != 'default'
			BEGIN
				INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
				VALUES (@new_post_id, 1, @privacy_setting, @custom_list_id, GETDATE(), 1);
			END

			-- Xử lý media
			IF @media_urls IS NOT NULL AND LTRIM(RTRIM(@media_urls)) <> ''
			BEGIN
				DECLARE @pos INT = 1, @len INT, @url VARCHAR(512), @media_type VARCHAR(10), @media_type_id INT;
				SET @media_urls = @media_urls + ',';

				WHILE CHARINDEX(',', @media_urls, @pos) > 0
				BEGIN
					SET @len = CHARINDEX(',', @media_urls, @pos) - @pos;
					SET @url = SUBSTRING(@media_urls, @pos, @len);
					SET @pos = CHARINDEX(',', @media_urls, @pos) + 1;

					IF LTRIM(RTRIM(@url)) <> ''
					BEGIN
						SET @media_type = CASE
							WHEN @url LIKE '%.jpg' OR @url LIKE '%.png' OR @url LIKE '%.jpeg' THEN 'image'
							WHEN @url LIKE '%.mp4' OR @url LIKE '%.mov' THEN 'video'
							WHEN @url LIKE '%.mp3' OR @url LIKE '%.wav' THEN 'audio'
							ELSE 'image'
						END;

						SELECT @media_type_id = id FROM tblMediaType WHERE name = @media_type AND status = 1;

						IF @media_type_id IS NOT NULL
						BEGIN
							INSERT INTO tblMedia (target_id, target_type_id, media_type_id, media_url, created_at, status)
							VALUES (@new_post_id, 1, @media_type_id, @url, GETDATE(), 1);
						END
					END
				END
			END

			-- Xử lý tag user
			IF @tagged_user_ids IS NOT NULL AND LTRIM(RTRIM(@tagged_user_ids)) <> ''
			BEGIN
				DECLARE @tag_pos INT = 1, @tag_len INT, @id_str VARCHAR(20), @tagged_user_id INT, @has_access BIT;
				SET @tagged_user_ids = @tagged_user_ids + ',';

				WHILE CHARINDEX(',', @tagged_user_ids, @tag_pos) > 0
				BEGIN
					SET @tag_len = CHARINDEX(',', @tagged_user_ids, @tag_pos) - @tag_pos;
					SET @id_str = SUBSTRING(@tagged_user_ids, @tag_pos, @tag_len);
					SET @tag_pos = CHARINDEX(',', @tagged_user_ids, @tag_pos) + 1;

					IF ISNUMERIC(@id_str) = 1
					BEGIN
						SET @tagged_user_id = CAST(@id_str AS INT);
						EXEC sp_CheckContentAccess @tagged_user_id, @new_post_id, 1, @has_access OUTPUT;

						IF @has_access = 1
						   AND EXISTS (SELECT 1 FROM tblUser WHERE id = @tagged_user_id AND status = 1)
						   AND NOT EXISTS (
							   SELECT 1 FROM tblBlock
							   WHERE user_id = @owner_id AND blocked_user_id = @tagged_user_id AND status = 1)
						BEGIN
							INSERT INTO tblPostTag (post_id, tagged_user_id, status)
							VALUES (@new_post_id, @tagged_user_id, 1);
						END
					END
				END
			END

			-- Ghi log
			DECLARE @action_type_id INT;
			SELECT @action_type_id = id FROM tblActionType WHERE name = 'POST_CREATE';
			EXEC sp_LogActivity @owner_id, @action_type_id, NULL, NULL, 1, @new_post_id, 'POST';

		END TRY
		BEGIN CATCH
			THROW;
		END CATCH
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
        INSERT INTO tblComment (
			parent_comment_id, user_id, post_id, content, privacy_setting, created_at, updated_at, status
		)
		VALUES (
			@parent_comment_id, @user_id, @post_id, @content, @privacy_setting, GETDATE(), GETDATE(), 1
		);

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

	
		CREATE PROCEDURE sp_UpdateComment
			@comment_id INT,
			@user_id INT,
			@new_content NVARCHAR(1000)
		AS
		BEGIN
			SET NOCOUNT ON;

			DECLARE @existing_user_id INT;

			-- Kiểm tra comment tồn tại và đang hoạt động
			IF NOT EXISTS (SELECT 1 FROM tblComment WHERE id = @comment_id AND status = 1)
			BEGIN
				RAISERROR('Comment not found or inactive.', 16, 1);
				RETURN;
			END

			-- Lấy user_id của comment
			SELECT @existing_user_id = user_id FROM tblComment WHERE id = @comment_id;

			-- Kiểm tra quyền chỉnh sửa
			IF @existing_user_id != @user_id
			BEGIN
				RAISERROR('You are not authorized to update this comment.', 16, 1);
				RETURN;
			END

			-- Kiểm tra content mới
			IF @new_content IS NULL OR LTRIM(RTRIM(@new_content)) = ''
			BEGIN
				RAISERROR('Content cannot be empty.', 16, 1);
				RETURN;
			END

			-- Kiểm tra từ khóa bị cấm
			IF EXISTS (
				SELECT 1 FROM tblBannedKeyword bk
				WHERE @new_content LIKE '%' + bk.keyword + '%' AND bk.status = 1
			)
			BEGIN
				RAISERROR('Content contains banned keywords.', 16, 1);
				RETURN;
			END

			-- Kiểm tra chính sách nội dung
			DECLARE @policy_valid BIT;
			EXEC sp_CheckContentPolicy @new_content, @policy_valid OUTPUT;
			IF @policy_valid = 0
			BEGIN
				RAISERROR('Content violates platform policies.', 16, 1);
				RETURN;
			END

			-- Cập nhật comment
			UPDATE tblComment
			SET content = @new_content,
				updated_at = GETDATE()
			WHERE id = @comment_id;
		END;

    ---------------------------------------------------------------------

    --CHAT

    CREATE TABLE tblChat (
        id INT PRIMARY KEY IDENTITY(1, 1),
        is_group BIT DEFAULT 0,
        name NVARCHAR(100) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        status BIT DEFAULT 1
    );


    --------------TRIGGER FOR CHECK NAME OF GROUP IS NULL?--------------

    CREATE TRIGGER trg_ValidateChatName
    ON tblChat
    INSTEAD OF INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Declare variables for error logging
        DECLARE @error_msg NVARCHAR(4000) = '';

        -- Check for empty or NULL group name when is_group = 1
        IF EXISTS (
            SELECT 1
            FROM inserted
            WHERE is_group = 1 AND (name IS NULL OR LTRIM(RTRIM(name)) = '')
        )
        BEGIN
            SET @error_msg = 'Group name is required when is_group = 1.';

            -- Log error to tblErrorLog table
            BEGIN TRY
                INSERT INTO tblErrorLog (error_message, error_time, status)
                VALUES (@error_msg, GETDATE(), 1);
            END TRY
            BEGIN CATCH
                -- If logging fails, append failure to error message
                SET @error_msg = @error_msg + ' Failed to log error to tblErrorLog table: ' + ERROR_MESSAGE();
            END CATCH;

            -- Throw error to notify the caller
            THROW 50001, @error_msg, 1;
            RETURN;
        END

        -- Perform insert or update for valid data
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

	CREATE TABLE tblMessageStatus (
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES tblMessage(id),
    FOREIGN KEY (user_id) REFERENCES tblUser(id)
);

    CREATE TABLE tblCallSession (
        id INT PRIMARY KEY IDENTITY(1, 1),
        chat_id INT NOT NULL FOREIGN KEY REFERENCES tblChat(id),
        host_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        start_time DATETIME,
        end_time DATETIME,
        status BIT DEFAULT 1
    );

	CREATE OR ALTER PROCEDURE sp_MarkChatMemberAsSpam
		@chat_id INT,
		@user_id INT, -- Người thực hiện hành động đánh dấu
		@target_user_id INT -- Người bị đánh dấu là spam
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			BEGIN TRANSACTION;

			-- Kiểm tra xem chat_id có tồn tại và đang hoạt động không
			IF NOT EXISTS (SELECT 1 FROM tblChat WHERE id = @chat_id AND status = 1)
			BEGIN
				RAISERROR(N'Đoạn chat không tồn tại hoặc không hoạt động.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem user_id có tồn tại, đang hoạt động và là thành viên của đoạn chat không
			IF NOT EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @user_id AND status = 1
			)
			BEGIN
				RAISERROR(N'Người dùng không hợp lệ hoặc không phải thành viên của đoạn chat.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem target_user_id có tồn tại, đang hoạt động và là thành viên của đoạn chat không
			IF NOT EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @target_user_id AND status = 1
			)
			BEGIN
				RAISERROR(N'Người bị đánh dấu không hợp lệ hoặc không phải thành viên của đoạn chat.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem user_id có bị chặn bởi target_user_id không
			IF EXISTS (
				SELECT 1 FROM tblBlock 
				WHERE user_id = @target_user_id AND blocked_user_id = @user_id AND status = 1
			)
			BEGIN
				RAISERROR(N'Không thể đánh dấu người dùng là spam vì bạn đã bị chặn.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem target_user_id đã bị đánh dấu là spam chưa
			IF EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @target_user_id AND is_spam = 1
			)
			BEGIN
				RAISERROR(N'Người dùng đã được đánh dấu là spam trong đoạn chat này.', 16, 1);
				RETURN;
			END

			-- Cập nhật trạng thái is_spam
			UPDATE tblChatMember
			SET is_spam = 1
			WHERE chat_id = @chat_id AND user_id = @target_user_id;

			-- Ghi log hành động
			DECLARE @action_type_id INT;
			SELECT @action_type_id = id FROM tblActionType WHERE name = 'MARK_CHAT_SPAM';
			IF @action_type_id IS NULL
			BEGIN
				INSERT INTO tblActionType (name, description)
				VALUES ('MARK_CHAT_SPAM', N'User marked a chat member as spam');
				SET @action_type_id = SCOPE_IDENTITY();
			END

			EXEC sp_LogActivity 
				@user_id = @user_id,
				@action_type_id = @action_type_id,
				@ip_address = NULL,
				@device = NULL,
				@status = 1,
				@target_id = @target_user_id,
				@target_type = 'USER';

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	GO




	CREATE OR ALTER PROCEDURE sp_UnmarkChatMemberAsSpam
		@chat_id INT,
		@user_id INT, -- Người thực hiện hành động bỏ đánh dấu
		@target_user_id INT -- Người được bỏ đánh dấu spam
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			BEGIN TRANSACTION;

			-- Kiểm tra xem chat_id có tồn tại và đang hoạt động không
			IF NOT EXISTS (SELECT 1 FROM tblChat WHERE id = @chat_id AND status = 1)
			BEGIN
				RAISERROR(N'Đoạn chat không tồn tại hoặc không hoạt động.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem user_id có tồn tại, đang hoạt động và là thành viên của đoạn chat không
			IF NOT EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @user_id AND status = 1
			)
			BEGIN
				RAISERROR(N'Người dùng không hợp lệ hoặc không phải thành viên của đoạn chat.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem target_user_id có tồn tại, đang hoạt động và là thành viên của đoạn chat không
			IF NOT EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @target_user_id AND status = 1
			)
			BEGIN
				RAISERROR(N'Người được bỏ đánh dấu không hợp lệ hoặc không phải thành viên của đoạn chat.', 16, 1);
				RETURN;
			END

			-- Kiểm tra xem target_user_id có đang bị đánh dấu là spam không
			IF NOT EXISTS (
				SELECT 1 FROM tblChatMember 
				WHERE chat_id = @chat_id AND user_id = @target_user_id AND is_spam = 1
			)
			BEGIN
				RAISERROR(N'Người dùng không bị đánh dấu là spam trong đoạn chat này.', 16, 1);
				RETURN;
			END

			-- Cập nhật trạng thái is_spam
			UPDATE tblChatMember
			SET is_spam = 0
			WHERE chat_id = @chat_id AND user_id = @target_user_id;

			-- Ghi log hành động
			DECLARE @action_type_id INT;
			SELECT @action_type_id = id FROM tblActionType WHERE name = 'UNMARK_CHAT_SPAM';
			IF @action_type_id IS NULL
			BEGIN
				INSERT INTO tblActionType (name, description)
				VALUES ('UNMARK_CHAT_SPAM', N'User unmarked a chat member as spam');
				SET @action_type_id = SCOPE_IDENTITY();
			END

			EXEC sp_LogActivity 
				@user_id = @user_id,
				@action_type_id = @action_type_id,
				@ip_address = NULL,
				@device = NULL,
				@status = 1,
				@target_id = @target_user_id,
				@target_type = 'USER';

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	GO

CREATE OR ALTER PROCEDURE sp_SendMessage
    @chat_id INT,
    @sender_id INT,
    @content NVARCHAR(MAX),
    @media_url NVARCHAR(512) = NULL,
    @media_type NVARCHAR(10) = NULL,
    @new_message_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @new_created_at DATETIME;
    DECLARE @media_type_id INT;

    BEGIN TRY
        -- Kiểm tra chat_id
        IF NOT EXISTS (SELECT 1 FROM tblChat WHERE id = @chat_id AND status = 1)
            BEGIN
                SET @ErrorMessage = N'Chat không tồn tại hoặc đã bị xóa.';
                THROW 50001, @ErrorMessage, 1;
            END

        -- Kiểm tra sender_id
        IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @sender_id AND status = 1)
            BEGIN
                SET @ErrorMessage = N'Người gửi không tồn tại hoặc đã bị vô hiệu hóa.';
                THROW 50002, @ErrorMessage, 1;
            END

        -- Kiểm tra quyền truy cập chat
        IF NOT EXISTS (
            SELECT 1
            FROM tblChatMember
            WHERE chat_id = @chat_id
              AND user_id = @sender_id
              AND status = 1
        )
            BEGIN
                SET @ErrorMessage = N'Người dùng không có quyền truy cập vào chat này.';
                THROW 50003, @ErrorMessage, 1;
            END

        -- Kiểm tra trạng thái chặn
        IF EXISTS (
            SELECT 1
            FROM tblBlock
            WHERE (user_id = @sender_id OR blocked_user_id = @sender_id)
              AND status = 1
        )
            BEGIN
                SET @ErrorMessage = N'Người dùng bị chặn hoặc đã chặn người khác trong chat này.';
                THROW 50004, @ErrorMessage, 1;
            END

        -- Kiểm tra và lấy media_type_id
        IF @media_url IS NOT NULL AND @media_type IS NOT NULL
            BEGIN
                SET @media_type_id = (SELECT id FROM tblMediaType WHERE name = @media_type);
                IF @media_type_id IS NULL
                    BEGIN
                        SET @ErrorMessage = N'Loại media không hợp lệ.';
                        THROW 50005, @ErrorMessage, 1;
                    END
            END

        -- Thêm tin nhắn vào tblMessage
        INSERT INTO tblMessage (chat_id, sender_id, type_id, content, created_at, status)
        VALUES (@chat_id, @sender_id, 1, @content, SYSDATETIMEOFFSET(), 1);

        -- Lấy ID và created_at của tin nhắn vừa thêm
        SET @new_message_id = SCOPE_IDENTITY();
        SET @new_created_at = (SELECT created_at FROM tblMessage WHERE id = @new_message_id);

        -- Nếu có media, thêm vào tblMedia
        IF @media_url IS NOT NULL AND @media_type_id IS NOT NULL
            BEGIN
                DECLARE @target_type_id INT;
                SET @target_type_id = (SELECT id FROM tblTargetType WHERE code = 'MESSAGE');
                IF @target_type_id IS NULL
                    BEGIN
                        SET @ErrorMessage = N'Loại target MESSAGE không tồn tại.';
                        THROW 50006, @ErrorMessage, 1;
                    END

                INSERT INTO tblMedia (owner_id, target_id, target_type_id, media_type_id, media_url, created_at, status)
                VALUES (@sender_id, @new_message_id, @target_type_id, @media_type_id, @media_url, SYSDATETIMEOFFSET(), 1);
            END

        -- Thêm trạng thái tin nhắn cho các thành viên (trừ người gửi và những người đánh dấu người gửi là spam)
        INSERT INTO tblMessageStatus (message_id, user_id, status, created_at)
        SELECT @new_message_id, cm.user_id, 'unread', SYSDATETIMEOFFSET()
        FROM tblChatMember cm
        WHERE cm.chat_id = @chat_id
          AND cm.user_id != @sender_id
          AND cm.status = 1
          AND cm.is_spam = 0;

        -- Trả về new_message_id và created_at
        SELECT @new_message_id AS new_message_id, @new_created_at AS created_at;
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        THROW 50000, @ErrorMessage, 1;
    END CATCH
END;
GO

	CREATE NONCLUSTERED INDEX idx_chat_member_is_spam
	ON tblChatMember (chat_id, user_id, is_spam)
	INCLUDE (status);

    --ACTIVITY LOGS

    CREATE TABLE tblActionType (
        id INT PRIMARY KEY IDENTITY(1, 1),
        name VARCHAR(50),
        description NVARCHAR(255)
    );
	select * from tblNotificationType
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

	CREATE PROCEDURE sp_UpdateNotificationStatus
		@notification_id INT,
		@user_id INT,
		@status_name VARCHAR(20)
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			IF NOT EXISTS (
				SELECT 1 
				FROM tblNotification 
				WHERE id = @notification_id 
				AND user_id = @user_id 
				AND status_id IN (1, 2, 3)
			)
			BEGIN
				RAISERROR ('Notification not found or not accessible.', 16, 1);
			END

			DECLARE @status_id TINYINT;
			SELECT @status_id = id 
			FROM tblNotificationStatus 
			WHERE name = @status_name 
			AND status = 1;

			IF @status_id IS NULL
			BEGIN
				RAISERROR ('Invalid status name.', 16, 1);
			END

			UPDATE tblNotification
			SET status_id = @status_id
			WHERE id = @notification_id 
			AND user_id = @user_id;

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (ERROR_MESSAGE(), GETDATE());
			RETURN;
		END CATCH;
	END;
	GO

	

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
	SELECT OBJECT_NAME(object_id), definition
FROM sys.sql_modules
WHERE definition LIKE '%friendship%';

    --GROUP & PAGE

    CREATE TABLE tblGroup (
        id INT PRIMARY KEY IDENTITY(1, 1),
        owner_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        name NVARCHAR(100),
        description NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        status BIT DEFAULT 1,
		privacy_level VARCHAR(20) CHECK (privacy_level IN ('public', 'private', 'hidden')) DEFAULT 'public'
    );

    CREATE TABLE tblGroupMember (
        group_id INT NOT NULL FOREIGN KEY REFERENCES tblGroup(id),
        user_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
        join_at DATETIME DEFAULT GETDATE(),
        is_admin BIT DEFAULT 0,
		is_owner BIT DEFAULT 0,
        status BIT DEFAULT 1,
		invite_status NVARCHAR(20) DEFAULT 'PENDING',
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
        ELSE IF @target_type_id = 5 AND EXISTS (SELECT 1 FROM tblMedia WHERE id = @target_id AND status = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 6 AND EXISTS (SELECT 1 FROM tblGroup WHERE id = @target_id AND status = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 7 AND EXISTS (SELECT 1 FROM tblPage WHERE id = @target_id AND status = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 8 AND EXISTS (SELECT 1 FROM tblMessage WHERE id = @target_id AND status = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 9 AND EXISTS (SELECT 1 FROM tblCallSession WHERE id = @target_id AND status = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 10 AND EXISTS (SELECT 1 FROM tblNotification WHERE id = @target_id AND status_id = 1)
			SET @exists = 1;
		ELSE IF @target_type_id = 11 AND EXISTS (SELECT 1 FROM tblReport WHERE id = @target_id AND status = 1)
			SET @exists = 1;

        SET @is_valid = @exists;
    END;
    ----------------------------------
    --REPORT
	CREATE TABLE tblReport (
		id INT PRIMARY KEY IDENTITY(1,1),
		reporter_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
		target_id INT NOT NULL,
		target_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id),
		reason_id INT NOT NULL FOREIGN KEY REFERENCES tblReportReason(id),
		processing_status_id INT NOT NULL DEFAULT 1 FOREIGN KEY REFERENCES tblReportStatus(id),
		report_time DATETIME DEFAULT GETDATE(),
		status BIT DEFAULT 1
	);

	CREATE TABLE tblReportReason (
		id INT PRIMARY KEY IDENTITY(1, 1),
		name NVARCHAR(100) NOT NULL,
		description NVARCHAR(255),
		status BIT DEFAULT 1,
		CONSTRAINT UQ_ReportReason_Name UNIQUE (name)
	);

	CREATE TABLE tblReportStatus (
		id INT PRIMARY KEY IDENTITY(1,1),
		name NVARCHAR(100) NOT NULL,
		description NVARCHAR(255),
		status BIT DEFAULT 1,
		CONSTRAINT UQ_ReportStatus_Name UNIQUE (name)
	);

	CREATE TABLE tblReportLimit (
		user_id INT PRIMARY KEY FOREIGN KEY REFERENCES tblUser(id),
		report_count INT DEFAULT 0,
		last_report_reset DATETIME DEFAULT GETDATE(),
		status BIT DEFAULT 1
	);

	CREATE TABLE tblReportHistory (
		id INT PRIMARY KEY IDENTITY(1, 1),
		reporter_id INT NOT NULL FOREIGN KEY REFERENCES tblUser(id),
		report_id INT NOT NULL FOREIGN KEY REFERENCES tblReport(id),
		processing_status_id INT NOT NULL FOREIGN KEY REFERENCES tblReportStatus(id),
		action_time DATETIME DEFAULT GETDATE(),
		status BIT DEFAULT 1
	);
    ----------------PROC FOR ADD REPORT----------------

	CREATE OR ALTER PROCEDURE sp_AddReport
		@reporter_id INT,
		@target_id INT,
		@target_type_id INT,
		@reason_id INT,
		@processing_status_id INT = 1,
		@status BIT = 1,
		@report_id INT OUTPUT
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			BEGIN TRANSACTION;

			-- Kiểm tra giới hạn báo cáo
        DECLARE @max_reports_per_day INT = 5;
        DECLARE @report_count INT;
        DECLARE @last_reset DATETIME;

        SELECT @report_count = report_count, @last_reset = last_report_reset
        FROM tblReportLimit
        WHERE user_id = @reporter_id;

        -- Nếu chưa có bản ghi, tạo mới
        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO tblReportLimit (user_id, report_count, last_report_reset, status)
            VALUES (@reporter_id, 0, GETDATE(), 1);
            SET @report_count = 0;
            SET @last_reset = GETDATE();
        END

        -- Đặt lại số đếm nếu đã qua một ngày
        IF DATEDIFF(DAY, @last_reset, GETDATE()) >= 1
        BEGIN
            UPDATE tblReportLimit
            SET report_count = 0,
                last_report_reset = GETDATE()
            WHERE user_id = @reporter_id;
            SET @report_count = 0;
        END

        -- Kiểm tra vượt quá giới hạn
        IF @report_count >= @max_reports_per_day
        BEGIN
            RAISERROR('Vượt quá giới hạn báo cáo hàng ngày.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Tăng số đếm báo cáo
        UPDATE tblReportLimit
        SET report_count = report_count + 1
        WHERE user_id = @reporter_id;

        -- Kiểm tra báo cáo lặp lại
        IF EXISTS (
            SELECT 1 FROM tblReport
            WHERE reporter_id = @reporter_id
            AND target_id = @target_id
            AND target_type_id = @target_type_id
            AND status = 1
        )
        BEGIN
            RAISERROR('Bạn đã báo cáo nội dung này trước đó.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

			-- Check if reporter exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @reporter_id AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive reporter_id.', 16, 1);
				RETURN;
			END

			-- Check if reason exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblReportReason WHERE id = @reason_id AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive report reason.', 16, 1);
				RETURN;
			END

			-- Check if processing status exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblReportStatus WHERE id = @processing_status_id AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive processing status.', 16, 1);
				RETURN;
			END

			-- Check target existence
			DECLARE @is_valid BIT;
			EXEC sp_ValidateTargetExists @target_id, @target_type_id, @is_valid OUTPUT;
			IF @is_valid = 0
			BEGIN
				RAISERROR('Invalid target_id or target_type_id.', 16, 1);
				RETURN;
			END

			-- Check content access
			/*
			DECLARE @has_access BIT;
			EXEC sp_CheckContentAccess @reporter_id, @target_id, @target_type_id, @has_access OUTPUT;
			IF @has_access = 0
			BEGIN
				RAISERROR('User does not have permission to report this content.', 16, 1);
				RETURN;
			END
			*/
			-- Get owner_id based on target_type_id
			DECLARE @owner_id INT;
			SELECT @owner_id =
				CASE @target_type_id
					WHEN 1 THEN (SELECT owner_id FROM tblPost WHERE id = @target_id)
					WHEN 2 THEN (SELECT user_id FROM tblComment WHERE id = @target_id)
					WHEN 3 THEN (SELECT user_id FROM tblStory WHERE id = @target_id)
					WHEN 4 THEN (SELECT id FROM tblUser WHERE id = @target_id)
				END;

			-- Check if reporter is blocked by owner
			IF EXISTS (
				SELECT 1 FROM tblBlock
				WHERE user_id = @owner_id AND blocked_user_id = @reporter_id AND status = 1
			)
			BEGIN
				RAISERROR('User is blocked from reporting this content.', 16, 1);
				RETURN;
			END

			-- Insert report
			INSERT INTO tblReport (reporter_id, target_id, target_type_id, reason_id, processing_status_id, report_time, status)
			VALUES (@reporter_id, @target_id, @target_type_id, @reason_id, @processing_status_id, GETDATE(), @status);

			SET @report_id = SCOPE_IDENTITY();

			-- Log activity
			DECLARE @action_type_id INT;
			SELECT @action_type_id = id FROM tblActionType WHERE name = 'REPORT_SUBMITTED';
			IF @action_type_id IS NULL
			BEGIN
				INSERT INTO tblActionType (name, description) VALUES ('REPORT_SUBMITTED', 'User submitted a report');
				SET @action_type_id = SCOPE_IDENTITY();
			END
			EXEC sp_LogActivity @reporter_id, @action_type_id, NULL, NULL, 1, @report_id, 'REPORT';

			-- Notify admins
			DECLARE @admin_id INT;
			DECLARE @notification_type_id INT;
			DECLARE @message NVARCHAR(255);
			DECLARE @reason_name NVARCHAR(100);

			-- Get report reason name
			SELECT @reason_name = name FROM tblReportReason WHERE id = @reason_id;

			-- Find admin
			SELECT TOP 1 @admin_id = id FROM tblUser WHERE is_admin = 1 AND status = 1;
			SELECT @notification_type_id = id FROM tblNotificationType WHERE name = 'REPORT_SUBMITTED' AND status = 1;

			IF @notification_type_id IS NULL
			BEGIN
				INSERT INTO tblNotificationType (name, description, status)
				VALUES ('REPORT_SUBMITTED', 'New report submitted for review', 1);
				SET @notification_type_id = SCOPE_IDENTITY();
			END

			SET @message = 'User ' + CAST(@reporter_id AS NVARCHAR(10)) + ' reported content (ID: ' + CAST(@report_id AS NVARCHAR(10)) + ', Type: ' + CAST(@target_type_id AS NVARCHAR(10)) + ') for: ' + @reason_name;

			EXEC sp_AddNotification
				@user_id = @admin_id,
				@type_id = @notification_type_id,
				@message = @message,
				@target_id = @report_id,
				@target_type_id = 11;

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	
	CREATE OR ALTER PROCEDURE sp_UpdateReportStatus
		@report_id INT,
		@admin_id INT,
		@processing_status_id INT
	AS
	BEGIN
		SET NOCOUNT ON;

		BEGIN TRY
			BEGIN TRANSACTION;

			-- Check if admin exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @admin_id AND is_admin = 1 AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive admin_id.', 16, 1);
				RETURN;
			END

			-- Check if report exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblReport WHERE id = @report_id AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive report.', 16, 1);
				RETURN;
			END

			-- Check if processing status exists and is active
			IF NOT EXISTS (SELECT 1 FROM tblReportStatus WHERE id = @processing_status_id AND status = 1)
			BEGIN
				RAISERROR('Invalid or inactive processing status.', 16, 1);
				RETURN;
			END

			-- Update report status
			UPDATE tblReport
			SET processing_status_id = @processing_status_id
			WHERE id = @report_id;

			-- Ghi lịch sử báo cáo
			INSERT INTO tblReportHistory (reporter_id, report_id, processing_status_id, action_time, status)
			VALUES (@admin_id, @report_id, @processing_status_id, GETDATE(), 1);

			-- Check for report abuse (5 reports per day)
			DECLARE @reporter_id INT, @target_type_id INT;
			SELECT @reporter_id = reporter_id, @target_type_id = target_type_id
			FROM tblReport WHERE id = @report_id;

			IF @processing_status_id = (SELECT id FROM tblReportStatus WHERE name = 'Rejected')
			BEGIN
				DECLARE @rejected_count INT;
				SELECT @rejected_count = COUNT(*)
				FROM tblReport
				WHERE reporter_id = @reporter_id
				AND processing_status_id = (SELECT id FROM tblReportStatus WHERE name = 'Rejected')
				AND report_time >= CAST(GETDATE() AS DATE)
				AND status = 1;

				-- Ngưỡng lạm dụng: 5 báo cáo bị từ chối trong 1 ngày
				IF @rejected_count >= 5
				BEGIN
					-- Ghi log hành động lạm dụng
					DECLARE @action_type_id_abuse INT;
					SELECT @action_type_id_abuse = id FROM tblActionType WHERE name = 'REPORT_ABUSE_WARNING';
					IF @action_type_id_abuse IS NULL
					BEGIN
						INSERT INTO tblActionType (name, description)
						VALUES ('REPORT_ABUSE_WARNING', 'User received warning for report abuse');
						SET @action_type_id_abuse = SCOPE_IDENTITY();
					END
					EXEC sp_LogActivity @reporter_id, @action_type_id_abuse, NULL, NULL, 1, @report_id, 'REPORT';
				END
			END

			-- Log activity
			DECLARE @action_type_id_status INT;
			SELECT @action_type_id_status = id FROM tblActionType WHERE name = 'REPORT_STATUS_UPDATED';
			IF @action_type_id_status IS NULL
			BEGIN
				INSERT INTO tblActionType (name, description)
				VALUES ('REPORT_STATUS_UPDATED', 'Admin updated report status');
				SET @action_type_id_status = SCOPE_IDENTITY();
			END
			EXEC sp_LogActivity @admin_id, @action_type_id_status, NULL, NULL, 1, @report_id, 'REPORT';

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (@ErrorMessage, GETDATE());
			RAISERROR (@ErrorMessage, 16, 1);
		END CATCH;
	END;
	
	-- Create or update sp_GetReports
	CREATE OR ALTER PROCEDURE sp_GetReports
		@status BIT = 1,
		@targetTypeId INT = NULL,
		@processingStatusId INT = NULL,
		@page INT = 0,
		@size INT = 10
	AS
	BEGIN
		SET NOCOUNT ON;

		SELECT 
			r.id,
			r.reporter_id,
			u1.username AS reporter_username,
			r.target_id,
			r.target_type_id,
			tt.name AS target_type_name,
			r.reason_id,
			rr.name AS reason_name,
			r.processing_status_id,
			rs.name AS processing_status_name,
			r.report_time,
			r.status
		FROM tblReport r
		JOIN tblUser u1 ON r.reporter_id = u1.id
		JOIN tblTargetType tt ON r.target_type_id = tt.id
		JOIN tblReportReason rr ON r.reason_id = rr.id
		JOIN tblReportStatus rs ON r.processing_status_id = rs.id
		WHERE (@status IS NULL OR r.status = @status)
			AND (@targetTypeId IS NULL OR r.target_type_id = @targetTypeId)
			AND (@processingStatusId IS NULL OR r.processing_status_id = @processingStatusId)
		ORDER BY r.report_time DESC
		OFFSET @page * @size ROWS
		FETCH NEXT @size ROWS ONLY;
	END;

    ---------------------------------------

    --REACTION

    CREATE TABLE tblReactionType (
        id INT PRIMARY KEY IDENTITY(1, 1),
        name VARCHAR(50),
        description VARCHAR(255),
		emoji NVARCHAR(10),
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
    CREATE TABLE tblMedia (
        id INT PRIMARY KEY IDENTITY(1, 1),
		owner_id INT FOREIGN KEY REFERENCES tblUser(id),
        target_id INT NOT NULL, -- ID của nội dung (post, story, message, v.v.)
        target_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id), -- Loại nội dung
        media_type_id INT NOT NULL FOREIGN KEY REFERENCES tblMediaType(id), -- Loại media
        media_url NVARCHAR(512) NOT NULL, -- Đường dẫn đến media
        caption NVARCHAR(255), -- Mô tả media (nếu có)
        created_at DATETIME DEFAULT GETDATE(),
        status BIT DEFAULT 1,
        CONSTRAINT UQ_Media UNIQUE (target_id, target_type_id, media_url) -- Đảm bảo không trùng media_url cho cùng target
    );

    CREATE TABLE tblMediaType (
        id INT PRIMARY KEY IDENTITY(1, 1),
        name VARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255),
        status BIT DEFAULT 1
    );

    -- TẠO BẢNG MỚI ĐỂ QUẢN LÝ CÁC LƯỢT CHIA SẺ
CREATE TABLE dbo.tblPostShare (
    id INT PRIMARY KEY IDENTITY(1, 1),

    -- ID của bài viết gốc (bài bị người khác chia sẻ)
    original_post_id INT NOT NULL,

    -- ID của bài viết mới được tạo ra khi chia sẻ
    -- Bài viết này chứa nội dung bình luận của người chia sẻ
    shared_post_id INT NOT NULL,

    -- ID của người thực hiện hành động chia sẻ
    user_id INT NOT NULL,

    -- Thời gian chia sẻ
    shared_at DATETIME NOT NULL DEFAULT GETDATE(),

    -- Trạng thái để có thể "xóa mềm" một lượt chia sẻ
    status BIT NOT NULL DEFAULT 1,

    -- Ràng buộc khóa ngoại
    CONSTRAINT FK_PostShare_OriginalPost FOREIGN KEY (original_post_id) REFERENCES dbo.tblPost(id),
    CONSTRAINT FK_PostShare_SharedPost FOREIGN KEY (shared_post_id) REFERENCES dbo.tblPost(id),
    CONSTRAINT FK_PostShare_User FOREIGN KEY (user_id) REFERENCES dbo.tblUser(id),

    -- Đảm bảo một bài viết chỉ có thể là một bài chia sẻ duy nhất
    CONSTRAINT UQ_PostShare_SharedPostId UNIQUE (shared_post_id)
);
GO

-- (Quan trọng cho hiệu suất) Tạo các Index cần thiết
CREATE NONCLUSTERED INDEX IX_PostShare_OriginalPostId ON dbo.tblPostShare(original_post_id) WHERE status = 1;
CREATE NONCLUSTERED INDEX IX_PostShare_UserId ON dbo.tblPostShare(user_id) WHERE status = 1;
GO

    -- Chèn dữ liệu mẫu cho tblMediaType
    INSERT INTO tblMediaType (name, description, status) VALUES
    ('image', N'Hình ảnh', 1),
    ('video', N'Video', 1),
    ('audio', N'Âm thanh', 1);
    -----------ADD DATA-------------

    -- tblTargetType (Loại nội dung: bài viết, bình luận, câu chuyện, hồ sơ)
    INSERT INTO tblTargetType (name, code) VALUES
    ('Post', 'POST'),
    ('Comment', 'COMMENT'),
    ('Story', 'STORY'),
    ('Profile', 'PROFILE'),
	('Media', 'MEDIA'),
    ('Group', 'GROUP'),
    ('Page', 'PAGE'),
    ('Message', 'MESSAGE'),
    ('Call', 'CALL'),
    ('Notification', 'NOTIFICATION'),
    ('Report', 'REPORT');

    -- tblActionType (Loại hành động cho log hoạt động)
    INSERT INTO tblActionType (name, description) VALUES
    ('USER_SOFT_DELETE', 'User account soft deleted'),
    ('POST_CREATE', 'User created a post'),
    ('COMMENT_CREATE', 'User created a comment'),
    ('STORY_CREATE', 'User created a story'),
    ('FRIEND_REQUEST_SENT', 'User sent a friend request'),
    ('FRIEND_REQUEST_ACCEPTED', 'User accepted a friend request'),
	('FOLLOW', 'User followed a user'),
	('UNFOLLOW', 'User unfollowed a user'),
	('LOCK_USER', 'Admin locked user account'),
	('UNLOCK_USER', 'Admin unlocked user account'),
	('GRANT_ADMIN', 'Admin granted admin role to user'),
	('REVOKE_ADMIN', 'Admin revoked admin role from user'),
	('ACTIVATE_BANNED_KEYWORD', 'Admin activated banned keyword'),
	('DEACTIVATE_BANNED_KEYWORD', 'Admin deactivated banned keyword'),
	('REPORT_ABUSE_WARNING', 'User received warning for report abuse');

	select * from tblTargetType
    -- tblNotificationType (Loại thông báo)
    INSERT INTO tblNotificationType (name, description, status) VALUES
    ('FRIEND_REQUEST', 'New friend request received', 1),
    ('POST_COMMENT', 'New comment on your post', 1),
    ('STORY_VIEW', 'Someone viewed your story', 1),
    ('REACTION', 'Someone reacted to your content', 1),
	('FRIEND_ACCEPTED', 'accepted friend request', 1),
	('FOLLOW', 'Someone followed you', 1),
	('GROUP_INVITE', 'You have been invited to join a group', 1),
	('REPORT_STATUS_UPDATED', 'New report update', 1),
	('GROUP_USER_JOINED', 'A user has joined your group', 1),
    ('GROUP_JOIN_REQUEST', 'A user has requested to join your group', 1),
    ('GROUP_REQUEST_APPROVED', 'Your group join request has been approved', 1),
    ('GROUP_REQUEST_REJECTED', 'Your group join request has been rejected', 1),
	('REPORT_ABUSE_WARNING', 'Warning for report abuse', 1),
	('AI_FLAGGED_NOTICE', 'Your post was flagged by AI for review', 1),
	('AI_FLAGGED_POST', 'A post was flagged by AI for review', 1),
    ('POST_REMOVED', 'Your post was removed due to community standards violation', 1);


    -- tblReactionType (Loại phản hồi: Like, Love, Haha, v.v.)
	INSERT INTO tblReactionType (name, description, emoji, status) VALUES
	('like',           N'Thích',              N'👍', 1),
	('love',           N'Yêu thích',          N'❤️', 1),
	('heart_eyes',     N'Mắt tim',            N'😍', 1),
	('kiss',           N'Hôn',                N'😘', 1),
	('broken_heart',   N'Trái tim tan vỡ',    N'💔', 1),
	('blue_heart',     N'Trái tim xanh',      N'💙', 1),
	('green_heart',    N'Trái tim xanh lá',   N'💚', 1),
	('yellow_heart',   N'Trái tim vàng',      N'💛', 1),
	('purple_heart',   N'Trái tim tím',       N'💜', 1),
	('black_heart',    N'Trái tim đen',       N'🖤', 1),
	('white_heart',    N'Trái tim trắng',     N'🤍', 1),
	('orange_heart',   N'Trái tim cam',       N'🧡', 1),
	('smile',          N'Cười',               N'😄', 1),
	('grin',           N'Cười to',            N'😁', 1),
	('laugh',          N'Cười nghiêng',       N'🤣', 1),
	('wink',           N'Nháy mắt',           N'😉', 1),
	('sad',            N'Buồn',               N'😢', 1),
	('cry',            N'Khóc',               N'😭', 1),
	('angry',          N'Tức giận',           N'😡', 1),
	('wow',            N'Ngạc nhiên',         N'😮', 1),
	('thinking',       N'Suy nghĩ',           N'🤔', 1),
	('nerd',           N'Đeo kính thông minh',N'🤓', 1),
	('party',          N'Ăn mừng',            N'🥳', 1),
	('sleepy',         N'Buồn ngủ',           N'😴', 1),
	('thumbs_down',    N'Không thích',        N'👎', 1),
	('clapping',       N'Vỗ tay',             N'👏', 1),
	('muscle',         N'Cơ bắp',             N'💪', 1),
	('soccer',         N'Bóng đá',            N'⚽️', 1),
	('basketball',     N'Bóng rổ',            N'🏀', 1),
	('running',        N'Chạy bộ',            N'🏃', 1),
	('swimming',       N'Bơi',                N'🏊', 1),
	('doctor',         N'Bác sĩ',             N'👩‍⚕️', 1),
	('engineer',       N'Kỹ sư',              N'👷', 1),
	('teacher',        N'Giáo viên',          N'👨‍🏫', 1),
	('dancer_girl',    N'Cô gái đang múa',    N'💃', 1),
	('middle_finger',  N'Ngón giữa',          N'🖕', 1),
	('ring',           N'Nhẫn',               N'💍', 1),
	('crown',          N'Vương miện',         N'👑', 1);

    -- tblMessageType (Loại tin nhắn: văn bản, hình ảnh, video)
    INSERT INTO tblMessageType (name, description, status) VALUES
    ('Text', 'Text message', 1),
	('Image', 'Image message', 1),
	('Video', 'Video message', 1),
	('Missed_call', 'Miss call message', 1);
    INSERT INTO tblUpgradeType (name, description) VALUES
    ('Premium', 'Premium account upgrade'),
    ('VIP', 'VIP account upgrade');

    -- tblContentPolicy (Chính sách nội dung)
    INSERT INTO tblContentPolicy (policy_name, description, status) VALUES
    ('HateSpeech', 'Content promoting hate speech', 1),
    ('Violence', 'Content promoting violence', 1);

    -- tblBannedKeyword (Từ khóa bị cấm)
    INSERT INTO tblBannedKeyword (keyword, created_at, status) VALUES
    ('spam', GETDATE(), 1),
    ('offensive', GETDATE(), 1);

    ----the second-----

	--insert admin account
	INSERT INTO tblUser (
  email, username, phone_number, password, persistent_cookie,
  google_id, is_admin, display_name, date_of_birth, bio,
  gender, profile_privacy_setting, status
) VALUES (
  'admin@example.com', 'admin', '0123456789',
  '$2a$10$xe80JexcDBTfGO01pkQFp.qjuZ.AS0xYms8pgaJiNvf9XVGHEE0DC',
  NULL, NULL, 1, 'Administrator', '1990-01-01',
  'Admin account', 1, 'PUBLIC', 1
);


    -- tblPrivacySettings (Cài đặt quyền riêng tư - tự động thêm bởi trigger trg_InsertPrivacySettings, nhưng có thể cập nhật)
    UPDATE tblPrivacySettings SET
        post_viewer = 'friends',
        comment_viewer = 'public',
        story_viewer = 'custom',
        profile_viewer = 'only_me',
        message_viewer = 'friends',
        updated_at = GETDATE()
    WHERE user_id = 1;

    UPDATE tblPrivacySettings SET
        post_viewer = 'public',
        comment_viewer = 'friends',
        story_viewer = 'friends',
        profile_viewer = 'friends',
        message_viewer = 'only_me',
        updated_at = GETDATE()
    WHERE user_id = 2;



    -- tblAnalytics (Phân tích)
    INSERT INTO tblAnalytics (field_name, field_value, update_time, status) VALUES
    ('ActiveUsers', '1000', GETDATE(), 1),
    ('PostCount', '500', GETDATE(), 1);

	INSERT INTO tblReportReason (name, description, status) VALUES
-- Lý do báo cáo cho bài viết
(N'Nội dung không phù hợp', N'Nội dung bài viết vi phạm tiêu chuẩn cộng đồng', 1),
(N'Spam', N'Bài viết chứa nội dung quảng cáo hoặc lặp lại không mong muốn', 1),
(N'Ngôn ngữ thù địch', N'Bài viết chứa nội dung kích động thù hận hoặc phân biệt đối xử', 1),
(N'Nội dung khỏa thân', N'Bài viết chứa hình ảnh hoặc video khiêu dâm', 1),
(N'Bạo lực', N'Bài viết kích động hoặc mô tả bạo lực', 1),
(N'Tin giả', N'Bài viết chứa thông tin sai lệch hoặc gây hiểu lầm', 1),
-- Lý do báo cáo cho người dùng (hồ sơ)
(N'Quấy rối', N'Người dùng có hành vi quấy rối hoặc bắt nạt người khác', 1),
(N'Tài khoản giả mạo', N'Hồ sơ người dùng có dấu hiệu giả mạo danh tính', 1),
(N'Hành vi không phù hợp', N'Người dùng thực hiện các hành động vi phạm quy định', 1),
(N'Đăng nội dung vi phạm lặp lại', N'Người dùng liên tục đăng nội dung vi phạm tiêu chuẩn cộng đồng', 1);

INSERT INTO tblReportStatus (name, description, status) VALUES
('Pending', N'Đang chờ xử lý', 1),
('Under Review', N'Đang xem xét', 1),
('Approved', N'Báo cáo được chấp nhận', 1),
('Rejected', N'Báo cáo bị từ chối', 1);

EXEC sp_UpdateFriendSuggestions;

select * from tblFriendSuggestion