package com.codediary.controller;

import com.codediary.dto.ActivityResponse;
import com.codediary.dto.JournalCreateRequest;
import com.codediary.dto.JournalResponse;
import com.codediary.dto.TagCount;
import com.codediary.services.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Journals", description = "Günlük CRUD işlemleri")
@RestController
@RequestMapping("/rest/api/journals")
public class RestJournalController {

    private static final int MAX_PAGE_SIZE = 50;

    private final JournalService journalService;

    public RestJournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @Operation(summary = "Yeni günlük oluştur")
    @PostMapping
    public ResponseEntity<JournalResponse> createJournal(@Valid @RequestBody JournalCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(journalService.createJournal(request));
    }

    @Operation(summary = "Günlükleri listele (sayfalı, isteğe bağlı arama ve etiket filtresi)")
    @GetMapping
    public ResponseEntity<Page<JournalResponse>> getJournals(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @ParameterObject Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt", "id")
        );
        return ResponseEntity.ok(journalService.getJournals(q, tag, sortedPageable));
    }

    @Operation(summary = "Toplam günlük sayısı")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of("total", journalService.countJournals()));
    }

    @Operation(summary = "Kullanılan etiketler ve günlük sayıları")
    @GetMapping("/tags")
    public ResponseEntity<List<TagCount>> getTags() {
        return ResponseEntity.ok(journalService.getTags());
    }

    @Operation(summary = "Isı haritası için günlük yazma aktivitesi ve seriler")
    @GetMapping("/activity")
    public ResponseEntity<ActivityResponse> getActivity(@RequestParam(defaultValue = "365") int days) {
        return ResponseEntity.ok(journalService.getActivity(days));
    }

    @Operation(summary = "Tek bir günlüğü getir")
    @GetMapping("/{id}")
    public ResponseEntity<JournalResponse> getJournalById(@PathVariable Long id) {
        return ResponseEntity.ok(journalService.getJournal(id));
    }

    @Operation(summary = "Günlüğü güncelle")
    @PutMapping("/{id}")
    public ResponseEntity<JournalResponse> updateJournal(
            @PathVariable Long id,
            @Valid @RequestBody JournalCreateRequest request) {
        return ResponseEntity.ok(journalService.updateJournal(id, request));
    }

    @Operation(summary = "Günlüğü sil (soft delete)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJournal(@PathVariable Long id) {
        journalService.deleteJournal(id);
        return ResponseEntity.noContent().build();
    }
}
