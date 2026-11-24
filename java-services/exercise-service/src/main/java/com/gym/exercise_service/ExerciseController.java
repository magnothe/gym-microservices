package com.gym.exercise_service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/exercises")
@CrossOrigin(origins = "*")
public class ExerciseController {

    private final ExerciseRepository repo;

    public ExerciseController(ExerciseRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Exercise> listar() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exercise> buscar(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Exercise criar(@RequestBody Exercise e) {
        return repo.save(e);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exercise> editar(@PathVariable Long id, @RequestBody Exercise novo) {
        return repo.findById(id).map(e -> {
            e.setNome(novo.getNome());
            e.setGrupoMuscular(novo.getGrupoMuscular());
            e.setDescricao(novo.getDescricao());
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}