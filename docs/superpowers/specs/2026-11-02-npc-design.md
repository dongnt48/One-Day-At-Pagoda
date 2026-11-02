# Ambient temple visitors

Approved direction: server-controlled NPCs participate in map activities. Each active room starts near 20 NPCs and varies gradually between 15 and 25. All clients share the same visitors. Real players take priority; NPCs are excluded from online counts, social actions, quests and authentication.

Approaches: client-only scenery is cheap but inconsistent between visitors; socket clients waste connections and need guest identities. Use a separate server-side population merged into existing snapshots and patches, with no synthetic connections or database records.

NPCs follow collision-checked paths. Courtyard visitors sweep and water plants; hall visitors pray, meditate and listen; dining visitors collect a tray, eat and return it. Humans can take seats; NPCs yield. Idle rooms retain Colyseus disposal behavior.

Production defaults to 20 NPCs; compose.bots.yaml forwards BOT_COUNT (default 20), and BOT_COUNT=0 disables them. An override preserves the manually configured VPS ports in compose.yaml. Count varies by five either side of the configured baseline and leaves room for humans near capacity. Existing standalone tests and local development default to disabled unless configured.

Do not deploy or modify the VPS automatically. Deliver code, tests and deployment instructions.
