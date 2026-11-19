# Terms of reference

These terms set how the [committee name, for example TIGER] reviews and records architecture decisions. They are ADR 0000, so they change the same way any decision does: through a merge request that the committee votes on. Replace everything in [brackets].

## Purpose

The committee reviews proposed architecture decisions for [scope, for example the StatCan Developer Program] and records the ones it accepts. Accepted decisions guide [who, for example all teams building on the program's platforms].

## Membership

- **Chair:** [name or role]. The chair has the Maintainer role on this GitLab project.
- **Members:** [names or roles]. Members have the Reporter role or higher.
- **Authors:** anyone with the Developer role can propose a decision. Others can ask a member to propose it for them.
- Membership changes are made by [who], and the project's members in GitLab are kept in step with this list.

## Proposing a decision

1. Copy the outline from an existing decision, and write it in English and French: `NNNN-short-name-en.md` and `NNNN-short-name-fr.md` in the decisions folder. Use the next free number.
2. Put both files on a new branch and open a merge request into the default branch. Start its title with [RFC] (or the prefix the decision site is set up with), for example "[RFC] Adopt PostgreSQL". One merge request can hold several related decisions and supporting files; the committee votes on them together.
3. Tell the committee, for example in [channel or meeting].

A proposal can't be accepted until both language versions are present.

## Review and voting

- **Discussion** happens in the merge request, either on the decision site or in GitLab. Members can comment on the whole proposal, on one file, or on one paragraph. The chair can record comments members make at a meeting.
- **Voting:** each member has one vote, For or Against, cast on the decision site or as a 👍 or 👎 reaction on the merge request. Votes are visible to everyone with access to the project.
- **Voting period:** [for example, 10 business days after the merge request is opened, or until the next meeting].
- **Quorum:** [for example, a majority of members have voted].
- **Decision rule:** [for example, a simple majority of votes cast; the chair breaks a tie].

## Decisions

- When the voting period ends and quorum is met, the chair accepts the proposal (merges the merge request) or rejects it (closes the merge request), following the decision rule.
- The decision site adds the final tally to the merge request, so GitLab keeps the record.
- If new commits are pushed after people have voted, the chair [for example, asks members to confirm their vote] before accepting.
- An accepted decision is replaced or withdrawn by a new proposal that edits or supersedes it.

## Review of these terms

The committee reviews these terms [for example, every year] and changes them through a merge request on this file and its French version.
