# Student Records Architecture (Aligned to SQL Schema)

## Purpose

This architecture describes the actual implemented data model in the SQL schema for a multi-tenant school management and performance tracking system.

Primary goals:

- manage schools, people, class structures, curriculum, and academic calendars
- capture assessment scores with strong integrity constraints
- provide fast term-level reporting via precomputed results
- track student attendance per day

## High-Level Architecture

The system is centered around one PostgreSQL database with strict relational constraints.

- tenancy root: one `schools` row per school
- identity/auth bridge: `profiles` linked to `auth.users`
- domain entities: students, teachers, grade levels, sections, subjects
- delivery model: subject offerings and teacher assignments
- enrollment model: class enrollments and subject enrollments
- assessment model: assessments and per-student scores
- analytics cache: term results
- attendance model: daily attendance records
- convenience read layer: SQL views for common joins

## Multi-Tenant Data Boundary

The schema is school-scoped.

- `schools` is the tenant root table
- almost all domain tables carry `school_id`
- foreign keys and unique constraints enforce tenant-safe relationships

Result: one database can host multiple schools while keeping data isolated by tenant.

## Identity and Role Model

### Core tables

- `profiles`
- `students`
- `teachers`

### Role and identity behavior

- `profiles.id` is a UUID foreign key to `auth.users(id)`
- `profiles.role` uses `user_role` enum: `admin`, `teacher`, `student`
- `students` and `teachers` keep school-specific identifiers (`admission_no`, `employee_no`)
- both `students.profile_id` and `teachers.profile_id` are optional and unique

This design supports creating student/teacher records before provisioning login access.

## Academic Calendar and School Structure

### Calendar layer

- `academic_years`: top-level time window with `is_active`
- `terms`: periods within an academic year, with `term_number` and `is_active`

### Structure layer

- `grade_levels`: school-defined grades/forms
- `class_sections`: grade sections per academic year

Important constraint patterns:

- one academic year name per school: `UNIQUE (school_id, name)`
- one term number per academic year: `UNIQUE (academic_year_id, term_number)`
- one section name per grade per year: `UNIQUE (academic_year_id, grade_level_id, name)`

## Curriculum and Teaching Assignment

### Curriculum tables

- `subjects`: school master subject list
- `subject_offerings`: subject delivered to a specific class section

### Assignment table

- `teacher_assignments`: assigns teachers to subject offerings

Relationship summary:

- a subject can be offered to many sections
- a section can have many subject offerings
- a teacher can teach many offerings
- an offering can have one or more teachers

## Enrollment Architecture

### Class enrollment

- `student_enrollments` links student to class section and academic year

### Subject enrollment

- `student_subject_enrollments` links a class enrollment to specific subject offerings

This two-step enrollment model is critical because it supports electives and enforces that scores only exist for subjects a student is actually taking.

## Assessment and Scoring Architecture

### Assessment definitions

- `assessments` belongs to one subject offering and one term
- `type` uses `assessment_type` enum: `exam`, `quiz`, `assignment`
- `max_marks > 0` enforced in schema

### Student scores

- `assessment_scores` references:
  - `assessment_id`
  - `student_subject_enrollment_id`
- one score per student per assessment:
  - `UNIQUE (assessment_id, student_subject_enrollment_id)`
- attendance in assessment context:
  - `is_absent` flag
- marks constraints:
  - `marks_obtained >= 0`
  - `marks_obtained <= assessments.max_marks` via `chk_marks_within_max`

This provides stronger integrity than a direct student-only score link.

## Reporting and Performance Layer

### Term results cache

- `term_results` stores precomputed per-student, per-subject, per-term summaries
- stores `total_marks`, `obtained_marks`, `percentage`, `grade`, and `computed_at`
- unique tuple:
  - `UNIQUE (student_enrollment_id, subject_offering_id, term_id)`

Purpose:

- avoid repeated heavy joins/aggregations for report cards
- serve dashboard and student progress screens with faster reads

## Attendance Layer

- `attendance` captures one daily record per student enrollment
- `status` uses `attendance_status` enum: `present`, `absent`, `late`, `excused`
- `UNIQUE (student_enrollment_id, attendance_date)` prevents duplicates
- includes denormalized `class_section_id` for fast section/day reporting

## Read-Optimized SQL Views

The schema provides these views for common read paths:

- `v_students`: student + profile information
- `v_teachers`: teacher + profile information
- `v_subject_offerings`: subject, section, grade, year resolved in one view
- `v_active_enrollments`: current-year enrollments with student and class context

These reduce repetitive join complexity in application code.

## Key Data Flow

1. Create school.
2. Create profiles/users and domain records (students/teachers).
3. Create academic years and terms.
4. Create grade levels and class sections.
5. Create subjects and subject offerings.
6. Assign teachers to offerings.
7. Enroll students into sections and subjects.
8. Create assessments by term.
9. Record scores and absences.
10. Compute/update `term_results` for fast progress reporting.
11. Record daily attendance.

## Integrity and Performance Characteristics

### Integrity controls

- enum types for roles, assessment types, and attendance statuses
- foreign keys across all critical relationships
- check constraints for date and mark quality
- unique constraints preventing duplicate assignments/enrollments/scores

### Performance controls

- targeted indexes across join and filter keys
- cached aggregation table (`term_results`)
- read-focused views for common application queries

## Notes for Application Layer

- enforce business rules such as one active academic year/term per school in service logic (or add partial unique indexes)
- keep `term_results` synchronized via trigger or background recomputation job when scores change
- apply role-based access using `profiles.role` and `school_id` scoping in all queries
