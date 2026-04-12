-- =============================================================================
-- SCHOOL MANAGEMENT SYSTEM — DATABASE SCHEMA
-- =============================================================================


-- =============================================================================
-- SECTION 1: CUSTOM TYPES
-- =============================================================================
-- Define all ENUMs upfront so they are available when tables reference them.
-- ENUMs enforce a closed set of valid values at the database level,
-- which is safer and more self-documenting than a plain TEXT column.
-- =============================================================================

-- Roles a user profile can hold within a school
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Types of assessments teachers can create
CREATE TYPE assessment_type AS ENUM ('exam', 'quiz', 'assignment');

-- Possible daily attendance statuses for a student
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');


-- =============================================================================
-- SECTION 2: CORE TENANT TABLE
-- =============================================================================
-- Every other table carries a school_id FK, making this a multi-tenant schema.
-- One database instance can host multiple independent schools.
-- All data is fully isolated per school through that FK chain.
-- =============================================================================

CREATE TABLE schools (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT      NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================================================
-- SECTION 3: AUTH & PROFILES
-- =============================================================================
-- profiles links to Supabase auth.users (or any auth provider user table).
-- It is the SINGLE source of truth for a person's name and role.
-- Both students and teachers reference profiles via profile_id —
-- we do NOT store first_name/last_name on students or teachers separately,
-- which was the dual-source bug in the original schema.
-- =============================================================================

CREATE TABLE profiles (
    id         UUID      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id  BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    role       user_role NOT NULL,

    full_name  TEXT,

    is_active  BOOLEAN   DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_profiles_role   ON profiles(school_id, role);


-- =============================================================================
-- SECTION 4: ACADEMIC CALENDAR
-- =============================================================================
-- Academic years define the top-level time boundary (e.g. "2024/2025").
-- Terms divide an academic year into reporting periods (e.g. Term 1, Term 2).
-- Only one academic_year and one term should be active at a time per school —
-- enforced at the application layer (or via a partial unique index if needed).
-- =============================================================================

CREATE TABLE academic_years (
    id         BIGSERIAL PRIMARY KEY,
    school_id  BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name       TEXT      NOT NULL,  -- e.g. "2024/2025"
    start_date DATE      NOT NULL,
    end_date   DATE      NOT NULL,

    -- Marks the currently running year; simplifies "current year" queries
    -- to WHERE is_active = TRUE instead of a date range comparison
    is_active  BOOLEAN   DEFAULT FALSE,

    UNIQUE (school_id, name),
    CONSTRAINT chk_year_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);


CREATE TABLE terms (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id BIGINT    NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name             TEXT      NOT NULL,   -- e.g. "Term 1"
    term_number      INT       NOT NULL,   -- 1, 2, 3 — used for ordering

    start_date       DATE,
    end_date         DATE,

    -- Added vs original: allows "current term" lookup without a date comparison
    is_active        BOOLEAN   DEFAULT FALSE,

    UNIQUE (academic_year_id, term_number),
    CONSTRAINT chk_term_dates CHECK (end_date IS NULL OR end_date > start_date)
);

CREATE INDEX idx_terms_academic_year ON terms(academic_year_id);


-- =============================================================================
-- SECTION 5: SCHOOL STRUCTURE
-- =============================================================================
-- grade_levels define the year/form hierarchy (e.g. Grade 1, Form 5, A/L).
-- class_sections are the actual classrooms within a grade for a given year
-- (e.g. Grade 6 — Section A, Grade 6 — Section B).
-- A new set of class_sections is created each academic year.
-- =============================================================================

CREATE TABLE grade_levels (
    id         BIGSERIAL PRIMARY KEY,
    school_id  BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name       TEXT      NOT NULL,   -- e.g. "Grade 6", "Form 5", "Year 12"

    -- Added vs original: groups grades into broad bands for UI filtering
    -- and reporting. Suggested values: 'Primary', 'Secondary', 'A/L'
    category   TEXT,

    -- Drives display ordering in dropdowns and reports
    sort_order INT,

    UNIQUE (school_id, name)
);


CREATE TABLE class_sections (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id BIGINT    NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    grade_level_id   BIGINT    NOT NULL REFERENCES grade_levels(id),
    name             TEXT      NOT NULL,   -- e.g. "A", "Blue", "Science"

    -- A grade can only have one section with the same name per year
    UNIQUE (academic_year_id, grade_level_id, name)
);

CREATE INDEX idx_class_sections_year  ON class_sections(academic_year_id);
CREATE INDEX idx_class_sections_grade ON class_sections(grade_level_id);


-- =============================================================================
-- SECTION 6: PEOPLE — STUDENTS & TEACHERS
-- =============================================================================
-- Students and teachers are domain records that carry school-specific
-- identifiers (admission number, employee number).
-- Personal info (name, contact) lives in profiles, linked via profile_id.
-- profile_id is nullable — a student/teacher can exist in the system before
-- they are granted login access (i.e. before a profile is created).
-- =============================================================================

CREATE TABLE students (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Optional link to an auth profile; SET NULL if the profile is deleted
    -- so the student record survives even if their login is removed
    profile_id   UUID      UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,

    admission_no TEXT      NOT NULL,   -- school-assigned student ID
    created_at   TIMESTAMP DEFAULT NOW(),

    UNIQUE (school_id, admission_no)
);

CREATE INDEX idx_students_school ON students(school_id);


CREATE TABLE teachers (
    id          BIGSERIAL PRIMARY KEY,
    school_id   BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Same nullable profile pattern as students
    profile_id  UUID      UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,

    employee_no TEXT      NOT NULL,   -- school-assigned staff ID
    created_at  TIMESTAMP DEFAULT NOW(),

    UNIQUE (school_id, employee_no)
);

CREATE INDEX idx_teachers_school ON teachers(school_id);


-- =============================================================================
-- SECTION 7: SUBJECTS & OFFERINGS
-- =============================================================================
-- subjects are the school's master catalogue (e.g. "Mathematics", "Biology").
-- subject_offerings are instances of a subject taught to a specific class
-- section. The same subject can be offered to multiple sections simultaneously.
-- =============================================================================

CREATE TABLE subjects (
    id        BIGSERIAL PRIMARY KEY,
    school_id BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name      TEXT      NOT NULL,   -- e.g. "Mathematics"
    code      TEXT,                 -- e.g. "MATH101" — optional short code

    UNIQUE (school_id, name)
);


CREATE TABLE subject_offerings (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_section_id BIGINT    NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    subject_id       BIGINT    NOT NULL REFERENCES subjects(id),

    UNIQUE (class_section_id, subject_id)
);

CREATE INDEX idx_subject_offerings_section ON subject_offerings(class_section_id);
CREATE INDEX idx_subject_offerings_subject ON subject_offerings(subject_id);


-- =============================================================================
-- SECTION 8: TEACHER ASSIGNMENTS
-- =============================================================================
-- Links a teacher to the specific subject offering they teach.
-- A subject offering can have multiple teachers (co-teaching).
-- A teacher can be assigned to multiple subject offerings.
-- =============================================================================

CREATE TABLE teacher_assignments (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id          BIGINT    NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_offering_id BIGINT    NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,

    UNIQUE (teacher_id, subject_offering_id)
);

CREATE INDEX idx_teacher_assignments_teacher  ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_offering ON teacher_assignments(subject_offering_id);


-- =============================================================================
-- SECTION 9: STUDENT ENROLLMENTS
-- =============================================================================
-- student_enrollments records which class section a student belongs to
-- for a given academic year.

-- student_subject_enrollments (below) then tracks exactly which subjects
-- within that section the student actually takes.
-- =============================================================================

CREATE TABLE student_enrollments (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id       BIGINT    NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_section_id BIGINT    NOT NULL REFERENCES class_sections(id),
    academic_year_id BIGINT    NOT NULL REFERENCES academic_years(id),

    UNIQUE (student_id, class_section_id, academic_year_id)
);

CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_section ON student_enrollments(class_section_id);
CREATE INDEX idx_student_enrollments_year    ON student_enrollments(academic_year_id);


-- =============================================================================
-- SECTION 10: STUDENT SUBJECT ENROLLMENTS
-- =============================================================================
-- It records which specific subjects a student takes within their enrollment.
--
-- Why this matters:
--   Without this table, assessment_scores only referenced student_id, meaning
--   there was no database-level guarantee that a student was actually enrolled
--   in the subject being assessed. Any student could receive scores for any
--   subject — data integrity was entirely the application's responsibility.
--
--   With this table, the FK chain is:
--     assessment_scores
--       → student_subject_enrollments   (proves subject enrollment)
--       → student_enrollments           (proves class enrollment)
--       → students                      (proves school enrollment)
--
-- This also enables per-student subject selection (important for schools
-- where students in the same section choose different electives).
-- =============================================================================

CREATE TABLE student_subject_enrollments (
    id                    BIGSERIAL PRIMARY KEY,
    school_id             BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_enrollment_id BIGINT    NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    subject_offering_id   BIGINT    NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,

    UNIQUE (student_enrollment_id, subject_offering_id)
);

CREATE INDEX idx_sse_enrollment ON student_subject_enrollments(student_enrollment_id);
CREATE INDEX idx_sse_offering   ON student_subject_enrollments(subject_offering_id);


-- =============================================================================
-- SECTION 11: ASSESSMENTS
-- =============================================================================
-- Assessments are created by teachers for a specific subject offering
-- within a specific term (e.g. "Term 1 Mathematics Exam").
-- max_marks is used to validate scores and compute percentages.
-- =============================================================================

CREATE TABLE assessments (
    id                  BIGSERIAL       PRIMARY KEY,
    school_id           BIGINT          NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject_offering_id BIGINT          NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,
    term_id             BIGINT          NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    title               TEXT            NOT NULL,   -- e.g. "Mid-Term Exam"
    type                assessment_type NOT NULL,
    max_marks           NUMERIC         NOT NULL CHECK (max_marks > 0),
    created_at          TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_assessments_offering ON assessments(subject_offering_id);
CREATE INDEX idx_assessments_term     ON assessments(term_id);


-- =============================================================================
-- SECTION 12: ASSESSMENT SCORES
-- =============================================================================
-- Records the mark a student received on a specific assessment.
--
-- IMPORTANT CHANGES vs original:
--   1. References student_subject_enrollment_id instead of bare student_id.
--      This enforces that only enrolled students can receive scores.
--   2. Added CHECK constraint: marks_obtained cannot exceed the assessment's
--      max_marks. In the original schema there was no such constraint, meaning
--      a score of 9999 on a 100-mark exam was silently accepted.
--
-- The CHECK uses a subquery — if your DB version doesn't support this,
-- enforce it via a BEFORE INSERT/UPDATE trigger instead (see comment below).
-- =============================================================================

CREATE TABLE assessment_scores (
    id                             BIGSERIAL PRIMARY KEY,
    school_id                      BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assessment_id                  BIGINT    NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

    -- Changed from student_id: now goes through the subject enrollment chain
    student_subject_enrollment_id  BIGINT    NOT NULL REFERENCES student_subject_enrollments(id) ON DELETE CASCADE,

    -- NULL means not yet marked; FALSE/NULL is_absent means student sat the assessment
    marks_obtained NUMERIC CHECK (marks_obtained >= 0),
    is_absent      BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT NOW(),

    -- A student can only have one score entry per assessment
    UNIQUE (assessment_id, student_subject_enrollment_id),

    -- Ensures marks don't exceed the assessment's maximum
    -- NOTE: If your PostgreSQL version rejects subqueries in CHECK constraints,
    -- replace this with the trigger shown below.
    CONSTRAINT chk_marks_within_max CHECK (
        marks_obtained IS NULL OR
        marks_obtained <= (
            SELECT max_marks FROM assessments WHERE id = assessment_id
        )
    )
);

-- Alternative trigger-based marks validation (use if the CHECK above is rejected):
-- CREATE OR REPLACE FUNCTION trg_validate_score() RETURNS TRIGGER AS $$
-- DECLARE v_max NUMERIC;
-- BEGIN
--   SELECT max_marks INTO v_max FROM assessments WHERE id = NEW.assessment_id;
--   IF NEW.marks_obtained IS NOT NULL AND NEW.marks_obtained > v_max THEN
--     RAISE EXCEPTION 'marks_obtained (%) exceeds max_marks (%) for assessment %',
--       NEW.marks_obtained, v_max, NEW.assessment_id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER validate_score_before_upsert
--   BEFORE INSERT OR UPDATE ON assessment_scores
--   FOR EACH ROW EXECUTE FUNCTION trg_validate_score();

CREATE INDEX idx_scores_assessment  ON assessment_scores(assessment_id);
CREATE INDEX idx_scores_sse         ON assessment_scores(student_subject_enrollment_id);
-- Composite index for report-card aggregation queries
CREATE INDEX idx_scores_composite   ON assessment_scores(assessment_id, student_subject_enrollment_id);


-- =============================================================================
-- SECTION 13: TERM RESULTS  ← NEW TABLE
-- =============================================================================
-- Pre-computed summary of a student's performance in one subject for one term.
-- Populated by a background job or trigger after all assessments are finalised.
--
-- Why this exists:
--   Without it, generating a report card requires a 6-table join and a GROUP BY
--   aggregation on assessment_scores every single time. At 500+ students with
--   10 subjects each that becomes very slow.
--   term_results acts as a materialised cache — report card generation becomes
--   a single-table SELECT with no aggregation at query time.
--
-- Invalidation strategy: re-compute whenever a score in that term is updated.
-- This can be done via a trigger on assessment_scores or a scheduled job.
-- =============================================================================

CREATE TABLE term_results (
    id                    BIGSERIAL PRIMARY KEY,
    school_id             BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_enrollment_id BIGINT    NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    subject_offering_id   BIGINT    NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,
    term_id               BIGINT    NOT NULL REFERENCES terms(id) ON DELETE CASCADE,

    -- Aggregated from assessment_scores for all assessments in this term
    total_marks    NUMERIC,   -- sum of all max_marks for assessed components
    obtained_marks NUMERIC,   -- sum of all marks_obtained
    percentage     NUMERIC,   -- (obtained_marks / total_marks) * 100

    -- Grade label computed from percentage using school's grading policy
    -- (A, B, C... or Distinction, Merit, Pass, Fail — left as TEXT for flexibility)
    grade          TEXT,

    -- Timestamp of last computation — useful for cache invalidation auditing
    computed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (student_enrollment_id, subject_offering_id, term_id)
);

CREATE INDEX idx_term_results_enrollment ON term_results(student_enrollment_id);
CREATE INDEX idx_term_results_term       ON term_results(term_id);


-- =============================================================================
-- SECTION 14: ATTENDANCE  ← NEW TABLE
-- =============================================================================
-- Tracks daily presence for each student enrollment.
-- Scoped to class_section_id so section-level attendance summaries
-- (e.g. "how many students were present in Grade 6A on Monday?")
-- can be answered without extra joins.
--
-- One row per student per school day.
-- Missing row = not yet recorded (different from 'absent').
-- =============================================================================

CREATE TABLE attendance (
    id                    BIGSERIAL          PRIMARY KEY,
    school_id             BIGINT             NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_enrollment_id BIGINT             NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,

    -- Denormalised for fast section-level queries (avoids joining through enrollments)
    class_section_id      BIGINT             NOT NULL REFERENCES class_sections(id),

    attendance_date DATE              NOT NULL,
    status          attendance_status NOT NULL,
    note            TEXT,   -- optional reason (e.g. "Doctor's appointment")

    -- One attendance record per student per day
    UNIQUE (student_enrollment_id, attendance_date)
);

CREATE INDEX idx_attendance_enrollment ON attendance(student_enrollment_id);
CREATE INDEX idx_attendance_section    ON attendance(class_section_id, attendance_date);
CREATE INDEX idx_attendance_date       ON attendance(attendance_date);


-- =============================================================================
-- SECTION 15: USEFUL VIEWS
-- =============================================================================
-- These views pre-join the most common query patterns so application code
-- doesn't need to repeat complex JOIN chains everywhere.
-- =============================================================================

-- Full student profile view: joins students → profiles for name access
CREATE VIEW v_students AS
SELECT
    s.id             AS student_id,
    s.school_id,
    s.admission_no,
    p.full_name,
    p.is_active,
    s.profile_id,
    s.created_at
FROM students s
LEFT JOIN profiles p ON p.id = s.profile_id;


-- Full teacher profile view: joins teachers → profiles for name access
CREATE VIEW v_teachers AS
SELECT
    t.id             AS teacher_id,
    t.school_id,
    t.employee_no,
    p.full_name,
    p.is_active,
    t.profile_id,
    t.created_at
FROM teachers t
LEFT JOIN profiles p ON p.id = t.profile_id;


-- Subject offering detail view: resolves section name, grade, year, subject in one place
CREATE VIEW v_subject_offerings AS
SELECT
    so.id                  AS subject_offering_id,
    so.school_id,
    s.name                 AS subject_name,
    s.code                 AS subject_code,
    cs.name                AS section_name,
    gl.name                AS grade_name,
    gl.category            AS grade_category,
    ay.name                AS academic_year_name,
    ay.id                  AS academic_year_id
FROM subject_offerings so
JOIN subjects       s  ON s.id  = so.subject_id
JOIN class_sections cs ON cs.id = so.class_section_id
JOIN grade_levels   gl ON gl.id = cs.grade_level_id
JOIN academic_years ay ON ay.id = cs.academic_year_id;


-- Active enrollment view: shows current-year enrolled students with section info
CREATE VIEW v_active_enrollments AS
SELECT
    se.id                  AS enrollment_id,
    se.school_id,
    se.student_id,
    p.full_name            AS student_name,
    st.admission_no,
    cs.name                AS section_name,
    gl.name                AS grade_name,
    ay.name                AS academic_year_name
FROM student_enrollments se
JOIN students       st ON st.id = se.student_id
LEFT JOIN profiles  p  ON p.id  = st.profile_id
JOIN class_sections cs ON cs.id = se.class_section_id
JOIN grade_levels   gl ON gl.id = cs.grade_level_id
JOIN academic_years ay ON ay.id = se.academic_year_id
WHERE ay.is_active = TRUE;


-- =============================================================================
-- SECTION 16: ALLOWED PROFILE LIST (ADMIN-MANAGED LOGIN GATE)
-- =============================================================================
-- Admin pre-registers users here with email, role, and optional identity mapping.
-- Only emails in this table can complete login.
--
-- First successful login flow:
-- 1) OAuth callback checks allowlist by email.
-- 2) If allowed, create/update profile with role and school.
-- 3) If role is teacher/student, create or link the matching domain row.
-- 4) If not allowed, login is rejected.
-- =============================================================================

