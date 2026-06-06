package com.example.authservice.dto;

public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private String role;
    private Long id;
    private Long doctorId;

    public AuthResponse(String token, String name, String email, String role, Long id, Long doctorId) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.role = role;
        this.id=id;
        this.doctorId=doctorId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // Generăm getter și setter pentru ID
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

}