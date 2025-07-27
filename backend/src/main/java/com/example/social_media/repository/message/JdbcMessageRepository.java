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

    public Integer sendMessage(Integer chatId, Integer senderId, String content) {
        return jdbcTemplate.execute(connection -> {
            CallableStatement cs = connection.prepareCall("{ call sp_SendMessage(?, ?, ?, ?) }");
            cs.setInt(1, chatId);
            cs.setInt(2, senderId);
            cs.setString(3, content);
            cs.registerOutParameter(4, Types.INTEGER); // @new_message_id
            return cs;
        }, (CallableStatement cs) -> {
            cs.execute();
            return cs.getInt(4); // Lấy giá trị của @new_message_id
        });
    }
}