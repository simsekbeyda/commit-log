package com.codediary.services;

import com.codediary.dto.WeeklyReportResponse;
import com.codediary.exception.AiServiceException;
import com.codediary.model.Journal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.ResponseFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Günlükler üzerinde OpenAI analizleri. Prompt'lar {@link AiPrompts} içindedir; yanıt dili isteğin
 * Accept-Language başlığına göre seçilir. Anahtar yoksa {@link DemoAiService} kullanılır.
 */
@Slf4j
@Service
public class AiService {

    private static final String MISSING_KEY = "not-configured";
    private static final Set<String> SENTIMENTS = Set.of("positive", "negative", "neutral");
    private static final int WEEKLY_ENTRY_LIMIT = 1500;
    static final String CACHE_NAME = "ai-results";

    private final ChatClient chatClient;
    private final JournalService journalService;
    private final String apiKey;
    private final DemoAiService demoAiService;
    private final boolean demoModeEnabled;
    private final Cache cache;

    /** Yapılandırılmış (JSON) yanıtlar için hedef tipler; Spring AI bunları otomatik doldurur. */
    record SentimentResult(String sentiment) {
    }

    record KeywordsResult(List<String> keywords) {
    }

    public AiService(ChatClient.Builder chatClientBuilder,
                     JournalService journalService,
                     DemoAiService demoAiService,
                     CacheManager cacheManager,
                     @Value("${spring.ai.openai.api-key}") String apiKey,
                     @Value("${app.ai.demo-mode:true}") boolean demoModeEnabled) {
        this.chatClient = chatClientBuilder.build();
        this.journalService = journalService;
        this.demoAiService = demoAiService;
        this.apiKey = apiKey;
        this.demoModeEnabled = demoModeEnabled;
        this.cache = Objects.requireNonNull(cacheManager.getCache(CACHE_NAME), CACHE_NAME + " önbelleği tanımlı değil");
    }

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey)
                && !MISSING_KEY.equals(apiKey)
                && !apiKey.startsWith("your_");
    }

    /** Anahtar yoksa ve demo modu açıksa kural tabanlı {@link DemoAiService} kullanılır. */
    public boolean isDemoMode() {
        return !isConfigured() && demoModeEnabled;
    }

    /** @return "openai", "demo" veya "off" */
    public String getMode() {
        if (isConfigured()) return "openai";
        return isDemoMode() ? "demo" : "off";
    }

    public String generateSummary(Long journalId, boolean refresh) {
        Journal journal = journalService.findById(journalId);
        return cached("summary", journal, refresh, () -> isDemoMode()
                ? demoAiService.summarize(journal.getContent())
                : text(request(AiPrompts.SUMMARY, journalMessage(journal.getContent()), 0.3, false)));
    }

    /** @return dil bağımsız kod: "positive", "negative" veya "neutral" */
    public String analyzeSentiment(Long journalId, boolean refresh) {
        Journal journal = journalService.findById(journalId);
        return cached("sentiment", journal, refresh, () -> {
            if (isDemoMode()) {
                return demoAiService.analyzeSentiment(journal.getContent());
            }
            SentimentResult result = execute(() -> request(AiPrompts.SENTIMENT, journalMessage(journal.getContent()), 0.0, true)
                    .call().entity(SentimentResult.class));
            String sentiment = result == null || result.sentiment() == null ? "" : result.sentiment().toLowerCase(Locale.ROOT);
            return SENTIMENTS.contains(sentiment) ? sentiment : "neutral";
        });
    }

    public List<String> extractKeywords(Long journalId, boolean refresh) {
        Journal journal = journalService.findById(journalId);
        return cached("keywords", journal, refresh, () -> {
            if (isDemoMode()) {
                return demoAiService.extractKeywords(journal.getContent());
            }
            KeywordsResult result = execute(() -> request(AiPrompts.KEYWORDS, journalMessage(journal.getContent()), 0.0, true)
                    .call().entity(KeywordsResult.class));
            if (result == null || result.keywords() == null) {
                return List.of();
            }
            Locale locale = LocaleContextHolder.getLocale();
            return result.keywords().stream()
                    .filter(StringUtils::hasText)
                    .map(keyword -> keyword.trim().toLowerCase(locale))
                    .distinct()
                    .limit(5)
                    .toList();
        });
    }

    public String getSuggestions(Long journalId, boolean refresh) {
        Journal journal = journalService.findById(journalId);
        return cached("suggestion", journal, refresh, () -> isDemoMode()
                ? demoAiService.suggest(journal.getContent())
                : text(request(AiPrompts.SUGGESTIONS, journalMessage(journal.getContent()), 0.6, false)));
    }

    /** Sorular serbest metin olduğu için önbelleğe alınmaz. */
    public String askQuestion(Long journalId, String question) {
        String content = journalService.findById(journalId).getContent();
        if (isDemoMode()) {
            return demoAiService.answer(content, question);
        }
        String userMessage = journalMessage(content) + "\n\n<question>\n" + escapeTags(question) + "\n</question>";
        return text(request(AiPrompts.ASK, userMessage, 0.4, false));
    }

    /** Son 7 günün günlüklerinden haftalık değerlendirme. Hiç günlük yoksa rapor {@code null} döner. */
    public WeeklyReportResponse weeklyReport(boolean refresh) {
        List<Journal> journals = journalService.findLastWeek();
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(6);
        if (journals.isEmpty()) {
            return new WeeklyReportResponse(from, to, 0, null);
        }
        // Anahtar, haftadaki günlüklerin kimlik ve güncellenme zamanlarından türetilir: biri değişirse rapor yenilenir
        String fingerprint = journals.stream()
                .map(journal -> journal.getId() + "@" + journal.getUpdatedAt())
                .collect(Collectors.joining(","));
        String key = "weekly:" + Integer.toHexString(fingerprint.hashCode()) + ":" + from + ":" + responseLanguage() + ":" + getMode();
        String report = cached(key, refresh, () -> {
            if (isDemoMode()) {
                long activeDays = journals.stream().map(journal -> journal.getCreatedAt().toLocalDate()).distinct().count();
                return demoAiService.weeklyReport(journals.stream().map(Journal::getContent).toList(), (int) activeDays);
            }
            String userMessage = journals.stream()
                    .map(journal -> "<journal date=\"" + journal.getCreatedAt().toLocalDate() + "\" title=\""
                            + escapeTags(journal.getTitle()).replace('"', '\'') + "\">\n"
                            + escapeTags(truncate(journal.getContent(), WEEKLY_ENTRY_LIMIT)) + "\n</journal>")
                    .collect(Collectors.joining("\n\n"));
            return text(request(weeklyPrompt(), userMessage, 0.5, false));
        });
        return new WeeklyReportResponse(from, to, journals.size(), report);
    }

    private static String weeklyPrompt() {
        boolean turkish = "Turkish".equals(responseLanguage());
        String[] headings = turkish
                ? new String[]{"Haftanın özeti", "Öğrendiklerin", "Zorlandığın noktalar", "Gelecek hafta için"}
                : new String[]{"Week in review", "What you learned", "Struggles", "Focus for next week"};
        String prompt = AiPrompts.WEEKLY;
        for (int i = 0; i < headings.length; i++) {
            prompt = prompt.replace("{heading" + (i + 1) + "}", headings[i]);
        }
        return prompt;
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }

    /**
     * Analiz sonuçları günlük + güncellenme zamanı + dil + mod anahtarıyla önbelleğe alınır; günlük
     * düzenlenince anahtar değiştiği için eski sonuç kendiliğinden geçersiz olur.
     */
    private <T> T cached(String type, Journal journal, boolean refresh, Supplier<T> compute) {
        String key = type + ":" + journal.getId() + ":" + journal.getUpdatedAt() + ":" + responseLanguage() + ":" + getMode();
        return cached(key, refresh, compute);
    }

    private <T> T cached(String key, boolean refresh, Supplier<T> compute) {
        if (refresh) {
            cache.evict(key);
        }
        try {
            return cache.get(key, compute::get);
        } catch (Cache.ValueRetrievalException e) {
            if (e.getCause() instanceof RuntimeException cause) {
                throw cause;
            }
            throw e;
        }
    }

    /** Yanıt dili isteğin Accept-Language başlığından seçilir (tr → Türkçe, diğerleri → İngilizce). */
    private static String responseLanguage() {
        return "tr".equals(LocaleContextHolder.getLocale().getLanguage()) ? "Turkish" : "English";
    }

    private static String journalMessage(String content) {
        return "<journal>\n" + escapeTags(content) + "\n</journal>";
    }

    /** Kullanıcı metni etiketleri kapatıp prompt'un dışına "kaçamasın". */
    private static String escapeTags(String text) {
        return text.replace("</journal>", "</ journal>").replace("</question>", "</ question>");
    }

    /**
     * Mesajlar şablon olarak işlenmesin diye hazır Message nesneleri olarak verilir;
     * böylece prompt'taki JSON örnekleri ve günlükteki kod parçalarındaki { } güvende kalır.
     */
    private ChatClient.ChatClientRequestSpec request(String systemPrompt, String userMessage,
                                                     double temperature, boolean json) {
        if (!isConfigured()) {
            throw new AiServiceException("ai.error.notConfigured");
        }
        OpenAiChatOptions.Builder options = OpenAiChatOptions.builder().temperature(temperature);
        if (json) {
            options.responseFormat(ResponseFormat.builder().type(ResponseFormat.Type.JSON_OBJECT).build());
        }
        return chatClient.prompt(new Prompt(List.of(
                new SystemMessage(systemPrompt.replace("{language}", responseLanguage())),
                new UserMessage(userMessage)), options.build()));
    }

    private String text(ChatClient.ChatClientRequestSpec request) {
        String response = execute(() -> request.call().content());
        if (!StringUtils.hasText(response)) {
            throw new AiServiceException("ai.error.empty");
        }
        return response.trim();
    }

    /** OpenAI hatalarını kullanıcıya gösterilecek yerelleştirilmiş mesaj anahtarlarına çevirir. */
    private <T> T execute(Supplier<T> call) {
        try {
            return call.get();
        } catch (AiServiceException e) {
            throw e;
        } catch (RuntimeException e) {
            String detail = String.valueOf(e.getMessage());
            if (detail.contains("invalid_api_key") || detail.contains("401")) {
                throw new AiServiceException("ai.error.invalidKey", e);
            }
            if (detail.contains("insufficient_quota") || detail.contains("429")) {
                throw new AiServiceException("ai.error.quota", e);
            }
            throw new AiServiceException("ai.error.unavailable", e);
        }
    }
}
