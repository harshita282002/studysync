# StudySync Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **PII Isolation**: User email addresses live strictly in `/users/{userId}` and are readable only by the authenticated owner (`request.auth.uid == userId`). Public directory discovery uses `/peerProfiles/{profileId}` which contains zero email or PII fields.
2. **Identity Integrity**: Every document creation sets ownership (`uid` / `ownerUid` / `senderId`) strictly equal to `request.auth.uid`.
3. **Immutable Audit Fields**: `createdAt`, `uid`, `ownerUid`, `creatorId`, `senderId`, and `receiverId` cannot be mutated after creation.
4. **Server Timestamps**: `createdAt` (on create) and `updatedAt` (on workspace create/update) must strictly equal `request.time`.
5. **Action-Based Updates & Terminal State Locking**:
   - `matchRequests` start as `Pending` and may only transition once to `Accepted` or `Declined` by `receiverId`.
   - `projectBoards` cannot be modified once `status == "Completed"`.
6. **Bounded Arrays & Strings**: All strings enforce `.size()` limits; `skills <= 6`, `requiredSkills <= 10`, `currentMembers <= 12`, `memberIds <= 12`, `tasks <= 60`, `links <= 20`.

## 2. The "Dirty Dozen" Attack Payloads
1. **PII Cross-Read**: User B reads `/users/userA` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on User**: User A writes `{ ..., role: "admin" }` to `/users/userA` -> `PERMISSION_DENIED`.
3. **Spoofed Peer Profile**: User A creates `/peerProfiles/userB` with `ownerUid: "userB"` -> `PERMISSION_DENIED`.
4. **Client Timestamp Forgery**: User A creates a project with `createdAt: Timestamp(2020-01-01)` -> `PERMISSION_DENIED`.
5. **Oversized ID Poisoning**: User A writes to `/projectBoards/<200-char-invalid-id!@#>` -> `PERMISSION_DENIED`.
6. **Unbounded Array Bomb**: User A posts a project with 50 `requiredSkills` -> `PERMISSION_DENIED`.
7. **Spoofed Match Request Sender**: User A sends match request with `senderId: "userB"` -> `PERMISSION_DENIED`.
8. **Self-Accept Match Request**: User A (sender) tries to set `status: "Accepted"` on their own outgoing match request -> `PERMISSION_DENIED`.
9. **Terminal State Bypass on Match Request**: User B changes an already `Declined` match request back to `Pending` -> `PERMISSION_DENIED`.
10. **Blanket Match Request Scraping**: User C runs `list` on `/matchRequests` without filtering to `senderId == C` or `receiverId == C` -> `PERMISSION_DENIED`.
11. **Unauthorized Workspace Mutation**: User C (not in `memberIds`) updates tasks on `/teamWorkspaces/ws1` -> `PERMISSION_DENIED`.
12. **Completed Project Modification**: Creator modifies `description` after `status == "Completed"` -> `PERMISSION_DENIED`.
