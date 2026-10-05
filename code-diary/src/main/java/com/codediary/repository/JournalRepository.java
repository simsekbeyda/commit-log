package com.codediary.repository;

import com.codediary.dto.TagCount;
import com.codediary.model.Journal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Tüm sorgular günlüğün sahibine göre filtrelenir; kullanıcılar birbirinin günlüklerini göremez. */
@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {

    Optional<Journal> findByIdAndOwnerIdAndActiveTrue(Long id, Long ownerId);

    long countByOwnerIdAndActiveTrue(Long ownerId);

    /**
     * Boş {@code q} ve {@code tag} filtre uygulamaz. (IS NULL yerine boş metin kullanılır; PostgreSQL
     * tipsiz null parametrelerin türünü çıkaramıyor.)
     */
    @Query("""
            SELECT j FROM Journal j
            WHERE j.owner.id = :ownerId
              AND j.active = true
              AND (LOWER(j.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(j.content) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:tag = '' OR :tag MEMBER OF j.tags)
            """)
    Page<Journal> search(@Param("ownerId") Long ownerId, @Param("q") String query,
                         @Param("tag") String tag, Pageable pageable);

    @Query("""
            SELECT new com.codediary.dto.TagCount(t, COUNT(j))
            FROM Journal j JOIN j.tags t
            WHERE j.owner.id = :ownerId AND j.active = true
            GROUP BY t
            ORDER BY COUNT(j) DESC, t
            """)
    List<TagCount> countTags(@Param("ownerId") Long ownerId);

    @Query("SELECT j.createdAt FROM Journal j WHERE j.owner.id = :ownerId AND j.active = true AND j.createdAt >= :from")
    List<LocalDateTime> findCreatedAtSince(@Param("ownerId") Long ownerId, @Param("from") LocalDateTime from);

    List<Journal> findByOwnerIdAndActiveTrueAndCreatedAtGreaterThanEqualOrderByCreatedAt(Long ownerId, LocalDateTime from);

    /** Kullanıcı hesapları eklenmeden önce oluşturulmuş sahipsiz günlükleri bir kullanıcıya bağlar. */
    @Modifying
    @Query("UPDATE Journal j SET j.owner.id = :ownerId WHERE j.owner IS NULL")
    int assignOrphansTo(@Param("ownerId") Long ownerId);
}
