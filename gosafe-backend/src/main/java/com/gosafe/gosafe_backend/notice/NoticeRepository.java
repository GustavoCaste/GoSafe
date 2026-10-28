package com.gosafe.gosafe_backend.notice;

import com.gosafe.gosafe_backend.common.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NoticeRepository extends JpaRepository<Notice, UUID> {

    @EntityGraph(attributePaths = "author")
    Page<Notice> findByPlace_IdAndStatusOrderByLastActivityAtDesc(
            UUID placeId,
            ContentStatus status,
            Pageable pageable
    );
}
