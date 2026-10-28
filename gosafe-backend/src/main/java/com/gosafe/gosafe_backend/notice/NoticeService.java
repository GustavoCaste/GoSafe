package com.gosafe.gosafe_backend.notice;

import com.gosafe.gosafe_backend.comment.Comment;
import com.gosafe.gosafe_backend.comment.CommentRepository;
import com.gosafe.gosafe_backend.comment.CommentService;
import com.gosafe.gosafe_backend.common.ContentStatus;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.notice.dto.CreateNoticeRequest;
import com.gosafe.gosafe_backend.notice.dto.NoticeDetailDto;
import com.gosafe.gosafe_backend.notice.dto.NoticeDto;
import com.gosafe.gosafe_backend.notice.dto.UpdateNoticeRequest;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.place.PlaceService;
import com.gosafe.gosafe_backend.reputation.ReputationService;
import com.gosafe.gosafe_backend.review.PlaceRatingService;
import com.gosafe.gosafe_backend.review.Review;
import com.gosafe.gosafe_backend.review.ReviewService;
import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserService;
import com.gosafe.gosafe_backend.user.dto.AuthorDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final CommentRepository commentRepository;
    private final CommentService commentService;
    private final ReviewService reviewService;
    private final PlaceService placeService;
    private final PlaceRatingService placeRatingService;
    private final UserService userService;
    private final ReputationService reputationService;

    public NoticeService(
            NoticeRepository noticeRepository,
            CommentRepository commentRepository,
            CommentService commentService,
            ReviewService reviewService,
            PlaceService placeService,
            PlaceRatingService placeRatingService,
            UserService userService,
            ReputationService reputationService
    ) {
        this.noticeRepository = noticeRepository;
        this.commentRepository = commentRepository;
        this.commentService = commentService;
        this.reviewService = reviewService;
        this.placeService = placeService;
        this.placeRatingService = placeRatingService;
        this.userService = userService;
        this.reputationService = reputationService;
    }

    public Notice getActive(UUID id) {
        return noticeRepository.findById(id)
                .filter(notice -> notice.getStatus() == ContentStatus.ACTIVE)
                .orElseThrow(() -> Errors.notFound("Aviso não encontrado"));
    }

    /** RN08: avisos com atividade mais recente primeiro. */
    @Transactional(readOnly = true)
    public PageResponse<NoticeDto> list(UUID placeId, int page, int size, AuthUser viewer) {
        placeService.getActive(placeId);
        UUID viewerId = viewer != null ? viewer.id() : null;

        return PageResponse.of(
                noticeRepository.findByPlace_IdAndStatusOrderByLastActivityAtDesc(
                                placeId,
                                ContentStatus.ACTIVE,
                                Pages.of(page, size)
                        )
                        .map(notice -> toDto(notice, viewerId))
        );
    }

    @Transactional(readOnly = true)
    public NoticeDetailDto detail(UUID id, AuthUser viewer) {
        return toDetail(getActive(id), viewer != null ? viewer.id() : null);
    }

    /** RN04/RN05: aviso sempre nasce num local, com título e comentário inicial. */
    @Transactional
    public NoticeDetailDto create(UUID placeId, CreateNoticeRequest request, AuthUser authUser) {
        Place place = placeService.getActive(placeId);
        User author = userService.getActive(authUser.id());

        Notice notice = new Notice();

        notice.setPlace(place);
        notice.setAuthor(author);
        notice.setTitle(request.title().trim());
        notice.setType(request.type());
        notice.setAnonymous(Boolean.TRUE.equals(request.anonymous()));
        noticeRepository.save(notice);

        Comment initial = new Comment();

        initial.setNotice(notice);
        initial.setAuthor(author);
        initial.setBody(request.body().trim());
        initial.setInitial(true);
        initial.setAnonymous(Boolean.TRUE.equals(request.anonymous()));
        commentRepository.save(initial);

        if (request.review() != null) {
            reviewService.create(author, place, initial, request.review());
        }

        reputationService.contributionAdded(author);

        return toDetail(notice, author.getId());
    }

    @Transactional
    public NoticeDetailDto update(UUID id, UpdateNoticeRequest request, AuthUser authUser) {
        Notice notice = getActive(id);

        if (!notice.getAuthor().getId().equals(authUser.id())) {
            throw Errors.forbidden("Só a autora pode editar o aviso");
        }

        notice.setTitle(request.title().trim());
        notice.setType(request.type());

        return toDetail(notice, authUser.id());
    }

    @Transactional
    public void delete(UUID id, AuthUser authUser) {
        Notice notice = getActive(id);

        if (!notice.getAuthor().getId().equals(authUser.id()) && !authUser.isModerator()) {
            throw Errors.forbidden("Só a autora ou a moderação podem remover o aviso");
        }

        notice.setStatus(ContentStatus.REMOVED);
        placeRatingService.recalculate(notice.getPlace());
    }

    private NoticeDetailDto toDetail(Notice notice, UUID viewerId) {
        Comment initial = commentRepository.findFirstByNotice_IdAndInitialTrue(notice.getId()).orElse(null);
        Map<UUID, Review> reviews = initial != null
                ? reviewService.byCommentIds(List.of(initial.getId()))
                : Map.of();

        return new NoticeDetailDto(
                toDto(notice, viewerId),
                notice.getPlace().getName(),
                initial != null && initial.getStatus() == ContentStatus.ACTIVE
                        ? commentService.toDto(initial, reviews.get(initial.getId()), viewerId)
                        : null
        );
    }

    private NoticeDto toDto(Notice notice, UUID viewerId) {
        return new NoticeDto(
                notice.getId(),
                notice.getPlace().getId(),
                notice.getTitle(),
                notice.getType(),
                AuthorDto.of(notice.getAuthor(), notice.getAnonymous(), viewerId),
                notice.getCommentCount(),
                notice.getCreatedAt(),
                notice.getLastActivityAt()
        );
    }
}
