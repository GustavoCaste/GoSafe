CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id                  UUID PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    username            VARCHAR(30)  NOT NULL UNIQUE,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    sex                 VARCHAR(30)  NOT NULL,
    photo_url           VARCHAR(500),
    verified            BOOLEAN      NOT NULL DEFAULT FALSE,
    role                VARCHAR(20)  NOT NULL DEFAULT 'USER',
    valid_contributions INTEGER      NOT NULL DEFAULT 0,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL
);

-- Verificação facial: guarda apenas o resultado, nunca a imagem (LGPD art. 11)
CREATE TABLE face_verifications (
    id              UUID PRIMARY KEY,
    user_id         UUID             NOT NULL REFERENCES users (id),
    provider        VARCHAR(30)      NOT NULL,
    liveness_ok     BOOLEAN          NOT NULL,
    facematch_score DOUBLE PRECISION NOT NULL,
    status          VARCHAR(20)      NOT NULL,
    consent_at      TIMESTAMPTZ      NOT NULL,
    validated_at    TIMESTAMPTZ      NOT NULL,
    created_at      TIMESTAMPTZ      NOT NULL
);
CREATE INDEX idx_face_verifications_user ON face_verifications (user_id, created_at DESC);

CREATE TABLE places (
    id                UUID PRIMARY KEY,
    name              VARCHAR(100)     NOT NULL,
    category          VARCHAR(30)      NOT NULL,
    description       VARCHAR(300),
    postal_code       VARCHAR(9)       NOT NULL,
    street            VARCHAR(150)     NOT NULL,
    street_number     VARCHAR(20)      NOT NULL,
    complement        VARCHAR(60),
    district          VARCHAR(80)      NOT NULL,
    city              VARCHAR(80)      NOT NULL,
    state_code        VARCHAR(2)       NOT NULL,
    latitude          DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude         DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    -- Ponto PostGIS derivado de latitude/longitude; mantido pelo banco
    geom              GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    geocode_source    VARCHAR(20)      NOT NULL,
    profile_photo_url VARCHAR(500),
    weighted_rating   DOUBLE PRECISION,
    rating_count      INTEGER          NOT NULL DEFAULT 0,
    created_by        UUID             NOT NULL REFERENCES users (id),
    active            BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ      NOT NULL,
    updated_at        TIMESTAMPTZ      NOT NULL
);
CREATE INDEX idx_places_geom ON places USING GIST (geom);
CREATE INDEX idx_places_geog ON places USING GIST ((geom::geography));
CREATE INDEX idx_places_name ON places (lower(name));
CREATE INDEX idx_places_category ON places (category);

CREATE TABLE place_photos (
    id          UUID PRIMARY KEY,
    place_id    UUID         NOT NULL REFERENCES places (id),
    url         VARCHAR(500) NOT NULL,
    sort_order  INTEGER      NOT NULL,
    uploaded_by UUID         NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_place_photos_place ON place_photos (place_id, sort_order);

-- Check-in: guarda a distância até o local, nunca as coordenadas da usuária
CREATE TABLE check_ins (
    id              UUID PRIMARY KEY,
    user_id         UUID             NOT NULL REFERENCES users (id),
    place_id        UUID             NOT NULL REFERENCES places (id),
    distance_meters DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION NOT NULL,
    valid           BOOLEAN          NOT NULL,
    created_at      TIMESTAMPTZ      NOT NULL
);
CREATE INDEX idx_check_ins_user_place ON check_ins (user_id, place_id, created_at DESC);

CREATE TABLE favorites (
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id),
    place_id   UUID        NOT NULL REFERENCES places (id),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_favorites_user_place UNIQUE (user_id, place_id)
);

CREATE TABLE notices (
    id               UUID PRIMARY KEY,
    place_id         UUID         NOT NULL REFERENCES places (id),
    author_id        UUID         NOT NULL REFERENCES users (id),
    title            VARCHAR(120) NOT NULL,
    type             VARCHAR(20)  NOT NULL,
    anonymous        BOOLEAN      NOT NULL,
    status           VARCHAR(20)  NOT NULL,
    comment_count    INTEGER      NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_notices_place ON notices (place_id, status, last_activity_at DESC);

CREATE TABLE comments (
    id         UUID PRIMARY KEY,
    notice_id  UUID          NOT NULL REFERENCES notices (id),
    author_id  UUID          NOT NULL REFERENCES users (id),
    body       VARCHAR(1000) NOT NULL,
    is_initial BOOLEAN       NOT NULL,
    anonymous  BOOLEAN       NOT NULL,
    status     VARCHAR(20)   NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL,
    edited_at  TIMESTAMPTZ
);
CREATE INDEX idx_comments_notice ON comments (notice_id, status, created_at);

CREATE TABLE reviews (
    id             UUID PRIMARY KEY,
    user_id        UUID             NOT NULL REFERENCES users (id),
    place_id       UUID             NOT NULL REFERENCES places (id),
    comment_id     UUID             NOT NULL UNIQUE REFERENCES comments (id),
    check_in_id    UUID REFERENCES check_ins (id),
    safety         INTEGER          NOT NULL CHECK (safety BETWEEN 1 AND 5),
    lighting       INTEGER          NOT NULL CHECK (lighting BETWEEN 1 AND 5),
    movement       INTEGER          NOT NULL CHECK (movement BETWEEN 1 AND 5),
    welcoming      INTEGER          NOT NULL CHECK (welcoming BETWEEN 1 AND 5),
    restroom       INTEGER CHECK (restroom BETWEEN 1 AND 5),
    score          DOUBLE PRECISION NOT NULL,
    applied_weight DOUBLE PRECISION NOT NULL,
    created_at     TIMESTAMPTZ      NOT NULL
);
CREATE INDEX idx_reviews_place ON reviews (place_id, created_at DESC);

CREATE TABLE reports (
    id               UUID PRIMARY KEY,
    reporter_id      UUID         NOT NULL REFERENCES users (id),
    target_type      VARCHAR(20)  NOT NULL,
    target_id        UUID         NOT NULL,
    target_author_id UUID REFERENCES users (id),
    reason           VARCHAR(500) NOT NULL,
    status           VARCHAR(20)  NOT NULL,
    origin           VARCHAR(10)  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL,
    resolved_at      TIMESTAMPTZ,
    resolved_by      UUID REFERENCES users (id)
);
CREATE INDEX idx_reports_status ON reports (status, created_at);
CREATE INDEX idx_reports_target_author ON reports (target_author_id, status);
