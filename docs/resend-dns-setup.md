# Account email sender setup

Prepared October 28, 2026 in the owner's signed-in Resend account. No domains were configured before this setup. `auth.ashenforgegames.com` is now verified in Resend. The owner approved all three DNS additions; GoDaddy saved them successfully. Resend confirmed the domain and all three records as Verified; sending is enabled and receiving remains disabled.

Resend identifies GoDaddy as the DNS host. Add these records in the **ashenforgegames.com** zone. GoDaddy saved the records with a 1-hour TTL.

| Type | Name | Value |
| --- | --- | --- |
| TXT | resend._domainkey.auth | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDWDvxJT0UUZUXlbQlBP4rIF9hCcrNaX1rotP0+3rK9lQ8oI9HZ4x3VOp7BhWeSg171RewfeVs60XmevFpmupZV8zkVycje2KgHHbFDgSNKiylTujmwxTzCu/fvbidBib+XqdEjpygNYqLNR+SmvhX//BeDtgrIQo0ekY8MO7Ld8QIDAQAB |
| CNAME | rsend.auth | rsend.forge.rmta.net |
| CNAME | send.auth | send.forge.rmta.net |

These are public DNS values, not API credentials. Preserve existing mail/MX/SPF records. Receiving remains disabled. Do not authorize broad automatic DNS management when only these records are needed.

After DNS verification, configure a sending-only, domain-scoped Resend credential directly in Supabase SMTP settings. Keep it out of chat, source control, frontend environment values and build artifacts. Use a sender such as `DuelTheory <accounts@auth.ashenforgegames.com>`. Verify current Resend SMTP host/port/user guidance before saving settings. Both first-signup and returning-user templates need a one-time code.

Public sign-in stays disabled until email delivery, session flows, successful account deletion and privacy updates are verified.
