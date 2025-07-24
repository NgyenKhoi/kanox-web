package com.example.social_media.repository.message;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.CallableStatement;
import java.sql.Types;

@Repository
public class JdbcMessageRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Integer sendMessage(Integer chatId, Integer senderId, String content, String mediaUrl, String mediaType) {
        return jdbcTemplate.execute(connection -> {
            CallableStatement cs = connection.prepareCall("{ call sp_SendMessage(?, ?, ?, ?, ?, ?) }");
            cs.setInt(1, chatId);
            cs.setInt(2, senderId);
            cs.setString(3, content);
            if (mediaUrl != null) {
                cs.setString(4, mediaUrl);
            } else {
                cs.setNull(4, Types.NVARCHAR);
            }
            if (mediaType != null) {
                cs.setString(5, mediaType);
            } else {
                cs.setNull(5, Types.NVARCHAR);
            }
            cs.registerOutParameter(6, Types.INTEGER); // @new_message_id
            return cs;
        }, (CallableStatement cs) -> {
            cs.execute();
            return cs.getInt(6); // Lấy giá trị của @new_message_id
        });
    }
}