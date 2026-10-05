package com.codediary.services;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/** Seri hesabı ve etiket normalizasyonu için birim testleri. */
class JournalServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 5);

    private static Set<LocalDate> daysAgo(int... offsets) {
        return new TreeSet<>(Arrays.stream(offsets).mapToObj(TODAY::minusDays).toList());
    }

    @Test
    void currentStreakCountsBackFromToday() {
        assertThat(JournalService.currentStreak(daysAgo(0, 1, 2, 4), TODAY)).isEqualTo(3);
    }

    @Test
    void currentStreakSurvivesUntilTheDayEnds() {
        // Bugün henüz yazılmadı ama dün ve önceki gün yazıldı: seri bozulmuş sayılmaz
        assertThat(JournalService.currentStreak(daysAgo(1, 2), TODAY)).isEqualTo(2);
        assertThat(JournalService.currentStreak(daysAgo(2, 3), TODAY)).isZero();
    }

    @Test
    void longestStreakFindsTheLongestRun() {
        assertThat(JournalService.longestStreak(daysAgo(0, 1, 5, 6, 7, 8, 20))).isEqualTo(4);
        assertThat(JournalService.longestStreak(Set.of())).isZero();
    }

    @Test
    void tagsAreNormalized() {
        assertThat(JournalService.normalizeTag("  #Spring Boot ")).isEqualTo("spring-boot");
        assertThat(JournalService.normalizeTag("İŞLEM")).isEqualTo("işlem");
        assertThat(JournalService.normalizeTag("C++")).isEqualTo("c++");
        assertThat(JournalService.normalizeTag("<script>")).isEqualTo("script");
        assertThat(JournalService.normalizeTag("   ")).isNull();
        assertThat(JournalService.normalizeTags(List.of("a", "A", "#a", "b"))).containsExactly("a", "b");
    }
}
