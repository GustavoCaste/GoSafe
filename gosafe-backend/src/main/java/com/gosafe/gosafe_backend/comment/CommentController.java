package com.gosafe.gosafe_backend.comment;

import com.gosafe.gosafe_backend.comment.dto.CommentDto;
import com.gosafe.gosafe_backend.comment.dto.CreateCommentRequest;
import com.gosafe.gosafe_backend.comment.dto.UpdateCommentRequest;
import com.gosafe.gosafe_backend.common.PageResponse;
import com.gosafe.gosafe_backend.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/notices/{noticeId}/comments")
    public PageResponse<CommentDto> list(
            @PathVariable UUID noticeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthUser viewer
    ) {
        return commentService.list(noticeId, page, size, viewer);
    }

    @PostMapping("/notices/{noticeId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto create(
            @PathVariable UUID noticeId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return commentService.create(noticeId, request, authUser);
    }

    @PutMapping("/comments/{id}")
    public CommentDto update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return commentService.update(id, request, authUser);
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        commentService.delete(id, authUser);
    }
}
