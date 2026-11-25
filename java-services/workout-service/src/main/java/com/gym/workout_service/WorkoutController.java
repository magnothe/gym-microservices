package com.gym.workout_service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.*;

@RestController
@RequestMapping("/workouts")
@CrossOrigin(origins = "*")
public class WorkoutController {

    private final WorkoutRepository repo;
    private final RestClient exerciseClient;

    public WorkoutController(WorkoutRepository repo,
                             @Value("${exercise.service.url}") String exerciseUrl) {
        this.repo = repo;
        this.exerciseClient = RestClient.create(exerciseUrl);
    }

    // Consome o Exercise Service: retorna null se o exercício não existe
    private Object buscarExercicio(Long id) {
        try {
            return exerciseClient.get().uri("/exercises/{id}", id)
                    .retrieve().body(Object.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    private boolean exerciciosValidos(List<Long> ids) {
        return ids == null || ids.stream().allMatch(id -> buscarExercicio(id) != null);
    }

    @GetMapping
    public List<Workout> listar(@RequestParam(required = false) Long userId) {
        return userId == null ? repo.findAll() : repo.findByUserId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detalhar(@PathVariable Long id) {
        return repo.findById(id).map(w -> {
            List<Object> exercicios = w.getExerciseIds().stream()
                    .map(this::buscarExercicio).filter(Objects::nonNull).toList();
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("id", w.getId());
            resp.put("userId", w.getUserId());
            resp.put("nome", w.getNome());
            resp.put("exercicios", exercicios);
            return ResponseEntity.ok(resp);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Workout w) {
        if (!exerciciosValidos(w.getExerciseIds())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("exerciseId inválido: exercício não existe no Exercise Service");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(w));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Workout novo) {
        if (!exerciciosValidos(novo.getExerciseIds())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("exerciseId inválido: exercício não existe no Exercise Service");
        }
        return repo.findById(id).<ResponseEntity<?>>map(w -> {
            w.setNome(novo.getNome());
            w.setUserId(novo.getUserId());
            w.setExerciseIds(novo.getExerciseIds());
            return ResponseEntity.ok(repo.save(w));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}