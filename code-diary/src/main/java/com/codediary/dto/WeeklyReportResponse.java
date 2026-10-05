package com.codediary.dto;

import java.time.LocalDate;

/** @param report Markdown rapor; o hafta hiç günlük yoksa {@code null} */
public record WeeklyReportResponse(LocalDate from, LocalDate to, int entryCount, String report) {
}
