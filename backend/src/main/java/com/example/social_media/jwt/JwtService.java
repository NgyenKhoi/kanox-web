package com.example.social_media.jwt;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;
import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String SECRET = "my-super-secret-key-which-is-at-least-256-bit-long";
    private static final long EXPIRATION_MS = 86400000; // 1 day
    private final Map<String, String> sessionTokenMap = new ConcurrentHashMap<>();
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            String username = Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
            System.out.println("Extracted username from token: " + username); // Log
            return username;
        } catch (JwtException e) {
            System.err.println("Error extracting username from token: " + e.getMessage());
            return null;
        }
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            System.err.println("Error parsing token claims: " + e.getMessage());
            throw e; // Ném ngoại lệ để debug dễ hơn
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            boolean expired = extractExpiration(token).before(new Date());
            System.out.println("Token expired: " + expired); // Log
            return expired;
        } catch (JwtException e) {
            System.err.println("Error checking token expiration: " + e.getMessage());
            return true; // Coi như hết hạn nếu có lỗi
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean valid = username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token);
            System.out.println("Token valid for user " + userDetails.getUsername() + ": " + valid); // Log
            return valid;
        } catch (JwtException e) {
            System.err.println("Error validating token: " + e.getMessage());
            return false;
        }
    }

    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 7 * 86400000)) // 7 ngày
                .signWith(key)
                .compact();
    }

    public String refreshToken(String refreshToken) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(refreshToken)
                    .getBody();

            String username = claims.getSubject();
            if (username != null && !isTokenExpired(refreshToken)) {
                String newToken = generateToken(username);
                System.out.println("Generated new access token for user: " + username); // Log
                return newToken;
            }
            System.err.println("Invalid or expired refresh token");
            return null;
        } catch (JwtException e) {
            System.err.println("Error refreshing token: " + e.getMessage());
            return null;
        }
    }
    public String extractTokenFromSession(String sessionId) {
        return sessionTokenMap.get(sessionId); // Trả về token dựa trên sessionId
    }
}