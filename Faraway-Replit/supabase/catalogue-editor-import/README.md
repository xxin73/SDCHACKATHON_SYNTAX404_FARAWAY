# Import through Supabase SQL Editor

The original 3.48 MB file exceeds the dashboard query limit. Use these seven files instead. Do not paste all files together.

1. Open `01_setup.sql`, copy its complete contents into a new SQL query, and Run.
2. Run each `02` through `06` data file separately, in order.
3. Run `07_finish.sql` last. It validates all parts before activating the catalogue.

Keep application RLS enabled. The setup uses a private staging schema with application-role access revoked and RLS enabled. Data parts can be safely rerun. Existing catalogue stays active until the final transaction succeeds; existing user records are not changed. The final step removes the staging table.

After each file, “Success. No rows returned” is expected. If any file errors, stop and resolve it before running the final file.
