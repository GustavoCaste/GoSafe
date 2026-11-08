package com.gosafe.gosafe_backend.comment;

import com.gosafe.gosafe_backend.comment.dto.CommentDto;
import com.gosafe.gosafe_backend.comment.dto.CreateCommentRequest;
import com.gosafe.gosafe_backend.comment.dto.UpdateCommentRequest;
import com.gosafe.gosafe_backend.common.ContentStatus;
import com.gosafe.gosafe_backend.common.Errors;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.common.Pages;
import com.gosafe.gosafe_backend.notice.Notice;
import com.gosafe.gosafe_backend.notice.NoticeRepository;
import com.gosafe.gosafe_backend.place.Place;
import com.gosafe.gosafe_backend.reputation.ReputationService;
import com.gosafe.gosafe_backend.review.PlaceRatingService;
import com.gosafe.gosafe_backend.review.Review;
import com.gosafe.gosafe_backend.review.ReviewService;
import com.gosafe.gosafe_backend.security.AuthUser;
import com.gosafe.gosafe_backend.user.User;
import com.gosafe.gosafe_backend.user.UserService;
import com.gosafe.gosafe_backend.user.dto.AuthorDto;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final NoticeRepository noticeRepository;
    private final ReviewService reviewService;
    private final PlaceRatingService placeRatingService;
    private final UserService userService;
    private final ReputationService reputationService;

    public CommentService(
            CommentRepository commentRepository,
            NoticeRepository noticeRepository,
            ReviewService reviewService,
            PlaceRatingService placeRatingService,
            UserService userService,
            ReputationService reputationService
    ) {
        this.commentRepository = commentRepository;
        this.noticeRepository = noticeRepository;
        this.reviewService = reviewService;
        this.placeRatingService = placeRatingService;
        this.userService = userService;
        this.reputationService = reputationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentDto> list(UUID noticeId, int page, int size, AuthUser viewer) {
        activeNotice(noticeId);
        UUID viewerId = viewer != null ? viewer.id() : null;

        Page<Comment> comments = commentRepository.findByNotice_IdAndInitialFalseAndStatusOrderByCreatedAtAsc(
                noticeId,
                ContentStatus.ACTIVE,
                Pages.of(page, size)
        );
        Map<UUID, Review> reviews = reviewService.byCommentIds(
                comments.getContent().stream().map(Comment::getId).toList()
        );

        return PageResponse.of(comments.map(comment -> toDto(comment, reviews.get(comment.getId()), viewerId)));
    }

    /** RN04: comentário só existe dentro de um aviso (e o aviso, dentro de um local). */
    @Transactional
    public CommentDto create(UUID noticeId, CreateCommentRequest request, AuthUser authUser) {
        Notice notice = activeNotice(noticeId);
        Place place = notice.getPlace();

        if (!place.getActive()) {
            throw Errors.notFound("Local não encontrado");
        }

        User author = userService.getActive(authUser.id());

        Comment comment = new Comment();

        comment.setNotice(notice);
        comment.setAuthor(author);
        comment.setBody(request.body().trim());
        comment.setInitial(false);
        comment.setAnonymous(Boolean.TRUE.equals(request.anonymous()));
        commentRepository.save(comment);

        notice.setCommentCount(notice.getCommentCount() + 1);
        notice.setLastActivityAt(Instant.now());

        Review review = request.review() != null
                ? reviewService.create(author, place, comment, request.review())
                : null;

        reputationService.contributionAdded(author);

        return toDto(comment, review, author.getId());
    }

    @Transactional
    public CommentDto update(UUID id, UpdateCommentRequest request, AuthUser authUser) {
        Comment comment = activeComment(id);

        if (!comment.getAuthor().getId().equals(authUser.id())) {
            throw Errors.forbidden("Só a autora pode editar o comentário");
        }

        comment.setBody(request.body().trim());
        comment.setEditedAt(Instant.now());

        Map<UUID, Review> reviews = reviewService.byCommentIds(java.util.List.of(comment.getId()));
        return toDto(comment, reviews.get(comment.getId()), authUser.id());
    }

    @Transactional
    public void delete(UUID id, AuthUser authUser) {
        Comment comment = activeComment(id);

        if (!comment.getAuthor().getId().equals(authUser.id()) && !authUser.isModerator()) {
            throw Errors.forbidden("Só a autora ou a moderação podem remover o comentário");
        }

        hide(comment, ContentStatus.REMOVED);
    }

    /** Remove/oculta o comentário e atualiza contagem e nota do local. */
    public void hide(Comment comment, ContentStatus status) {
        Notice notice = comment.getNotice();

        comment.setStatus(status);

        if (!comment.getInitial()) {
            notice.setCommentCount(Math.max(0, notice.getCommentCount() - 1));
        }

        placeRatingService.recalculate(notice.getPlace());
    }

    public CommentDto toDto(Comment comment, Review review, UUID viewerId) {
        return new CommentDto(
                comment.getId(),
                comment.getNotice().getId(),
                comment.getBody(),
                AuthorDto.of(comment.getAuthor(), comment.getAnonymous(), viewerId),
                comment.getInitial(),
                comment.getCreatedAt(),
                comment.getEditedAt(),
                ReviewService.toDto(review)
        );
    }

    private Notice activeNotice(UUID noticeId) {
        return noticeRepository.findById(noticeId)
                .filter(notice -> notice.getStatus() == ContentStatus.ACTIVE)
                .orElseThrow(() -> Errors.notFound("Aviso não encontrado"));
    }

    private Comment activeComment(UUID id) {
        return commentRepository.findById(id)
                .filter(comment -> comment.getStatus() == ContentStatus.ACTIVE)
                .orElseThrow(() -> Errors.notFound("Comentário não encontrado"));
    }
}
