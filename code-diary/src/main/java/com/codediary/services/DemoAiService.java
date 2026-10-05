package com.codediary.services;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * OpenAI anahtarı yokken kullanılan, kural tabanlı "demo" yapay zeka.
 * Projeyi klonlayan herkes AI özelliklerini ücretsiz ve anahtarsız deneyebilsin diye
 * günlük içeriğinden basit sezgilerle özet, duygu, anahtar kelime ve öneri üretir.
 */
@Service
public class DemoAiService {

    /** Kelime kökleri: Türkçe ekleri yakalamak için önek olarak eşleştirilir (çöz → çözdüm, çözüldü). */
    private static final List<String> POSITIVE_STEMS = List.of(
            "başard", "başarı", "çözd", "çözül", "öğren", "keyif", "harika", "güzel", "mutlu", "sevin",
            "ilerle", "tamamla", "verimli", "eğlen", "anladım", "kolay", "süper",
            "solved", "fixed", "learn", "great", "happy", "awesome", "worked", "finish", "complet",
            "productiv", "enjoy", "progress", "succe", "nice", "understood");

    private static final List<String> NEGATIVE_STEMS = List.of(
            "hata", "takıl", "zorlan", "sinir", "yorul", "çalışmad", "anlamad", "sorun", "bozul",
            "başaramad", "kötü", "moral", "bıkt", "çöktü", "sıkıl", "error", "stuck", "frustrat", "tired",
            "broke", "fail", "crash", "confus", "annoy", "problem", "issue", "difficult");

    /** Önek olarak eşleşmemesi gereken kısa kelimeler ("bug" → "bugün" gibi yanlış eşleşmeleri önler). */
    private static final Set<String> NEGATIVE_WORDS = Set.of("bug", "bugs", "buggy", "zor", "zordu");

    private static final Set<String> STOP_WORDS = Set.of(
            "bugün", "biraz", "bunu", "şunu", "için", "olarak", "daha", "sonra", "önce", "kadar", "gibi",
            "ancak", "fakat", "ama", "çünkü", "yine", "çok", "olan", "oldu", "ettim", "yaptım", "şimdi",
            "bence", "aslında", "neden", "nasıl", "bütün", "tüm", "hangi", "yani", "zaten", "bile", "ile",
            "ve", "veya", "bir", "bu", "şu", "o", "de", "da", "ki", "mi", "ne", "en", "her",
            "today", "about", "after", "before", "because", "which", "there", "their", "these", "those",
            "would", "could", "should", "really", "while", "where", "when", "what", "with", "that", "this",
            "from", "have", "been", "were", "into", "some", "also", "just", "then", "than", "them", "they");

    /** Önerisi olmasa da anahtar kelime olarak öne çıkarılan teknik terimler. */
    private static final Set<String> KNOWN_TERMS = Set.of(
            "jwt", "jpa", "hibernate", "redis", "postgresql", "mysql", "mongodb", "kafka", "rest", "graphql",
            "html", "node", "vue", "angular", "next", "kotlin", "rust", "aws", "azure", "linux", "junit", "mockito",
            "cache", "security", "cors", "oauth", "microservice", "hook", "useeffect", "maven", "gradle", "nginx",
            "kubernetes", "swagger", "lombok", "dto", "orm", "ci", "cd", "devops", "frontend", "backend");

    /** Türkçe fiil çekimleri ("çözdüm", "taşıdım", "çalışıyorum") anahtar kelime olmaz. */
    private static final java.util.regex.Pattern VERB_LIKE = java.util.regex.Pattern.compile(
            ".*(d[ıiuü]m|t[ıiuü]m|d[ıiuü]k|t[ıiuü]k|yor\\p{L}*|m[ae]k|[ıiuü]nca|[ae]rak|d[ıiuü]|t[ıiuü])$");

    /** Tanınan teknik terimler ve bunlara özel gelişim önerileri (tr, en). */
    private static final Map<String, String[]> TECH_TIPS = new LinkedHashMap<>();

