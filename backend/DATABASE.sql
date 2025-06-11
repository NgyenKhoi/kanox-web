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
-- Tạo index để tìm token nhanh
CREATE UNIQUE INDEX IDX_VerificationToken_Token ON VerificationToken(Token);

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
				AND status = 1
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

			DECLARE @message NVARCHAR(255);
			SET @message = 'User ' + CAST(@user_id AS NVARCHAR(10)) + ' accepted your friend request.';
			EXEC sp_AddNotification 
				@recipient_id = @friend_id,
				@type_id = @type_id,
				@message = @message,
				@sender_id = @user_id,
				@target_type_id = 4; -- PROFILE

			COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF @@TRANCOUNT > 0
				ROLLBACK TRANSACTION;
			INSERT INTO tblErrorLog (error_message, error_time)
			VALUES (ERROR_MESSAGE(), GETDATE());
			-- Với RAISERROR, không cần THROW, kết thúc bằng RETURN
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
			SET friendship_status = 'rejected', status = 0
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
			IF NOT EXISTS (SELECT 1 FROM tblFriendship WHERE (user_id = @user_id AND friend_id = @friend_id OR user_id = @friend_id AND friend_id = @user_id) AND status = 1)
			BEGIN
				RAISERROR('Friendship not found.', 16, 1);
				ROLLBACK TRANSACTION;
				RETURN;
			END
			UPDATE tblFriendship
			SET status = 0
			WHERE (user_id = @user_id AND friend_id = @friend_id) OR (user_id = @friend_id AND friend_id = @user_id);
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

	CREATE PROCEDURE sp_FollowUser
		@follower_id INT,
		@followee_id INT
	AS
	BEGIN
		SET NOCOUNT ON;
		BEGIN TRY
			BEGIN TRANSACTION;
			IF @follower_id = @followee_id
			BEGIN
				RAISERROR ('Cannot follow yourself.', 16, 1);
			END
			IF EXISTS (
				SELECT 1 
				FROM tblFollow 
				WHERE follower_id = @follower_id 
				AND followee_id = @followee_id 
				AND status = 1
			)
			BEGIN
				RAISERROR ('Already following.', 16, 1);
			END

			INSERT INTO tblFollow (follower_id, followee_id, created_at, status)
			VALUES (@follower_id, @followee_id, GETDATE(), 1);

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

			DECLARE @message NVARCHAR(255);
			SET @message = 'User ' + CAST(@follower_id AS NVARCHAR(10)) + ' started following you.';
			EXEC sp_AddNotification 
				@recipient_id = @followee_id,
				@type_id = @type_id,
				@message = @message,
				@sender_id = @follower_id,
				@target_type_id = 4;

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

    CREATE OR ALTER PROCEDURE sp_CreatePost
        @owner_id INT,
        @content NVARCHAR(MAX),
        @privacy_setting VARCHAR(20),
        @media_urls NVARCHAR(MAX) = NULL, -- Chuyển thành danh sách media_urls (dạng chuỗi, phân tách bằng dấu phẩy)
        @tagged_user_ids NVARCHAR(MAX) = NULL,
        @custom_list_id INT = NULL,
        @new_post_id INT OUTPUT
    AS
    BEGIN
        SET NOCOUNT ON;

        BEGIN TRY
            -- Kiểm tra owner_id có tồn tại và active không
            IF NOT EXISTS (SELECT 1 FROM tblUser WHERE id = @owner_id AND status = 1)
            BEGIN
                RAISERROR('Người dùng không hợp lệ hoặc không hoạt động.', 16, 1);
                RETURN;
            END

            -- Kiểm tra content không rỗng
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

            -- Kiểm tra chính sách nội dung
            DECLARE @policy_valid BIT;
            EXEC sp_CheckContentPolicy @content, @policy_valid OUTPUT;
            IF @policy_valid = 0
            BEGIN
                RAISERROR('Nội dung vi phạm chính sách nền tảng.', 16, 1);
                RETURN;
            END

            -- Kiểm tra privacy_setting hợp lệ
            IF @privacy_setting NOT IN ('public', 'friends', 'only_me', 'custom', 'default')
            BEGIN
                RAISERROR('Cài đặt quyền riêng tư không hợp lệ.', 16, 1);
                RETURN;
            END

            -- Kiểm tra custom_list_id nếu privacy_setting là 'custom'
            IF @privacy_setting = 'custom' AND (@custom_list_id IS NULL OR NOT EXISTS (
                SELECT 1 FROM tblCustomPrivacyLists
                WHERE id = @custom_list_id AND user_id = @owner_id AND status = 1))
            BEGIN
                RAISERROR('custom_list_id không hợp lệ hoặc thiếu cho quyền riêng tư tùy chỉnh.', 16, 1);
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
                    RAISERROR('Người dùng bị chặn bởi một hoặc nhiều thành viên trong danh sách tùy chỉnh.', 16, 1);
                    RETURN;
                END
                IF EXISTS (
                    SELECT 1 FROM tblBlock b
                    JOIN tblCustomPrivacyLists cpl ON cpl.user_id = b.blocked_user_id
                    WHERE cpl.id = @custom_list_id AND b.user_id = @owner_id AND b.status = 1
                )
                BEGIN
                    RAISERROR('Người dùng bị chặn bởi chủ danh sách tùy chỉnh.', 16, 1);
                    RETURN;
                END
            END

            -- Thêm bài viết mới
            INSERT INTO tblPost (owner_id, content, privacy_setting, created_at, status)
            VALUES (@owner_id, @content, @privacy_setting, GETDATE(), 1);

            -- Lấy ID bài viết vừa thêm
            SET @new_post_id = SCOPE_IDENTITY();

            -- Lưu quyền riêng tư nếu cần
            IF @privacy_setting != 'default'
            BEGIN
                INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status)
                VALUES (@new_post_id, 1, @privacy_setting, @custom_list_id, GETDATE(), 1);
            END

            -- Xử lý media_urls
            IF @media_urls IS NOT NULL AND LTRIM(RTRIM(@media_urls)) <> ''
            BEGIN
                DECLARE @pos INT = 1, @len INT, @url VARCHAR(512), @media_type VARCHAR(10);
                DECLARE @media_type_id INT;

                SET @media_urls = @media_urls + ',';

                WHILE CHARINDEX(',', @media_urls, @pos) > 0
                BEGIN
                    SET @len = CHARINDEX(',', @media_urls, @pos) - @pos;
                    SET @url = SUBSTRING(@media_urls, @pos, @len);
                    SET @pos = CHARINDEX(',', @media_urls, @pos) + 1;

                    IF LTRIM(RTRIM(@url)) <> ''
                    BEGIN
                        -- Xác định media_type dựa trên đuôi file (ví dụ đơn giản)
                        SET @media_type =
                            CASE
                                WHEN @url LIKE '%.jpg' OR @url LIKE '%.png' OR @url LIKE '%.jpeg' THEN 'image'
                                WHEN @url LIKE '%.mp4' OR @url LIKE '%.mov' THEN 'video'
                                WHEN @url LIKE '%.mp3' OR @url LIKE '%.wav' THEN 'audio'
                                ELSE 'image' -- Mặc định là image nếu không xác định được
                            END;

                        -- Lấy media_type_id
                        SELECT @media_type_id = id FROM tblMediaType WHERE name = @media_type AND status = 1;

                        IF @media_type_id IS NOT NULL
                        BEGIN
                            INSERT INTO tblMedia (target_id, target_type_id, media_type_id, media_url, created_at, status)
                            VALUES (@new_post_id, 1, @media_type_id, @url, GETDATE(), 1);
                        END
                    END
                END
            END

            -- Xử lý tag người dùng
            IF @tagged_user_ids IS NOT NULL AND LTRIM(RTRIM(@tagged_user_ids)) <> ''
            BEGIN
                DECLARE @tag_pos INT = 1, @tag_len INT, @id_str VARCHAR(20);
                DECLARE @tagged_user_id INT;
                DECLARE @has_access BIT;

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
    CREATE TABLE tblMedia (
        id INT PRIMARY KEY IDENTITY(1, 1),
		owner_id INT FOREIGN KEY REFERENCES tblUser(id),
        target_id INT NOT NULL, -- ID của nội dung (post, story, message, v.v.)
        target_type_id INT NOT NULL FOREIGN KEY REFERENCES tblTargetType(id), -- Loại nội dung
        media_type_id INT NOT NULL FOREIGN KEY REFERENCES tblMediaType(id), -- Loại media
        media_url VARCHAR(512) NOT NULL, -- Đường dẫn đến media
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
    ('FRIEND_REQUEST_ACCEPTED', 'User accepted a friend request');

    -- tblNotificationType (Loại thông báo)
    INSERT INTO tblNotificationType (name, description, status) VALUES
    ('FRIEND_REQUEST', 'New friend request received', 1),
    ('POST_COMMENT', 'New comment on your post', 1),
    ('STORY_VIEW', 'Someone viewed your story', 1),
    ('REACTION', 'Someone reacted to your content', 1);


    -- tblReactionType (Loại phản hồi: Like, Love, Haha, v.v.)
    INSERT INTO tblReactionType (name, description, status) VALUES
    ('Like', 'Like reaction', 1),
    ('Love', 'Love reaction', 1),
    ('Haha', 'Haha reaction', 1);

    -- tblMessageType (Loại tin nhắn: văn bản, hình ảnh, video)
    INSERT INTO tblMessageType (name, description, status) VALUES
    ('Text', 'Text message', 1),
    ('Image', 'Image message', 1),
    ('Video', 'Video message', 1);

    -- tblUpgradeType (Loại nâng cấp tài khoản: Premium, VIP)
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

    -- tblUser (Người dùng)
    INSERT INTO tblUser (email, username, phone_number, password, persistent_cookie, google_id, is_admin, display_name, date_of_birth, bio, gender, profile_privacy_setting, status) VALUES
    ('emma.wilson@example.com', 'emma_wilson', '555-0101', 'hashed_pass_emma', NULL, NULL, 0, N'Emma Wilson', '1992-03-15', N'Yêu thích leo núi và nhiếp ảnh!', 1, 'public', 1),
    ('liam.johnson@example.com', 'liam_johnson', '555-0102', 'hashed_pass_liam', NULL, NULL, 0, N'Liam Johnson', '1988-07-22', N'Đam mê công nghệ và game', 2, 'friends', 1),
    ('sophia.martinez@example.com', 'sophia_martinez', '555-0103', 'hashed_pass_sophia', NULL, NULL, 0, N'Sophia Martinez', '1995-11-10', N'Đầu bếp đầy triển vọng', 0, 'only_me', 1),
    ('noah.brown@example.com', 'noah_brown', '555-0104', 'hashed_pass_noah', NULL, NULL, 0, N'Noah Brown', '1990-04-05', N'Nghệ sĩ và du khách', 1, 'custom', 1),
    ('olivia.smith@example.com', 'olivia_smith', '555-0105', 'hashed_pass_olivia', NULL, NULL, 1, N'Olivia Smith', '1985-09-30', N'Quản trị viên nền tảng', 2, 'public', 1);

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

    -- tblCustomPrivacyLists (Danh sách quyền riêng tư tùy chỉnh)
    INSERT INTO tblCustomPrivacyLists (user_id, list_name, created_at, status) VALUES
    (4, 'CloseFriends', GETDATE(), 1),
    (4, 'Family', GETDATE(), 1);

    -- tblCustomPrivacyListMembers (Thành viên trong danh sách tùy chỉnh)
    INSERT INTO tblCustomPrivacyListMembers (list_id, member_user_id, added_at, status) VALUES
    (1, 1, GETDATE(), 1), -- User 1 trong danh sách CloseFriends của User 4
    (1, 2, GETDATE(), 1), -- User 2 trong danh sách CloseFriends của User 4
    (2, 3, GETDATE(), 1); -- User 3 trong danh sách Family của User 4

    ------the third-----

    -- tblFriendship (Mối quan hệ bạn bè)
    INSERT INTO tblFriendship (user_id, friend_id, friendship_status, created_at, status) VALUES
    (1, 2, 'accepted', GETDATE(), 1), -- User 1 và User 2 là bạn
    (2, 3, 'pending', GETDATE(), 1),  -- User 2 gửi yêu cầu kết bạn cho User 3
    (3, 4, 'accepted', GETDATE(), 1); -- User 3 và User 4 là bạn

    -- tblFriendSuggestion (Gợi ý bạn bè)
    INSERT INTO tblFriendSuggestion (user_id, suggested_user_id, mutual_friend_count, suggested_at, expiration_date) VALUES
    (1, 3, 1, GETDATE(), DATEADD(DAY, 7, GETDATE())), -- Gợi ý User 3 cho User 1
    (2, 4, 1, GETDATE(), DATEADD(DAY, 7, GETDATE())); -- Gợi ý User 4 cho User 2

    -- tblFollow (Theo dõi)
    INSERT INTO tblFollow (follower_id, followee_id, created_at, status) VALUES
    (1, 3, GETDATE(), 1), -- User 1 theo dõi User 3
    (2, 4, GETDATE(), 1); -- User 2 theo dõi User 4

    -- tblBlock (Chặn người dùng)
    INSERT INTO tblBlock (user_id, blocked_user_id, created_at, status) VALUES
    (3, 1, GETDATE(), 1); -- User 3 chặn User 1

    ----the forth----
    -- tblPost (Bài viết)
    INSERT INTO tblPost (owner_id, content, privacy_setting, media_url, status) VALUES
    (1, N'Chào mọi người, đây là bài viết đầu tiên của tôi!', 'public', NULL, 1),
    (2, N'Hôm nay ăn phở ngon quá!', 'friends', 'https://example.com/pho.jpg', 1),
    (4, N'Chỉ bạn thân mới thấy được bài này.', 'custom', NULL, 1);

    -- tblContentPrivacy (Quyền riêng tư cho bài viết)
    INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status) VALUES
    (3, 1, 'custom', 1, GETDATE(), 1); -- Bài viết ID=3 của User 4 có quyền riêng tư tùy chỉnh

    -- tblComment (Bình luận)
    INSERT INTO tblComment (user_id, post_id, parent_comment_id, content, privacy_setting, created_at, status) VALUES
    (2, 1, NULL, N'Wow, bài viết hay quá!', 'public', GETDATE(), 1),
    (3, 1, 1, N'Cảm ơn bạn!', 'public', GETDATE(), 1); -- Bình luận trả lời

    -- tblStory (Câu chuyện)
    INSERT INTO tblStory (user_id, caption, media_url, media_type, privacy_setting, background_color, status) VALUES
    (2, N'Chuyến đi Đà Lạt tuyệt vời!', 'https://example.com/dalat.jpg', 'image', 'friends', '#FF0000', 1),
    (4, N'Hôm nay chill!', 'https://example.com/chill.mp4', 'video', 'custom', '#00FF00', 1);

    -- tblContentPrivacy (Quyền riêng tư cho câu chuyện)
    INSERT INTO tblContentPrivacy (content_id, content_type_id, privacy_setting, custom_list_id, updated_at, status) VALUES
    (2, 3, 'custom', 1, GETDATE(), 1); -- Câu chuyện ID=2 của User 4 có quyền riêng tư tùy chỉnh

    -- tblStoryViewer (Lượt xem câu chuyện)
    INSERT INTO tblStoryViewer (story_id, viewer_id, view_time, status) VALUES
    (1, 1, GETDATE(), 1); -- User 1 xem câu chuyện của User 2

    -- tblStoryReply (Phản hồi câu chuyện)
    INSERT INTO tblStoryReply (story_id, sender_id, message, sent_time, status) VALUES
    (1, 1, N'Tuyệt vời quá!', GETDATE(), 1); -- User 1 phản hồi câu chuyện của User 2

    ------the fifth----------
    -- tblReaction (Phản hồi)
    INSERT INTO tblReaction (user_id, reaction_type_id, target_id, target_type_id, created_at, status) VALUES
    (2, 1, 1, 1, GETDATE(), 1), -- User 2 thích bài viết ID=1
    (3, 2, 1, 3, GETDATE(), 1); -- User 3 yêu thích câu chuyện ID=1

    -- tblNotification (Thông báo)
    INSERT INTO tblNotification (user_id, type_id, message, created_at, target_id, target_type_id, status_id) VALUES
    (1, 1, N'User 2 sent you a friend request.', GETDATE(), 2, NULL, 1),
    (1, 2, N'User 2 commented on your post.', GETDATE(), 1, 1, 1),
    (2, 3, N'User 1 viewed your story.', GETDATE(), 1, 3, 1);

    -- tblReport (Báo cáo)
    INSERT INTO tblReport (reporter_id, target_id, target_type_id, reason, report_time, status) VALUES
    (3, 1, 1, N'Inappropriate content', GETDATE(), 1); -- User 3 báo cáo bài viết ID=1

    --the 6th----
    -- tblChat (Phiên trò chuyện)
    INSERT INTO tblChat (is_group, name, created_at, status) VALUES
    (0, NULL, GETDATE(), 1), -- Trò chuyện cá nhân
    (1, N'Nhóm bạn thân', GETDATE(), 1); -- Nhóm

    -- tblChatMember (Thành viên trò chuyện)
    INSERT INTO tblChatMember (chat_id, user_id, joined_at, is_admin, status) VALUES
    (1, 1, GETDATE(), 0, 1), -- User 1 trong trò chuyện cá nhân
    (1, 2, GETDATE(), 0, 1), -- User 2 trong trò chuyện cá nhân
    (2, 1, GETDATE(), 1, 1), -- User 1 là admin nhóm
    (2, 2, GETDATE(), 0, 1), -- User 2 trong nhóm
    (2, 3, GETDATE(), 0, 1); -- User 3 trong nhóm

    -- tblMessage (Tin nhắn)
    INSERT INTO tblMessage (chat_id, sender_id, type_id, content, created_at, status) VALUES
    (1, 1, 1, N'Chào bạn!', GETDATE(), 1), -- Tin nhắn văn bản trong trò chuyện cá nhân
    (2, 2, 2, NULL, GETDATE(), 1); -- Tin nhắn hình ảnh trong nhóm

    ----the 7th-------
    -- tblSession (Phiên đăng nhập)
    INSERT INTO tblSession (user_id, device, ip_address, created_at, expired_time, status) VALUES
    (1, 'Mobile', '192.168.1.1', GETDATE(), DATEADD(DAY, 7, GETDATE()), 1),
    (2, 'Desktop', '192.168.1.2', GETDATE(), DATEADD(DAY, 7, GETDATE()), 1);

    -- tblPasswordReset (Yêu cầu đặt lại mật khẩu)
    INSERT INTO tblPasswordReset (user_id, token, token_expire_time, is_used, status) VALUES
    (1, 'reset_token_123', DATEADD(HOUR, 1, GETDATE()), 0, 1);

    -- tblGroup (Nhóm)
    INSERT INTO tblGroup (owner_id, name, description, created_at, status) VALUES
    (1, N'Nhóm yêu công nghệ', N'Chia sẻ kiến thức công nghệ', GETDATE(), 1);

    -- tblGroupMember (Thành viên nhóm)
    INSERT INTO tblGroupMember (group_id, user_id, join_at, is_admin, status) VALUES
    (1, 1, GETDATE(), 1, 1),
    (1, 2, GETDATE(), 0, 1);

    -- tblPage (Trang)
    INSERT INTO tblPage (owner_id, name, description, created_at, status) VALUES
    (2, N'Trang ẩm thực', N'Chia sẻ món ăn ngon', GETDATE(), 1);

    -- tblAccountUpgrade (Nâng cấp tài khoản)
    INSERT INTO tblAccountUpgrade (user_id, upgrade_type_id, upgrade_at, expire_time, status) VALUES
    (1, 1, GETDATE(), DATEADD(MONTH, 1, GETDATE()), 1); -- User 1 nâng cấp Premium

    -- tblAnalytics (Phân tích)
    INSERT INTO tblAnalytics (field_name, field_value, update_time, status) VALUES
    ('ActiveUsers', '1000', GETDATE(), 1),
    ('PostCount', '500', GETDATE(), 1);

