package com.gym.exercise_service;

import jakarta.persistence.*;

@Entity
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String grupoMuscular;
    private String descricao;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getGrupoMuscular() { return grupoMuscular; }
    public void setGrupoMuscular(String g) { this.grupoMuscular = g; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String d) { this.descricao = d; }
}