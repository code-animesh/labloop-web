package com.labloop.web;

import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;

@SpringBootApplication 
public class LabLoopApplication {
    public static void main(String[] args) {
        SpringApplication.run(LabLoopApplication.class, args);
    }
}

@RestController 
@RequestMapping("/api") 
class Api {
    final JdbcTemplate db;
    
    Api(JdbcTemplate db) {
        this.db = db;
    }
    
    @GetMapping("/equipment")
    Object all() {
        return db.queryForList("SELECT * FROM equipment ORDER BY id DESC");
    }
    
    @PostMapping("/equipment")
    Object add(@RequestBody Map<String, String> x) {
        db.update("INSERT INTO equipment(code, name, category, status, condition_state, location) VALUES (?,?,?,?,?,?)",
            x.get("code"), x.get("name"), x.get("category"), x.get("status"), x.get("condition"), x.get("location"));
        return Map.of("ok", true);
    }
    
    @PutMapping("/equipment/{id}")
    Object edit(@PathVariable long id, @RequestBody Map<String, String> x) {
        db.update("UPDATE equipment SET name=?, category=?, status=?, condition_state=?, location=? WHERE id=?",
            x.get("name"), x.get("category"), x.get("status"), x.get("condition"), x.get("location"), id);
        return Map.of("ok", true);
    }
    
    @DeleteMapping("/equipment/{id}")
    Object del(@PathVariable long id) {
        db.update("DELETE FROM activity WHERE equipment_id=?", id);
        db.update("DELETE FROM equipment WHERE id=?", id);
        return Map.of("ok", true);
    }
    
    @PostMapping("/equipment/{id}/{action}")
    Object act(@PathVariable long id, @PathVariable String action, @RequestBody Map<String, String> data) {
        String status = action.equals("borrow") ? "BORROWED" : action.equals("return") ? "AVAILABLE" : "MAINTENANCE";
        String condition = data.getOrDefault("condition", "GOOD");
        
        db.update("UPDATE equipment SET status=?, condition_state=? WHERE id=?", status, condition, id);
        
        db.update("INSERT INTO activity (equipment_id, action, person, note) VALUES (?, ?, ?, ?)", 
            id, action.toUpperCase(), "System User", "Condition logged as " + condition);
            
        return Map.of("ok", true);
    }

    @GetMapping("/equipment/{id}/activity")
    Object history(@PathVariable long id) {
        return db.queryForList("SELECT * FROM activity WHERE equipment_id=? ORDER BY created_at DESC", id);
    }
}