package com.gym.workout_service;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Workout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String nome;

    @ElementCollection
    @CollectionTable(name = "workout_exercises", joinColumns = @JoinColumn(name = "workout_id"))
    @Column(name = "exercise_id")
    private List<Long> exerciseIds = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public List<Long> getExerciseIds() { return exerciseIds; }
    public void setExerciseIds(List<Long> exerciseIds) { this.exerciseIds = exerciseIds; }
}