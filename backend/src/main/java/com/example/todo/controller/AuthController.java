package com.example.todo.controller;

import com.example.todo.dto.LoginRequest;
import jakarta.validation.Valid;
import com.example.todo.dto.PasswordChangeDto;
import com.example.todo.dto.RegisterRequest;
import com.example.todo.dto.ResetRequestDto;
import com.example.todo.dto.ResetVerifyDto;
import com.example.todo.service.UserService;
import com.example.todo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                          UserService userService,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterRequest register(@Valid @RequestBody RegisterRequest request) {
        // Validate and register user
        userService.register(request.getEmail(), request.getPassword());
        return new RegisterRequest(request.getEmail(), "[REDACTED]");
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        String token = jwtUtil.generateToken(request.getEmail());
        return new LoginResponse(token);
    }

    @PostMapping("/reset-request")
    public ResetRequestResponse resetRequest(@Valid @RequestBody ResetRequestDto request) {
        String token = userService.requestReset(request.getEmail());
        return new ResetRequestResponse(token);
    }

    @PostMapping("/reset-verify")
    public VerifyResponse resetVerify(@Valid @RequestBody ResetVerifyDto request) {
        userService.verifyResetToken(request.getToken());
        return new VerifyResponse(true);
    }

    @PutMapping("/reset-change")
    public void resetChange(@Valid @RequestBody PasswordChangeDto request) {
        userService.changePasswordViaReset(request.getToken(), request.getNewPassword(), request.getConfirmPassword());
    }

    // Simple response DTOs
    public record LoginResponse(String token) {}
    public record ResetRequestResponse(String token) {}
    public record VerifyResponse(boolean verified) {}
}
