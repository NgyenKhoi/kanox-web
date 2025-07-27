package com.example.social_media.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PayOSService {
    private final PayOS payOS;

    public CheckoutResponseData createPaymentLink(String orderCode, int amount, String description, String returnUrl, String cancelUrl) throws Exception {
//        PaymentData paymentData = new PaymentData(
//                orderCode,
//                amount,
//                description,
//                returnUrl,
//                "https://yourdomain.com/webhook", // optional: webhook
//                List.of(new ItemData("Tour Booking", 1, amount)) // optional
//        );
        long orderCode1 = System.currentTimeMillis();
        PaymentData paymentData = PaymentData.builder()
                .orderCode(orderCode1)
                .amount(amount)
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .items(List.of(ItemData.builder().name("Kanox prenium").price(2000).quantity(1).build())).build();




        return payOS.createPaymentLink(paymentData);
    }
}

