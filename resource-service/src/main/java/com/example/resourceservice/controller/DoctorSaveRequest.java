package com.example.resourceservice.controller;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoctorSaveRequest {
    private String name;
    private Long specialtyId;
    private Double consultationPrice;
    private Integer experienceYears;
    private String imageName;
}