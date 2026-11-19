# Terms of reference

These terms set how the [committee name, for example TIGER] reviews and records architecture decisions. They are ADR 0000, so they change the same way any decision does: through a merge request that the committee votes on. Replace everything in [brackets].

## Purpose

The committee reviews proposed architecture decisions for [scope, for example the StatCan Developer Program] and records the ones it accepts. Accepted decisions guide [who, for example all teams building on the program's platforms].

## Membership

- **Chair:** [name or role]. The chair has the Maintainer role on this GitLab project.
- **Members:** [names or roles]. The member list on the decision site (`members.json` in the decisions folder) is the official list. It shows whether each member is voting or non-voting and which group they represent: only voting members' votes count. Members need the Reporter role or higher to take part.
- **Authors:** anyone with the Developer role can put a proposal on a meeting's agenda. Others can ask a member to do it for them.
- Access to the GitLab project doesn't make someone a member. Membership changes are made by [who], and the chair updates the member list on the decision site.

## Proposing a decision

1. Copy the outline from an existing decision, and write it in English and French: `NNNN-short-name-en.md` and `NNNN-short-name-fr.md` in the decisions folder. Use the next free number.
2. Add both files to the branch of the meeting where the proposal will be discussed. Each meeting has one merge request into the default branch, named after it, for example "2026-11-20 - Meeting". Each decision in it is a separate proposal.
3. Tell the committee, for example in [channel or meeting].

A proposal can't be accepted until both language versions are present.

## Review and voting

- **Discussion** happens in the meeting's merge request, either on the decision site or in GitLab. Anyone with access can comment beside a paragraph, on a proposal, or on the meeting. The chair can record comments members make at a meeting.
- **Voting:** each member has one vote per proposal, For or Against, cast on the decision site or as a 👍 or 👎 reaction on the proposal's ballot comment in GitLab. Votes are visible to everyone with access to the project.
- **Voting period:** [for example, 10 business days after the merge request is opened, or until the next meeting].
- **Quorum:** [for example, a majority of members have voted].
- **Decision rule:** [for example, a simple majority of votes cast; the chair breaks a tie].

## Decisions

- When the voting period ends and quorum is met, the chair accepts or rejects each proposal, following the decision rule. The decision site records the final tally on the proposal's ballot comment, so GitLab keeps the record.
- A recorded tally stands even if the member list changes later.
- The chair then closes the meeting. Accepted proposals are merged into the default branch. Rejected proposals, and any not decided, are taken out of the merge request; an author can put a deferred proposal on a later meeting's agenda.
- If new commits are pushed after people have voted, the chair [for example, asks members to confirm their vote] before deciding.
- An accepted decision is replaced or withdrawn by a new proposal that edits or supersedes it.

## Review of these terms

The committee reviews these terms [for example, every year] and changes them through a merge request on this file and its French version.
