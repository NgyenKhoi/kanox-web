package com.example.social_media.controller;

import com.example.social_media.dto.payment.ConfirmPremiumRequest;
import com.example.social_media.dto.payment.CreatePaymentRequest;
import com.example.social_media.entity.User;
import com.example.social_media.jwt.JwtService;
import com.example.social_media.repository.UserRepository;
import com.example.social_media.service.PayOSService;
import com.example.social_media.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.type.CheckoutResponseData;

import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PayOSService payOSService;

    @Autowired
    private PaymentService paymentService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
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



    @PostMapping("/premium/confirm")
    public ResponseEntity<?> confirmPremium(@RequestHeader("Authorization") String authHeader,
                                            @RequestBody ConfirmPremiumRequest request) {
        try {
            String token = authHeader.substring(7); // Bỏ "Bearer "
            String username = jwtService.extractUsername(token); // Lấy username từ token

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            paymentService.confirmPremium(user.getId(), request);
            return ResponseEntity.ok("Premium activated successfully");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error confirming premium: " + e.getMessage());
        }
    }
}
