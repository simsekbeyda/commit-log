package com.codediary.controller;

import com.codediary.dto.AiQuestionRequest;
import com.codediary.dto.WeeklyReportResponse;
import com.codediary.services.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "AI", description = "Günlükler üzerinde yapay zeka analizleri")
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @Operation(summary = "AI servisinin yapılandırılıp yapılandırılmadığını döndürür")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "configured", aiService.isConfigured(),
                "mode", aiService.getMode()));
    }

    @Operation(summary = "Günlüğü özetle (sonuçlar önbelleğe alınır; refresh=true yeniden üretir)")
    @GetMapping("/summary/{journalId}")
    public ResponseEntity<String> getSummary(@PathVariable Long journalId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(aiService.generateSummary(journalId, refresh));
    }

    @Operation(summary = "Duygu analizi (Pozitif / Negatif / Nötr)")
    @GetMapping("/sentiment/{journalId}")
    public ResponseEntity<String> analyzeSentiment(@PathVariable Long journalId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(aiService.analyzeSentiment(journalId, refresh));
    }

    @Operation(summary = "Anahtar kelime çıkarımı")
    @GetMapping("/keywords/{journalId}")
    public ResponseEntity<List<String>> extractKeywords(@PathVariable Long journalId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(aiService.extractKeywords(journalId, refresh));
    }

    @Operation(summary = "Gelişim önerileri")
    @GetMapping("/suggestion/{journalId}")
    public ResponseEntity<String> getSuggestions(@PathVariable Long journalId,
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(aiService.getSuggestions(journalId, refresh));
    }

    @Operation(summary = "Son 7 günün günlüklerinden haftalık değerlendirme")
    @GetMapping("/weekly")
    public ResponseEntity<WeeklyReportResponse> weeklyReport(@RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(aiService.weeklyReport(refresh));
    }

    @Operation(summary = "Günlük hakkında soru sor")
    @PostMapping("/ask/{journalId}")
    public ResponseEntity<String> askQuestion(
            @PathVariable Long journalId,
            @Valid @RequestBody AiQuestionRequest request) {
        return ResponseEntity.ok(aiService.askQuestion(journalId, request.getQuestion()));
    }
}
