package com.example.social_media.controller;

import com.example.social_media.dto.payment.CreatePaymentRequest;
import com.example.social_media.service.PayOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.payos.type.CheckoutResponseData;

import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PayOSService payOSService;

    @PostMapping("/premium/subscribe")
    public ResponseEntity<?> createPayment(@RequestBody CreatePaymentRequest request) throws Exception {
        String orderCode = UUID.randomUUID().toString();
        CheckoutResponseData data = payOSService.createPaymentLink(orderCode, request.getAmount(), request.getDescription(), request.getReturnUrl(), request.getCancelUrl());
        return ResponseEntity.ok(data);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> payload) {
        // Kiểm tra chữ ký nếu cần
        // Ghi nhận giao dịch đã thanh toán
        return ResponseEntity.ok("Webhook received");
    }
}
