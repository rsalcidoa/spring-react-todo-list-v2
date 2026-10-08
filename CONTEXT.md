# TO-DO — Domain Context

A personal task manager with a Kanban board. Tasks are organized by status,
grouped by tags and projects, and scoped by date views. This file is the shared
glossary: it defines what each domain term means and which words to avoid.

## Work items

**Task**:
A single to-do owned by a User and shown on the Board.
_Avoid_: item, todo, ticket, card

**Subtask**:
A Task that belongs to a parent Task. Nesting is limited to one level.
_Avoid_: child task, checklist item

**Parent**:
The Task a Subtask belongs to.
_Avoid_: owner task, root

**Status**:
A Task's position in the workflow: Pending, Active or Completed.
_Avoid_: state, phase

**Pending**:
The Status of a Task that has not started.

**Active**:
The Status of a Task in progress.

**Completed**:
The Status of a finished Task.

**Priority**:
A Task's importance: Low, Medium or High.

**Position**:
A Task's manual order within its Status column on the Board.

**Due date**:
The date on which a Task is expected to be done (date only, no time).
_Avoid_: deadline, end date

**Due state**:
How a Due date is presented relative to today: Overdue, Today, Future or None.

**Reminder**:
A timestamp at which a Task should notify the User once.

**Recurrence**:
A rule (None, Daily, Weekly, Monthly) that spawns the next occurrence of a
Task when it is completed.
_Avoid_: repeat rule, schedule

**Soft-delete**:
Hiding a Task and its Subtasks without erasing them.
_Avoid_: archive, trash

**Restore**:
Bringing a soft-deleted Task and its Subtasks back.

**Undo**:
The short window after a Soft-delete during which the User can Restore the Task.

## Board

**Board**:
The Kanban view of a User's Tasks, organized into Columns.
_Avoid_: dashboard, list

**Column**:
One Status group of Tasks on the Board.

**View**:
A date-based scope of the Board: All, Today, Overdue or Upcoming.
_Avoid_: tab, filter

**Filter**:
A narrowing of the visible Tasks by Tag or by Project.
_Avoid_: facet

**Query**:
The search, priority and sort selection applied to a User's Tasks.
_Avoid_: search options

**Optimistic update**:
Applying a change on the Board before the server confirms it, reverting it if
the server rejects.
_Avoid_: local update

## Organization

**Tag**:
A user-scoped label for Tasks. Tag names are unique per User, ignoring case and
surrounding whitespace.
_Avoid_: label, keyword, category

**Project**:
A user-scoped group a Task may belong to. A Task belongs to at most one Project.
_Avoid_: folder, list

## Identity

**User**:
The account that owns Tasks, Tags and Projects.
_Avoid_: account, client

**Session**:
A User's authenticated state, carried by a short-lived access token and a
refresh token.

**Ownership**:
The rule that a User may only read or change their own resources.
_Avoid_: permission, access

## Errors

**Error envelope**:
The API's structured error body: `{error}` for simple errors, and
`{error, errors}` for validation failures, where `errors` maps a field to its
messages.
_Avoid_: error response, error payload
