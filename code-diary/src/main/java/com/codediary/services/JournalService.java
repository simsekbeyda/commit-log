package com.codediary.services;

import com.codediary.dto.ActivityResponse;
import com.codediary.dto.JournalCreateRequest;
import com.codediary.dto.JournalResponse;
import com.codediary.dto.TagCount;
import com.codediary.exception.ResourceNotFoundException;
import com.codediary.model.Journal;
import com.codediary.repository.JournalRepository;
import com.codediary.repository.UserRepository;
import com.codediary.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class JournalService {

    static final int MAX_TAGS = 10;
    private static final int MAX_TAG_LENGTH = 30;
    private static final int MAX_ACTIVITY_DAYS = 366;

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public JournalService(JournalRepository journalRepository, UserRepository userRepository, CurrentUser currentUser) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public JournalResponse createJournal(JournalCreateRequest request) {
        Journal journal = new Journal();
        applyRequest(journal, request);
        journal.setActive(true);
        journal.setOwner(userRepository.getReferenceById(currentUser.id()));
        return mapToResponse(journalRepository.save(journal));
    }

    @Transactional(readOnly = true)
    public Page<JournalResponse> getJournals(String query, String tag, Pageable pageable) {
        String q = StringUtils.hasText(query) ? query.trim() : "";
        String normalizedTag = StringUtils.hasText(tag) ? normalizeTag(tag) : "";
        return journalRepository.search(currentUser.id(), q, normalizedTag == null ? "" : normalizedTag, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public JournalResponse getJournal(Long id) {
        return mapToResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public long countJournals() {
        return journalRepository.countByOwnerIdAndActiveTrue(currentUser.id());
    }

    @Transactional(readOnly = true)
    public List<TagCount> getTags() {
        return journalRepository.countTags(currentUser.id());
    }

    /** Son {@code days} günün günlük sayıları ve yazma serileri (ısı haritası için). */
    @Transactional(readOnly = true)
    public ActivityResponse getActivity(int days) {
        int range = Math.clamp(days, 1, MAX_ACTIVITY_DAYS);
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(range - 1L);

        Map<LocalDate, Long> counts = journalRepository.findCreatedAtSince(currentUser.id(), from.atStartOfDay())
                .stream()
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.groupingBy(Function.identity(), TreeMap::new, Collectors.counting()));

        List<ActivityResponse.Day> activeDays = counts.entrySet().stream()
                .map(entry -> new ActivityResponse.Day(entry.getKey(), entry.getValue()))
                .toList();
        return new ActivityResponse(from, today, activeDays, counts.size(),
                currentStreak(counts.keySet(), today), longestStreak(counts.keySet()));
    }

    /** Bugün henüz yazılmadıysa seri dünden itibaren sayılır; böylece gün bitmeden seri "kırılmaz". */
    static int currentStreak(Set<LocalDate> activeDays, LocalDate today) {
        LocalDate day = activeDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (activeDays.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }
        return streak;
    }

    static int longestStreak(Collection<LocalDate> sortedDays) {
        int longest = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate day : sortedDays) {
            current = previous != null && previous.plusDays(1).equals(day) ? current + 1 : 1;
            longest = Math.max(longest, current);
            previous = day;
        }
        return longest;
    }

    /** Son 7 günün (bugün dahil) günlükleri, eskiden yeniye. */
    @Transactional(readOnly = true)
    public List<Journal> findLastWeek() {
        LocalDate from = LocalDate.now().minusDays(6);
        List<Journal> journals = journalRepository
                .findByOwnerIdAndActiveTrueAndCreatedAtGreaterThanEqualOrderByCreatedAt(currentUser.id(), from.atStartOfDay());
        journals.forEach(journal -> journal.getTags().size()); // tembel koleksiyonu işlem içinde yükle
        return journals;
    }

    /** Başka bir kullanıcının günlüğü de "bulunamadı" (404) döner; varlığı bile sızdırılmaz. */
    public Journal findById(Long id) {
        return journalRepository.findByIdAndOwnerIdAndActiveTrue(id, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("journal.notFound", id));
    }

    @Transactional
    public void deleteJournal(Long id) {
        Journal journal = findById(id);
        journal.setActive(false);
        journalRepository.save(journal);
    }

    @Transactional
    public JournalResponse updateJournal(Long id, JournalCreateRequest request) {
        Journal journal = findById(id);
        applyRequest(journal, request);
        return mapToResponse(journalRepository.save(journal));
    }

    private void applyRequest(Journal journal, JournalCreateRequest request) {
        journal.setTitle(request.getTitle().trim());
        journal.setContent(request.getContent().trim());
        journal.getTags().clear();
        journal.getTags().addAll(normalizeTags(request.getTags()));
    }

    static Set<String> normalizeTags(List<String> tags) {
        Set<String> result = new LinkedHashSet<>();
        if (tags == null) return result;
        for (String tag : tags) {
            String normalized = normalizeTag(tag);
            if (normalized != null && result.size() < MAX_TAGS) {
                result.add(normalized);
            }
        }
        return result;
    }

    /** "#Spring Boot " → "spring-boot"; geçersizse null. */
    static String normalizeTag(String tag) {
        if (tag == null) return null;
        String normalized = tag.trim()
                .replaceFirst("^#+", "")
                .replace('İ', 'i')
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "-")
                .replaceAll("[^\\p{L}\\p{N}+#.\\-]", "");
        if (normalized.isEmpty()) return null;
        return normalized.length() > MAX_TAG_LENGTH ? normalized.substring(0, MAX_TAG_LENGTH) : normalized;
    }

    private JournalResponse mapToResponse(Journal journal) {
        return JournalResponse.builder()
                .id(journal.getId())
                .title(journal.getTitle())
                .content(journal.getContent())
                .tags(journal.getTags().stream().sorted().toList())
                .createdAt(journal.getCreatedAt())
                .updatedAt(journal.getUpdatedAt())
                .build();
    }
}