    static {
        tip("java", "Java'da **Stream API** ve **record** gibi modern özellikleri küçük örneklerle pekiştir.",
                "Reinforce modern Java features like the **Stream API** and **records** with small exercises.");
        tip("spring", "Spring'de bir katmanı (ör. servis) **birim testleriyle** kapsayarak bağımlılık enjeksiyonunu daha iyi kavra.",
                "Cover one Spring layer (e.g. a service) with **unit tests** to deepen your grasp of dependency injection.");
        tip("react", "React'te tekrar eden mantığı **custom hook**'lara taşıyarak bileşenleri sadeleştir.",
                "Move repeated React logic into **custom hooks** to keep components lean.");
        tip("javascript", "JavaScript'te **async/await** ve hata yakalama akışını küçük bir projede pratik et.",
                "Practice **async/await** and error handling in JavaScript with a small side project.");
        tip("typescript", "TypeScript'te **strict** modu açıp tip hatalarını tek tek temizlemek iyi bir egzersiz olur.",
                "Turn on TypeScript **strict** mode and fix the type errors one by one — great practice.");
        tip("python", "Python'da **type hint** ve `pytest` ile kodunu daha güvenilir hale getir.",
                "Make your Python code more reliable with **type hints** and `pytest`.");
        tip("sql", "Yavaş sorguları `EXPLAIN` ile incele ve doğru **index** seçimini öğren.",
                "Inspect slow queries with `EXPLAIN` and learn how to choose the right **indexes**.");
        tip("docker", "Docker imajlarını **multi-stage build** ile küçültmeyi dene.",
                "Try shrinking your Docker images with **multi-stage builds**.");
        tip("kubernetes", "Kubernetes'te **liveness/readiness probe** ve kaynak limitlerini kendi servisinde uygula.",
                "Apply **liveness/readiness probes** and resource limits to your own Kubernetes service.");
        tip("git", "Git'te **rebase** ve küçük, anlamlı commit alışkanlığı üzerine çalış.",
                "Work on **rebase** and the habit of small, meaningful Git commits.");
        tip("api", "API tasarımında **tutarlı hata gövdeleri** ve doğru HTTP durum kodlarına dikkat et.",
                "In API design, focus on **consistent error bodies** and correct HTTP status codes.");
        tip("test", "Yazdığın her hata düzeltmesi için önce hatayı yakalayan bir **test** yazmayı alışkanlık edin.",
                "Make it a habit to write a failing **test** before every bug fix.");
        tip("css", "CSS'te **Flexbox/Grid** ile responsive bir layout'u sıfırdan kurmayı dene.",
                "Build a responsive layout from scratch with CSS **Flexbox/Grid**.");
        tip("algoritma", "Her gün bir **algoritma** sorusu çözüp zaman/alan karmaşıklığını not et.",
                "Solve one **algorithm** problem a day and note its time/space complexity.");
        tip("algorithm", "Her gün bir **algoritma** sorusu çözüp zaman/alan karmaşıklığını not et.",
                "Solve one **algorithm** problem a day and note its time/space complexity.");
    }

    private static final String[][] GENERIC_TIPS = {
            {"Öğrendiklerini kısa bir **blog yazısı** veya README notu olarak paylaş; anlatmak öğrenmeyi pekiştirir.",
                    "Share what you learned as a short **blog post** or README note; teaching reinforces learning."},
            {"Takıldığın noktaları **hata mesajı + denediğin çözümler** formatında not al; bir sonraki sefere hız kazandırır.",
                    "Log blockers as **error message + attempted fixes**; it speeds you up next time."},
            {"Yarın için **tek bir net hedef** belirle ve günün sonunda bu günlüğe sonucunu yaz.",
                    "Set **one clear goal** for tomorrow and record the outcome in this journal."},
    };

    private static final String[] MORALE_TIP = {
            "Zorlandığın gün olabilir; problemi **daha küçük parçalara** böl ve kısa bir mola ver. Takılmak öğrenmenin bir parçası.",
            "Tough days happen; break the problem into **smaller pieces** and take a short break. Getting stuck is part of learning."};

