package com.gosafe.gosafe_backend.report;

import com.gosafe.gosafe_backend.comment.Comment;
import com.gosafe.gosafe_backend.comment.CommentRepository;
import com.gosafe.gosafe_backend.comment.CommentService;
import com.gosafe.gosafe_backend.common.ContentStatus;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.notice.Notice;
import com.gosafe.gosafe_backend.notice.NoticeRepository;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceRepository;
import com.gosafe.gosafe_backend.report.dto.CreateReportRequest;
import com.gosafe.gosafe_backend.report.dto.ReportDto;
import com.gosafe.gosafe_backend.reputation.ReputationService;
import com.gosafe.gosafe_backend.review.PlaceRatingService;
import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * RN17: denúncia procedente oculta o conteúdo e reduz a reputação da autora.
 */
@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final NoticeRepository noticeRepository;
    private final CommentRepository commentRepository;
    private final PlaceRepository placeRepository;
    private final CommentService commentService;
    private final PlaceRatingService placeRatingService;
    private final ReputationService reputationService;
    private final UserService userService;

    public ReportService(
            ReportRepository reportRepository,
            NoticeRepository noticeRepository,
            CommentRepository commentRepository,
            PlaceRepository placeRepository,
            CommentService commentService,
            PlaceRatingService placeRatingService,
            ReputationService reputationService,
            UserService userService
    ) {
        this.reportRepository = reportRepository;
        this.noticeRepository = noticeRepository;
        this.commentRepository = commentRepository;
        this.placeRepository = placeRepository;
        this.commentService = commentService;
        this.placeRatingService = placeRatingService;
        this.reputationService = reputationService;
        this.userService = userService;
    }

    @Transactional
    public ReportDto create(CreateReportRequest request, AuthUser authUser) {
        User reporter = userService.getActive(authUser.id());
        User targetAuthor = targetAuthor(request.targetType(), request.targetId());

        if (targetAuthor != null && targetAuthor.getId().equals(reporter.getId())) {
            throw Errors.badRequest("Não é possível denunciar o próprio conteúdo");
        }

        if (reportRepository.existsByReporter_IdAndTargetTypeAndTargetIdAndStatus(
                reporter.getId(), request.targetType(), request.targetId(), ReportStatus.PENDING)) {
            throw Errors.conflict("Você já denunciou este conteúdo e a denúncia está em análise");
        }

        Report report = new Report();

        report.setReporter(reporter);
        report.setTargetType(request.targetType());
        report.setTargetId(request.targetId());
        report.setTargetAuthor(targetAuthor);
        report.setReason(request.reason().trim());

        return toDto(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportDto> list(ReportStatus status, int page, int size) {
        return PageResponse.of(
                reportRepository.findByStatusOrderByCreatedAtAsc(status, Pages.of(page, size)).map(this::toDto)
        );
    }

    @Transactional
    public ReportDto resolve(UUID id, boolean upheld, AuthUser moderator) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> Errors.notFound("Denúncia não encontrada"));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw Errors.conflict("Denúncia já foi analisada");
        }

        if (upheld) {
            hideTarget(report);

            if (report.getTargetAuthor() != null) {
                reputationService.contributionRemoved(report.getTargetAuthor());
            }
        }

        report.setStatus(upheld ? ReportStatus.UPHELD : ReportStatus.REJECTED);
        report.setResolvedAt(Instant.now());
        report.setResolvedBy(userService.getActive(moderator.id()));

        return toDto(report);
    }

    private void hideTarget(Report report) {
        switch (report.getTargetType()) {
            case NOTICE -> noticeRepository.findById(report.getTargetId()).ifPresent(notice -> {
                notice.setStatus(ContentStatus.HIDDEN);
                placeRatingService.recalculate(notice.getPlace());
            });
            case COMMENT -> commentRepository.findById(report.getTargetId())
                    .filter(comment -> comment.getStatus() == ContentStatus.ACTIVE)
                    .ifPresent(comment -> commentService.hide(comment, ContentStatus.HIDDEN));
            case PLACE -> placeRepository.findById(report.getTargetId())
                    .ifPresent(place -> place.setActive(false));
        }
    }

    private User targetAuthor(ReportTarget type, UUID targetId) {
        return switch (type) {
            case NOTICE -> noticeRepository.findById(targetId)
                    .filter(notice -> notice.getStatus() == ContentStatus.ACTIVE)
                    .map(Notice::getAuthor)
                    .orElseThrow(() -> Errors.notFound("Aviso não encontrado"));
            case COMMENT -> commentRepository.findById(targetId)
                    .filter(comment -> comment.getStatus() == ContentStatus.ACTIVE)
                    .map(Comment::getAuthor)
                    .orElseThrow(() -> Errors.notFound("Comentário não encontrado"));
            case PLACE -> placeRepository.findById(targetId)
                    .filter(Place::getActive)
                    .map(Place::getCreatedBy)
                    .orElseThrow(() -> Errors.notFound("Local não encontrado"));
        };
    }

    private ReportDto toDto(Report report) {
        return new ReportDto(
                report.getId(),
                report.getTargetType(),
                report.getTargetId(),
                report.getReason(),
                report.getStatus(),
                report.getOrigin(),
                report.getCreatedAt(),
                report.getResolvedAt()
        );
    }
}
