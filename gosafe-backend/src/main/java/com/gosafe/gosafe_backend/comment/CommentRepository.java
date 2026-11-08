package com.gosafe.gosafe_backend.comment;

import com.gosafe.gosafe_backend.common.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @EntityGraph(attributePaths = "author")
    Page<Comment> findByNotice_IdAndInitialFalseAndStatusOrderByCreatedAtAsc(
            UUID noticeId,
            ContentStatus status,
            Pageable pageable
    );

    Optional<Comment> findFirstByNotice_IdAndInitialTrue(UUID noticeId);
}