    private static void tip(String term, String tr, String en) {
        TECH_TIPS.put(term, new String[]{tr, en});
    }

    public String summarize(String content) {
        List<String> sentences = sentences(content);
        StringBuilder summary = new StringBuilder();
        for (String sentence : sentences) {
            if (summary.length() > 0 && summary.length() + sentence.length() > 320) break;
            summary.append(summary.length() > 0 ? " " : "").append(sentence);
            if (summary.length() >= 200) break;
        }
        List<String> keywords = extractKeywords(content);
        if (keywords.isEmpty()) {
            return summary.toString();
        }
        String topics = keywords.stream().limit(3).map(k -> "`" + k + "`").collect(Collectors.joining(", "));
        return summary + "\n\n" + text("**Öne çıkan konular:** ", "**Key topics:** ") + topics;
    }

    /** @return "positive", "negative" veya "neutral" */
    public String analyzeSentiment(String content) {
        int score = 0;
        int last = 0;
        for (String word : words(content)) {
            int polarity = polarity(word);
            score += polarity;
            if (polarity != 0) last = polarity;
        }
        // Eşitlikte günlüğün nasıl bittiğine bakılır: "takıldım ama sonunda çözdüm" → pozitif
        int result = score != 0 ? score : last;
        if (result > 0) return "positive";
        if (result < 0) return "negative";
        return "neutral";
    }

    private static int polarity(String word) {
        if (NEGATIVE_WORDS.contains(word) || NEGATIVE_STEMS.stream().anyMatch(word::startsWith)) return -1;
        if (POSITIVE_STEMS.stream().anyMatch(word::startsWith)) return 1;
        return 0;
    }

    /**
     * Öncelik sırası: bilinen teknik terimler → cümle ortasında büyük harfle yazılmış özel isimler
     * (ör. "Props", "TypeScript'e" → "typescript") → birden fazla geçen, fiil olmayan kelimeler.
     */
    public List<String> extractKeywords(String content) {
        List<String> words = words(content);
        Set<String> keywords = new LinkedHashSet<>();
        words.stream().filter(word -> TECH_TIPS.containsKey(word) || KNOWN_TERMS.contains(word)).forEach(keywords::add);
        keywords.addAll(properNouns(content));

        Map<String, Long> frequency = words.stream()
                .filter(word -> word.length() >= 4 && !STOP_WORDS.contains(word) && !word.matches("\\d+")
                        && !VERB_LIKE.matcher(word).matches())
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
        frequency.entrySet().stream()
                .filter(entry -> entry.getValue() >= 2)
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .forEach(keywords::add);

        return keywords.stream().limit(5).toList();
    }

    private static List<String> properNouns(String content) {
        List<String> result = new ArrayList<>();
        for (String sentence : sentences(content)) {
            String[] tokens = sentence.split("\\s+");
            for (int i = 1; i < tokens.length; i++) { // cümlenin ilk kelimesi zaten büyük harfle başlar
                String token = tokens[i].split("['’]")[0].replaceAll("[^\\p{L}\\p{N}+#]", "");
                if (token.length() >= 2 && Character.isUpperCase(token.charAt(0))) {
                    String word = token.replace('İ', 'i').toLowerCase(Locale.ROOT);
                    if (!STOP_WORDS.contains(word)) result.add(word);
                }
            }
        }
        return result;
    }

