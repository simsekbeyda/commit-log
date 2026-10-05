package com.codediary.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Isı haritası verisi: yalnızca günlük yazılan günler döner (count > 0).
 *
 * @param currentStreak bugün ya da dün biten ardışık gün sayısı
 * @param longestStreak seçilen aralıktaki en uzun seri
 */
public record ActivityResponse(LocalDate from, LocalDate to, List<Day> days,
                               int activeDays, int currentStreak, int longestStreak) {

    public record Day(LocalDate date, long count) {
    }
}
