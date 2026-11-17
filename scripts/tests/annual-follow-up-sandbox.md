# Annual follow-up verification (issue #20)

## Automated checks

From the repository root:

```sh
npm run test:unit -- -- --runInBand
python3 -m unittest discover -s scripts/tests -v
```

Run `AnnualFollowUpFormulaTest` in Salesforce after deploying its metadata dependencies. It evaluates the deployed scheduling formulas using Salesforce's formula evaluator, substituting controlled input values so tests do not depend on or modify the live Rollout cutoff. It covers the first anniversary, older programs, a cutoff on the anniversary, late sends, excluded statuses, missing values, due status, and February anniversaries.

The Python checks inspect the actual flow graph, email settings, metadata, and permissions. They verify that the success path records the send date and clears the previous error, while the failure path records the fault without changing the send date. They do not execute an email or establish successful delivery.

The component retains the unused `reminderDays` public property and metadata declaration so existing Lightning pages can be upgraded without first removing the component. Scheduling uses the formula fields; remove this legacy property later through a separate page migration.

## Sandbox checks

The deployment manifest includes focused profile metadata granting read access to the three check-in fields for System Administrator (`Admin`), FOCUS Standard User, Executive Management, and Finance. These profile files contain only those field permissions; they do not export unrelated profile settings. Users on these profiles do not need an additional permission-set assignment to view Annual Check-In. The existing Equipment Manager permission set also retains its field grants.

Keep the committed flow in Draft. Do not activate it in production for this ticket. Organization-wide sender verification is an activation prerequisite and is outside this ticket's scope. The development sandbox also reports an invalid Automated Process User Email Address; its administrator must resolve that setting before actual send verification. This change does not modify either email setting.

Use sandbox-only Equipment Programs with parent addresses controlled by the tester. Preserve the existing Rollout configuration before testing; the committed cutoff is intentionally blank and disables scheduling until configured. Do not change the cutoff of an active automation just to test it.

1. Deploy the three scheduling fields, cursor, cutoff type/record, new error field, flow, component, permission set, and record page together. Confirm Flow Builder has no invalid field references. Confirm staff can read the component fields and Last Follow-Up Error in the record Details.
2. Set a test cutoff in the past. Confirm a new eligible program is first scheduled one year after Funds Released Date. Change Delivered Date and the related Equipment's status: neither should change eligibility or the anniversary.
3. For an older never-emailed program, confirm the next anniversary is strictly after the cutoff and Last Follow-Up Date remains blank. A blank cutoff must prevent scheduling.
4. Check each excluded Equipment Program status: Equipment Returned, Pending, Denied, Withdrawn, and Funds Expired. Each must show Ineligible, have no scheduled date, and be absent from Annual Follow-Ups Required. Repeat with missing Funds Released Date or Parent Email.
5. On an eligible due test record, debug the draft flow using a verified organization-wide equipment sender and a tester-controlled recipient. Only run a real send when the sandbox is configured for testing and the recipient is controlled. Confirm the email is associated with the Equipment Program's standard Activity timeline and Last Follow-Up Date equals the actual send date. Confirm the next date stays anchored to Funds Released Date after a late send.
6. Test the email action's failure path in an isolated draft flow/debug session, using an unavailable sender or an invalid recipient on the test record. Confirm Last Follow-Up Date is unchanged, Last Follow-Up Error records the fault, and the record remains due. Do not use rollback mode to verify persisted results. When a later send succeeds, confirm the previous error is cleared.
7. Confirm the record-page component shows only status, next scheduled email, and last successful email. Check the Ineligible, never-sent, loading, and access-error states. The standard Activity timeline remains the place to view sent emails.

If the equipment organization-wide address is not verified/selectable, leave real-send success verification pending. Do not activate the flow or substitute an unapproved production sender.