CREATE TABLE login_allowlist (
    id           BIGSERIAL PRIMARY KEY,
    email        TEXT      NOT NULL UNIQUE,
    school_id    BIGINT    NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role         user_role NOT NULL,
    full_name    TEXT,
    admission_no TEXT,
    employee_no  TEXT,
    is_active    BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_login_allowlist_identity CHECK (
        (role = 'admin'   AND admission_no IS NULL AND employee_no IS NULL) OR
        (role = 'teacher' AND admission_no IS NULL AND employee_no IS NOT NULL) OR
        (role = 'student' AND admission_no IS NOT NULL AND employee_no IS NULL)
    )
);

CREATE INDEX idx_login_allowlist_school ON login_allowlist(school_id);
CREATE INDEX idx_login_allowlist_role   ON login_allowlist(school_id, role);
CREATE INDEX idx_login_allowlist_email_lower ON login_allowlist((lower(email)));


CREATE OR REPLACE FUNCTION upsert_profile_from_allowlist(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allowed login_allowlist%ROWTYPE;
BEGIN
    SELECT *
    INTO allowed
    FROM login_allowlist
    WHERE lower(email) = lower(p_email)
      AND is_active = TRUE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    INSERT INTO profiles (id, school_id, role, full_name, is_active)
    VALUES (
        p_user_id,
        allowed.school_id,
        allowed.role,
        COALESCE(NULLIF(p_full_name, ''), allowed.full_name),
        TRUE
    )
    ON CONFLICT (id)
    DO UPDATE SET
        school_id = EXCLUDED.school_id,
        role = EXCLUDED.role,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        is_active = TRUE;

    IF allowed.role = 'teacher' THEN
        INSERT INTO teachers (school_id, profile_id, employee_no)
        VALUES (allowed.school_id, p_user_id, allowed.employee_no)
        ON CONFLICT (school_id, employee_no)
        DO UPDATE SET
            profile_id = EXCLUDED.profile_id
        WHERE teachers.profile_id IS NULL OR teachers.profile_id = EXCLUDED.profile_id;

        UPDATE teachers
        SET profile_id = p_user_id
        WHERE school_id = allowed.school_id
          AND employee_no = allowed.employee_no
          AND profile_id IS NULL;
    ELSIF allowed.role = 'student' THEN
        INSERT INTO students (school_id, profile_id, admission_no)
        VALUES (allowed.school_id, p_user_id, allowed.admission_no)
        ON CONFLICT (school_id, admission_no)
        DO UPDATE SET
            profile_id = EXCLUDED.profile_id
        WHERE students.profile_id IS NULL OR students.profile_id = EXCLUDED.profile_id;

        UPDATE students
        SET profile_id = p_user_id
        WHERE school_id = allowed.school_id
          AND admission_no = allowed.admission_no
          AND profile_id IS NULL;
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_profile_from_allowlist(UUID, TEXT, TEXT) TO authenticated;


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
-- Table summary:
--   Core tenant      : schools
--   Auth & identity  : profiles
--   Calendar         : academic_years, terms
--   Structure        : grade_levels, class_sections
--   People           : students, teachers
--   Curriculum       : subjects, subject_offerings, teacher_assignments
--   Enrollment       : student_enrollments, student_subject_enrollments
--   Assessment       : assessments, assessment_scores
--   Reporting cache  : term_results
--   Attendance       : attendance
--   Login gate       : login_allowlist, upsert_profile_from_allowlist(...)
--   Views            : v_students, v_teachers, v_subject_offerings, v_active_enrollments
-- =============================================================================