package com.codediary.services;

import com.codediary.model.AppUser;
import com.codediary.model.Journal;
import com.codediary.repository.JournalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Demo ve misafir hesaplarına örnek günlükler ekler. Tarihler son birkaç haftaya yayılır;
 * böylece aktivite ısı haritası ve seri sayacı ilk açılışta dolu görünür.
 */
@Service
public class SampleDataService {

    private record Sample(int daysAgo, String title, String content, List<String> tags) {
    }

    private static final List<Sample> SAMPLES = List.of(
            new Sample(0, "Spring Security ile JWT",
                    "Bugün Spring Security ile JWT tabanlı kimlik doğrulama kurdum. Stateless oturum, "
                            + "token imzalama ve SecurityFilterChain yapılandırmasını öğrendim. CORS ayarında biraz takıldım "
                            + "ama sonunda çözdüm.",
                    List.of("spring", "security", "jwt")),
            new Sample(1, "Unit test yazmaya başladım",
                    "JUnit 5 ve Mockito ile servis katmanı için ilk testlerimi yazdım. Mock nesnelerle repository'yi "
                            + "taklit etmek kafamı biraz karıştırdı ama when/thenReturn mantığını oturttum. "
                            + "Test coverage %60'a çıktı, hedefim %80.",
                    List.of("testing", "junit", "mockito")),
            new Sample(2, "React state yönetiminde kayboldum",
                    "useEffect bağımlılık dizisini yanlış verdiğim için sonsuz döngüye girdim ve API'ye yüzlerce "
                            + "istek attım. Bir saat uğraştıktan sonra sorunu buldum ama biraz moralim bozuldu. "
                            + "Yarın React Query'ye bakmayı düşünüyorum.",
                    List.of("react", "frontend")),
            new Sample(3, "Docker ile PostgreSQL kurulumu",
                    "docker-compose ile PostgreSQL ve pgAdmin ayağa kaldırdım. Volume kullanmazsam container "
                            + "silindiğinde verinin de gittiğini fark ettim. Ortam değişkenlerini .env dosyasına taşıdım, "
                            + "bu sayede şifreleri repoya göndermemiş oldum.",
                    List.of("docker", "postgresql", "devops")),
            new Sample(4, "Spring Boot ile ilk REST API",
                    "Bugün Spring Boot ile ilk REST API'mi yazdım. Controller, Service ve Repository katmanlarını "
                            + "ayırmanın neden önemli olduğunu daha iyi anladım. DTO kullanarak entity'yi dışarı açmamayı "
                            + "öğrendim. Validation anotasyonlarıyla gelen isteği kontrol etmek çok pratik.",
                    List.of("spring", "rest-api")),
            new Sample(7, "JPA N+1 problemi",
                    "Listeleme sayfası çok yavaştı. Loglarda her satır için ayrı sorgu atıldığını gördüm: klasik N+1 "
                            + "problemi. JOIN FETCH ve @EntityGraph ile tek sorguya indirdim, sayfa 10 kat hızlandı.",
                    List.of("spring", "jpa", "performance")),
            new Sample(9, "Git rebase ile commit geçmişi",
                    "Feature branch'imdeki dağınık commit'leri interactive rebase ile toparladım. Bir ara conflict "
                            + "yüzünden paniğe kapıldım ama git reflog sayesinde her şeyi geri aldım. Çok şey öğrendim.",
                    List.of("git")),
            new Sample(12, "TypeScript'e geçiş",
                    "Küçük bir React projesini TypeScript'e taşıdım. strict modu açınca onlarca hata çıktı, "
                            + "tek tek düzelttim. Props tiplerini yazmak başta yavaşlattı ama hataları erken yakalıyor.",
                    List.of("typescript", "react", "frontend")),
            new Sample(16, "Algoritma çalışması: binary search",
                    "Binary search sorularında sınır koşullarında sürekli hata yapıyordum. lo/hi değişkenlerini "
                            + "değişmez (invariant) üzerinden düşününce oturdu. Bugün 4 soru çözdüm.",
                    List.of("algorithms")),
            new Sample(20, "Redis ile önbellekleme",
                    "Sık okunan bir endpoint için Spring Cache ve Redis kullandım. TTL ayarını ve cache invalidation "
                            + "stratejisini düşünmek gerekti. Yanıt süresi 300ms'den 20ms'ye düştü.",
                    List.of("redis", "spring", "performance"))
    );

    private final JournalRepository journalRepository;

    public SampleDataService(JournalRepository journalRepository) {
        this.journalRepository = journalRepository;
    }

    @Transactional
    public void createSampleJournals(AppUser owner) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        List<Journal> journals = new ArrayList<>();
        for (Sample sample : SAMPLES) {
            Journal journal = new Journal();
            journal.setTitle(sample.title());
            journal.setContent(sample.content());
            journal.setActive(true);
            journal.setOwner(owner);
            journal.getTags().addAll(sample.tags());
            LocalDateTime createdAt = today.minusDays(sample.daysAgo()).atTime(LocalTime.of(21, 0).minusMinutes(sample.daysAgo() * 7L));
            if (createdAt.isAfter(now)) {
                // Bugünün günlüğü gelecekte görünmesin ("18 saat sonra")
                createdAt = now.minusMinutes(5);
            }
            journal.setCreatedAt(createdAt);
            journal.setUpdatedAt(createdAt);
            journals.add(journal);
        }
        journalRepository.saveAll(journals);
    }
}