    public String suggest(String content) {
        int lang = isTurkish() ? 0 : 1;
        List<String> tips = new ArrayList<>();
        Set<String> words = new LinkedHashSet<>(words(content));
        TECH_TIPS.forEach((term, texts) -> {
            if (words.contains(term) && !tips.contains(texts[lang])) tips.add(texts[lang]);
        });
        List<String> selected = new ArrayList<>(tips.stream().limit(2).toList());
        if ("negative".equals(analyzeSentiment(content))) {
            selected.add(MORALE_TIP[lang]);
        }
        for (String[] generic : GENERIC_TIPS) {
            if (selected.size() >= 3) break;
            selected.add(generic[lang]);
        }
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < selected.size() && i < 3; i++) {
            result.append(i + 1).append(". ").append(selected.get(i)).append('\n');
        }
        return result.toString().trim();
    }

    public String answer(String content, String question) {
        Set<String> questionWords = words(question).stream()
                .filter(word -> word.length() >= 3 && !STOP_WORDS.contains(word))
                .collect(Collectors.toSet());
        List<String> matches = sentences(content).stream()
                .filter(sentence -> words(sentence).stream().anyMatch(word -> questionWords.stream()
                        .anyMatch(q -> word.startsWith(q) || q.startsWith(word) && word.length() >= 4)))
                .limit(3)
                .toList();
        if (matches.isEmpty()) {
            return text(
                    "Demo modunda yalnızca günlük içeriğine dayanarak yanıt verebiliyorum ve bu soruyla ilgili bir kısım bulamadım. "
                            + "Daha ayrıntılı yanıtlar için `code-diary/.env` dosyasına bir OpenAI API anahtarı ekleyebilirsin.",
                    "In demo mode I can only answer from the journal itself, and I couldn't find anything related to this question. "
                            + "Add an OpenAI API key to `code-diary/.env` for richer answers.");
        }
        return text("Günlükte bununla ilgili şu kısımlar geçiyor:\n\n",
                "Here is what the journal says about this:\n\n")
                + matches.stream().map(sentence -> "> " + sentence).collect(Collectors.joining("\n>\n"));
    }

    /** Haftalık rapor: konu sıklığı, ruh hali dağılımı ve en sık konulara göre öneriler. */
    public String weeklyReport(List<String> contents, int activeDays) {
        String all = String.join("\n", contents);
        List<String> topics = extractKeywords(all).stream().limit(4).toList();
        Map<String, Long> moods = contents.stream()
                .collect(Collectors.groupingBy(this::analyzeSentiment, Collectors.counting()));

        StringBuilder report = new StringBuilder();
        report.append(text("### Haftanın özeti\n", "### Week in review\n"))
                .append(text("Bu hafta **" + activeDays + " farklı günde " + contents.size() + " günlük** yazdın.",
                        "You wrote **" + contents.size() + " entries on " + activeDays + " different days** this week."));
        if (!topics.isEmpty()) {
            String list = topics.stream().map(t -> "`" + t + "`").collect(Collectors.joining(", "));
            report.append(text(" En çok üzerinde durduğun konular: ", " Your main topics: ")).append(list).append('.');
        }
        report.append("\n\n").append(text("### Ruh hali\n", "### Mood\n"))
                .append(text("- 😊 Pozitif: ", "- 😊 Positive: ")).append(moods.getOrDefault("positive", 0L)).append('\n')
                .append(text("- 😐 Nötr: ", "- 😐 Neutral: ")).append(moods.getOrDefault("neutral", 0L)).append('\n')
                .append(text("- 😔 Negatif: ", "- 😔 Negative: ")).append(moods.getOrDefault("negative", 0L)).append("\n\n")
                .append(text("### Gelecek hafta için\n", "### Next week\n"))
                .append(suggest(all).lines().limit(2)
                        .map(line -> "- " + line.replaceFirst("^\\d+\\.\\s*", ""))
                        .collect(Collectors.joining("\n")));
        return report.toString();
    }

    private static List<String> sentences(String content) {
        return Arrays.stream(content.trim().split("(?<=[.!?])\\s+|\\n+"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }

    private static List<String> words(String text) {
        // Türkçe locale "API" kelimesini "apı" yapacağı için ROOT kullanılır; yalnızca "İ" elle düzeltilir
        return Arrays.stream(text.replace('İ', 'i').toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}+#]+"))
                .filter(StringUtils::hasText)
                .toList();
    }

    private static boolean isTurkish() {
        return "tr".equals(LocaleContextHolder.getLocale().getLanguage());
    }

    private static String text(String turkish, String english) {
        return isTurkish() ? turkish : english;
    }
}
