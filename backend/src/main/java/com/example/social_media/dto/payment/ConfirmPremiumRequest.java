package com.example.social_media.dto.payment;

import lombok.Data;

@Data
public class ConfirmPremiumRequest {
    private String orderCode;
    private String transactionId;
}
