package com.example.todo.controller;

import com.example.todo.dto.LoginRequest;
import com.example.todo.dto.RefreshRequest;
import com.example.todo.dto.TokenPairResponse;
import jakarta.validation.Valid;
import com.example.todo.dto.PasswordChangeDto;
import com.example.todo.dto.RegisterRequest;
import com.example.todo.dto.RegisterResponse;
import com.example.todo.dto.ResetRequestDto;
import com.example.todo.dto.ResetRequestResponse;
import com.example.todo.dto.ResetVerifyDto;
import com.example.todo.dto.VerifyResponse;
import com.example.todo.service.UserService;
import com.example.todo.service.TokenService;
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
    private final TokenService tokenService;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                          UserService userService,
                          JwtUtil jwtUtil,
                          TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        // Validate and register user
        userService.register(request.getEmail(), request.getPassword());
        return new RegisterResponse(request.getEmail());
    }

    @PostMapping("/login")
    public TokenPairResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        return tokenService.issueForEmail(request.getEmail());
    }

    @PostMapping("/refresh")
    public TokenPairResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return tokenService.refresh(request.getRefreshToken());
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
}
