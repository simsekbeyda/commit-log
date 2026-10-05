package com.codediary.config;

import com.codediary.model.AppUser;
import com.codediary.repository.JournalRepository;
import com.codediary.repository.UserRepository;
import com.codediary.services.AuthService;
import com.codediary.services.SampleDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * İlk açılışta {@code demo} kullanıcısını örnek günlüklerle oluşturur. Kullanıcı hesapları eklenmeden
 * önce yazılmış (sahipsiz) günlükler de kaybolmasın diye bu kullanıcıya bağlanır.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JournalRepository journalRepository;
    private final AuthService authService;
    private final SampleDataService sampleDataService;
    private final String demoUsername;
    private final String demoPassword;

    public DemoDataSeeder(UserRepository userRepository, JournalRepository journalRepository,
                          AuthService authService, SampleDataService sampleDataService,
                          @Value("${app.demo-user.username:demo}") String demoUsername,
                          @Value("${app.demo-user.password:demo1234}") String demoPassword) {
        this.userRepository = userRepository;
        this.journalRepository = journalRepository;
        this.authService = authService;
        this.sampleDataService = sampleDataService;
        this.demoUsername = demoUsername;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        AppUser demo = userRepository.findByUsernameIgnoreCase(demoUsername).orElse(null);
        if (demo == null) {
            demo = authService.createUser(demoUsername, demoPassword, false);
            boolean hadJournals = journalRepository.count() > 0;
            if (!hadJournals) {
                sampleDataService.createSampleJournals(demo);
            }
            log.info("'{}' kullanıcısı oluşturuldu{}.", demoUsername, hadJournals ? "" : " ve örnek günlükler eklendi");
        }
        int migrated = journalRepository.assignOrphansTo(demo.getId());
        if (migrated > 0) {
            log.info("{} sahipsiz günlük '{}' kullanıcısına bağlandı.", migrated, demoUsername);
        }
    }
}
