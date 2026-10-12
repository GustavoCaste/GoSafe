-- RN18: local marcado como "não aconselhado" quando muitas usuárias o avaliam com nota muito baixa
ALTER TABLE places ADD COLUMN not_recommended BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_places_not_recommended ON places (not_recommended) WHERE not_recommended;
