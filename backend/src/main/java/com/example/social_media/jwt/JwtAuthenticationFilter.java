package com.example.social_media.jwt;

import com.example.social_media.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("[JWT Filter] Processing request: " + request.getMethod() + " " + path);
        
        if (path.startsWith("/api/auth/") || path.startsWith("/ws")) {
            System.out.println("[JWT Filter] Skipping authentication for path: " + path);
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        System.out.println("[JWT Filter] Authorization header: " + (authHeader != null ? "Present" : "Missing"));
        String username = null;
        String jwt = null;

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
                System.out.println("[JWT Filter] Extracted JWT token (first 20 chars): " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
                username = jwtService.extractUsername(jwt);
                System.out.println("[JWT Filter] Extracted username: " + username);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("[JWT Filter] Loaded user details for: " + username);

                    boolean isTokenValid = jwtService.isTokenValid(jwt, userDetails);
                    System.out.println("[JWT Filter] Token valid: " + isTokenValid);
                    
                    if (isTokenValid) {
                        setAuthentication(userDetails, request);
                        System.out.println("[JWT Filter] Authentication set successfully");
                        userDetails.getAuthorities()
                                .forEach(auth -> System.out.println("[JWT Filter] Authority: " + auth.getAuthority()));
                    } else {
                        System.out.println("[JWT Filter] Token is invalid, authentication not set");
                    }
                } else if (username == null) {
                    System.out.println("[JWT Filter] Username is null from token");
                } else {
                    System.out.println("[JWT Filter] Authentication already exists in SecurityContext");
                }
            } else {
                System.out.println("[JWT Filter] No valid Authorization header found");
            }

            System.out.println("[JWT Filter] Proceeding with filter chain");
            filterChain.doFilter(request, response);

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.out.println("[JWT Filter] Token expired: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expired");
        } catch (io.jsonwebtoken.JwtException e) {
            System.out.println("[JWT Filter] Invalid token: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        } catch (Exception e) {
            System.out.println("[JWT Filter] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication error");
        }
    }

    private void setAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null,
                userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}