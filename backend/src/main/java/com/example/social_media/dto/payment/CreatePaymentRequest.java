package com.example.social_media.dto.payment;

import lombok.Data;

@Data
public class CreatePaymentRequest {
    private int amount;
    private String description;
    private String returnUrl;
    private String cancelUrl;
}
