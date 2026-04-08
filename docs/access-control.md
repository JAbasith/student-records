# Access Control Matrix

This document defines the platform roles, the routes/features each role can use, and how the application should respond when access is denied.

## Roles

- `admin`: school operator with full access to configuration, people management, academics, reports, and audits
- `teacher`: staff member who manages classes, attendance, assessments, and student progress for assigned sections/subjects
- `student`: learner who can only view their own profile, attendance, grades, and assigned work

## Route and Feature Matrix

| Route / Feature                         | Admin | Teacher                                          | Student                       |
| --------------------------------------- | ----- | ------------------------------------------------ | ----------------------------- |
| `/login` and `/forgot-password`         | Allow | Allow                                            | Allow                         |
| `/app` dashboard                        | Allow | Allow                                            | Allow                         |
| `/app/students`                         | Allow | View assigned students only                      | Deny                          |
| `/app/students/[id]`                    | Allow | View assigned student records only               | View own record only          |
| `/app/teachers`                         | Allow | Deny                                             | Deny                          |
| `/app/classes` and `/app/sections`      | Allow | View assigned classes/sections only              | Deny                          |
| `/app/subjects` and `/app/offerings`    | Allow | View assigned subjects only                      | View enrolled subjects only   |
| `/app/attendance`                       | Allow | Create/update attendance for assigned sections   | View own attendance only      |
| `/app/assessments`                      | Allow | Create/update assessments for assigned offerings | View own assessment list only |
| `/app/grades` and `/app/report-cards`   | Allow | View and publish grades for assigned students    | View own grades only          |
| `/app/reports` and analytics dashboards | Allow | View class-level summaries only                  | Deny                          |
| `/app/settings`                         | Allow | Deny                                             | Deny                          |
| profile menu, password change, sign out | Allow | Allow                                            | Allow                         |

## Access Rules

The matrix above is enforced using both role checks and school scoping.

- Admins can access every school-scoped route and feature inside their tenant.
- Teachers can only access students, classes, subjects, attendance, assessments, and grade views that belong to sections or subject offerings assigned to them.
- Students can only access their own data and must never see another student’s records, marks, attendance, or profile details.
- UI navigation should hide unavailable routes, but backend authorization must still enforce the same rules.

## Unauthorized Behavior

The application should handle disallowed access consistently.

- Unauthenticated requests return `401 Unauthorized`.
- Authenticated requests that fail role or ownership checks return `403 Forbidden`.
- Requests for records outside the user’s school tenant should not leak existence; use `404 Not Found` where the resource should be hidden from cross-tenant lookup.
- The UI should redirect unauthenticated users to `/login`.
- The UI should render a clear access-denied state for `403` responses instead of exposing partial data.
- Sensitive actions must fail closed; if role validation is missing or ambiguous, deny the action.

## Route Notes

- `/app` should act as the landing dashboard after login.
- `/app/students/[id]`, `/app/grades`, and `/app/report-cards` must be filtered to the current user’s permitted scope.
- `/app/attendance` and `/app/assessments` should expose editing controls only to admins and authorized teachers.
- `/app/settings` is reserved for admin-level configuration such as school setup, role management, and platform preferences.

## Implementation Guidance

- Use `profiles.role` as the primary authorization signal.
- Combine role checks with `school_id` filtering on every query.
- For teacher access, also require a match against the relevant class section or subject assignment.
- Keep route guards and database queries aligned so the UI does not expose actions the API would reject.
