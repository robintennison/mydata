# MyData local source backup — 2026-09-22

This folder contains a complete Git history bundle and a patch for the working
tree as it existed at backup time. No secrets or `.env.local` values are in this
backup.

## Restore the application source

1. Create an empty destination folder, then run:

   ```powershell
   git clone mydata-git-history.bundle MyData
   Set-Location MyData
   git apply ..\working-tree.patch
   Copy-Item -Recurse ..\untracked-files\* .
   npm ci
   npm run build
   ```

2. Recreate `.env.local` from a separately held secure copy. Use
   `.env.example` as the variable-name reference.

3. Restore Firestore and Storage only from the cloud-export artifacts made by
   a project owner. The authenticated account used for this backup did not have
   the permissions required to export or manage either service.

## Contents

- `mydata-git-history.bundle`: all reachable repository history.
- `working-tree.patch`: uncommitted tracked changes, including deletions.
- `untracked-files`: relevant untracked source and test files.

## Cloud data still required

For a complete recovery, export the default Firestore database and the Firebase
Storage bucket with a Firebase/Google Cloud project owner account. Keep the
export paths, Firestore/Storage security rules, Authentication configuration,
Hosting deployment/configuration, and the project's environment values with
this source backup.

## Completed cloud exports

- Firestore: `gs://robintennison-mydata-firestore-backups-india/2026-09-22T09:04:00_9604`
  (717 documents, 300.16 KB; completed 2026-09-22 14:35 IST).
- Firebase Storage: one-time Storage Transfer job `2993355767297522604`, from
  `robintennison-mydata.firebasestorage.app` to
  `gs://robintennison-mydata-storage-backups-india/2026-09-22/`; completed
  successfully at 2026-09-22 14:37 IST. The job was configured never to delete
  files from either bucket.
