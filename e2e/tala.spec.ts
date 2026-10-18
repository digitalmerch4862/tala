import { test, expect } from '@playwright/test';
import { handleCalendarApiRequest } from '../api/calendar';
import { FakeComposioCalendarAdapter } from '../src/services/composioCalendar';

test.describe('Tala AI Meeting Notetaker — Phase 1 Acceptance Specs', () => {
  test('1. Library & Search: displays seeded meetings, metrics, and filters by channel', async ({
    page,
  }) => {
    await page.goto('/');

    // Check brand header
    await expect(page.locator('text=Tala AI')).toBeVisible();
    await expect(page.locator('text=Team Meeting Hub')).toBeVisible();

    // Verify metrics strip
    await expect(page.locator('[data-testid="metrics-total-meetings"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-pending-actions"]')).toBeVisible();

    // Verify seeded meetings exist
    await expect(page.locator('text=Weekly Team Standup')).toBeVisible();
    await expect(page.locator('text=Client Call — Website Redesign')).toBeVisible();

    // Search filter test
    const searchInput = page.locator('[data-testid="meeting-search-input"]');
    await searchInput.fill('Website Redesign');
    await expect(page.locator('text=Client Call — Website Redesign')).toBeVisible();
    await expect(page.locator('text=Weekly Team Standup')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('text=Weekly Team Standup')).toBeVisible();

    // Channel filter test
    await page.locator('[data-testid="channel-client-calls-btn"]').click();
    await expect(page.locator('text=Client Call — Website Redesign')).toBeVisible();
    await expect(page.locator('text=Weekly Team Standup')).not.toBeVisible();

    // Reset to all
    await page.locator('button:has-text("All (")').click();
    await expect(page.locator('text=Weekly Team Standup')).toBeVisible();
  });

  test('2. Face-to-Face Meeting Recording Flow: template selection, off-the-record toggle, and note generation', async ({
    page,
  }) => {
    await page.goto('/');

    // Open Record Modal
    await page.locator('[data-testid="start-record-btn"]').first().click();
    await expect(page.locator('[data-testid="meeting-recorder-modal"]')).toBeVisible();

    // Fill Title
    const titleInput = page.locator('[data-testid="record-modal-title-input"]');
    await titleInput.fill('Client Call — Website Redesign Review');

    // Select Template
    await page.locator('[data-testid="record-modal-template-select"]').selectOption('client-call');

    // Select Language (Filipino)
    await page.locator('[data-testid="record-modal-language-select"]').selectOption('fil-PH');

    // Toggle Off-The-Record
    const offTheRecordBtn = page.locator('[data-testid="toggle-off-the-record-btn"]');
    await offTheRecordBtn.click();
    await expect(page.locator('text=Off-The-Record Active')).toBeVisible();
    await expect(page.locator('text=Sensitive details or confidential terms')).toBeVisible();

    // Toggle Off-The-Record off again to record
    await offTheRecordBtn.click();
    await expect(page.locator('text=Enable Off-The-Record')).toBeVisible();

    // Start Recording
    await page.locator('[data-testid="modal-start-recording-btn"]').click();
    await expect(page.locator('[data-testid="modal-stop-save-btn"]')).toBeVisible();

    // Wait a brief moment for audio stream
    await page.waitForTimeout(1200);

    // Stop and Save
    await page.locator('[data-testid="modal-stop-save-btn"]').click();

    // Should navigate into the Meeting Detail View
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="detail-meeting-title"]')).toContainText('Client Call');

    // Verify General Executive Overview and Discussion Points are displayed (general meeting without deal brief)
    await expect(page.locator('text=Executive Overview')).toBeVisible();
    await expect(page.locator('text=Key Discussion Points')).toBeVisible();

    // Back to library
    await page.locator('[data-testid="detail-back-btn"]').click();
    await expect(page.locator('text=Client Call — Website Redesign Review').first()).toBeVisible();
  });

  test('3. Audio File Upload Flow: processes audio file with AI diarization and summary', async ({
    page,
  }) => {
    await page.goto('/');

    // Open Upload Modal
    await page.locator('[data-testid="start-upload-btn"]').first().click();
    await expect(page.locator('[data-testid="audio-upload-modal"]')).toBeVisible();

    // Enter title
    await page.locator('[data-testid="upload-title-input"]').fill('Vermosa Ayala Land — Tripping Notes');

    // Select template
    await page.locator('[data-testid="upload-template-select"]').selectOption('site-viewing');

    // Upload a simulated audio file
    const fileInput = page.locator('[data-testid="upload-file-input"]');
    await fileInput.setInputFiles({
      name: 'vermosa_site_viewing.webm',
      mimeType: 'audio/webm',
      buffer: Buffer.from('mock audio file contents'),
    });

    await expect(page.locator('text=vermosa_site_viewing.webm')).toBeVisible();

    // Submit upload
    await page.locator('[data-testid="upload-submit-btn"]').click();

    // Detail view should open
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="detail-meeting-title"]')).toContainText('Vermosa Ayala Land');

    // Back to library
    await page.locator('[data-testid="detail-back-btn"]').click();
    await expect(page.locator('text=Vermosa Ayala Land — Tripping Notes').first()).toBeVisible();
  });

  test('4. Meeting Detail: audio player, transcript diarization, action item checklist, and Ask AI', async ({
    page,
  }) => {
    await page.goto('/');

    // Click on seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // 1. Audio Player
    const playBtn = page.locator('[data-testid="audio-play-pause-btn"]');
    await playBtn.click();
    await page.waitForTimeout(1000);
    await playBtn.click(); // pause

    // 2. Transcript Tab
    await page.locator('[data-testid="tab-transcript-btn"]').click();
    await expect(page.locator('[data-testid="transcript-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="transcript-content"] span:has-text("Host")').first()).toBeVisible();
    await expect(page.locator('[data-testid="transcript-content"] span:has-text("Alex Chen")').first()).toBeVisible();

    // 3. Action Items Tab
    await page.locator('[data-testid="tab-actions-btn"]').click();
    await expect(page.locator('[data-testid="actions-content"]')).toBeVisible();

    // Toggle action status
    const firstToggle = page.locator('[data-testid^="action-status-toggle-"]').first();
    await firstToggle.click();

    // Add new action item
    await page.locator('[data-testid="add-action-item-btn"]').click();
    await page.locator('[data-testid="new-action-title-input"]').fill('Follow up on release deployment checklist');
    await page.locator('[data-testid="save-new-action-btn"]').click();
    await expect(page.locator('text=Follow up on release deployment checklist')).toBeVisible();

    // 4. Ask AI Tab
    await page.locator('[data-testid="tab-chat-btn"]').click();
    await expect(page.locator('[data-testid="chat-content"]')).toBeVisible();

    // Click Key Decisions chip
    await page.locator('button:has-text("Key Decisions?")').click();
    await page.locator('[data-testid="chat-submit-btn"]').click();
    await expect(page.locator('text=Key decisions made in this meeting')).toBeVisible({ timeout: 10000 });

    // 5. Copy Markdown verification
    await page.locator('[data-testid="copy-markdown-btn"]').click();
    await expect(page.locator('text=Copied!')).toBeVisible();
  });

  test('5. Action Items Hub: aggregates cross-meeting tasks and filters by status', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Action Items Hub
    await page.locator('[data-testid="nav-actions-btn"]').click();
    await expect(page.locator('[data-testid="action-items-view"]')).toBeVisible();

    // Check tasks exist
    await expect(page.locator('text=Action Items Hub')).toBeVisible();
    await expect(page.locator('text=Deploy v2.4 staging release and verify telemetry')).toBeVisible();

    // Filter by completed
    await page.locator('[data-testid="actions-status-filter"]').selectOption('completed');
    await expect(page.locator('text=Review Figma prototype and design tokens')).toBeVisible();

    // Filter by high priority
    await page.locator('[data-testid="actions-status-filter"]').selectOption('all');
    await page.locator('[data-testid="actions-priority-filter"]').selectOption('high');
    await expect(page.locator('text=Deploy v2.4 staging release and verify telemetry')).toBeVisible();
  });

  test('6. Real Estate Templates View: browse templates and launch with template pre-selected', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to templates
    await page.locator('[data-testid="nav-templates-btn"]').click();
    await expect(page.locator('[data-testid="templates-view"]')).toBeVisible();

    // Verify templates are listed
    await expect(page.locator('text=Client Property Discovery')).toBeVisible();
    await expect(page.locator('text=Site Viewing & Tripping Notes')).toBeVisible();
    await expect(page.locator('text=Developer & Broker Alignment')).toBeVisible();
    await expect(page.locator('text=Financing & Mortgage Brief')).toBeVisible();
    await expect(page.locator('text=Closing & Reservation Follow-up')).toBeVisible();

    // Click "Record" on Site Viewing template
    await page.locator('[data-testid="template-record-site-viewing"]').click();
    await expect(page.locator('[data-testid="meeting-recorder-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="record-modal-template-select"]')).toHaveValue('site-viewing');
  });

  test('7. Settings Modal: 92 languages selector, LLM switch, and transcription capability matrix', async ({
    page,
  }) => {
    await page.goto('/');

    // Open settings
    await page.locator('[data-testid="settings-btn"]').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();

    // Check 92 languages selector
    const langSelect = page.locator('[data-testid="settings-default-language-select"]');
    await expect(langSelect).toBeVisible();
    await langSelect.selectOption('ceb-PH'); // Cebuano

    // Verify LLM provider buttons
    await expect(page.locator('[data-testid="llm-fleet-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="llm-mock-btn"]')).toBeVisible();

    // Verify Transcription gap disclosure notice
    await expect(page.locator('[data-testid="transcription-gap-notice"]')).toBeVisible();
    await expect(page.locator('text=Transcription Capability Matrix & Gap Disclosure')).toBeVisible();
    await expect(page.locator('text=Zero-Training & Privacy Guarantee')).toBeVisible();

    // Save Settings
    await page.locator('[data-testid="save-settings-btn"]').click();
    await expect(page.locator('text=Saved!')).toBeVisible();
  });

  test('8. Collaborative Agenda Editor: timebox metrics, reorder topics, and carry-over to follow-up meeting', async ({
    page,
  }) => {
    await page.goto('/');

    // Open seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // Switch to Agenda tab
    await page.locator('[data-testid="tab-agenda-btn"]').click();
    await expect(page.locator('[data-testid="agenda-editor-view"]')).toBeVisible();

    // Verify timebox metrics summary strip
    await expect(page.locator('[data-testid="agenda-timebox-summary"]')).toBeVisible();
    await expect(page.locator('text=Minutes Total')).toBeVisible();
    await expect(page.locator('text=Structured Topics')).toBeVisible();

    // Add new agenda topic
    const newTopicInput = page.locator('[data-testid="new-agenda-item-input"]');
    await newTopicInput.fill('Review Sprint Velocity & Retro Items');
    await page.locator('[data-testid="add-agenda-item-btn"]').click();
    await expect(page.locator('text=Review Sprint Velocity & Retro Items')).toBeVisible();

    // Reorder: click move-up on the newly added item
    const moveUpBtns = page.locator('button[data-testid^="move-up-"]');
    const moveUpCount = await moveUpBtns.count();
    if (moveUpCount > 0) {
      await moveUpBtns.last().click();
    }

    // Trigger Carry-Over to Follow-Up Meeting
    await page.locator('[data-testid="carry-over-agenda-btn"]').click();
    await expect(page.locator('[data-testid="carry-over-notice-banner"]')).toBeVisible();
    await expect(page.locator('text=Follow-up meeting')).toBeVisible();
  });

  test('9. Pre-Meeting AI Brief: synthesizes context, talking points, and potential objections', async ({
    page,
  }) => {
    await page.goto('/');

    // Open seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // Switch to Agenda tab
    await page.locator('[data-testid="tab-agenda-btn"]').click();
    await expect(page.locator('[data-testid="agenda-editor-view"]')).toBeVisible();

    // Click Generate AI Brief
    await page.locator('[data-testid="generate-pre-brief-btn"]').click();

    // Expect Pre-Meeting Brief Card to appear
    await expect(page.locator('[data-testid="pre-meeting-brief-card"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Pre-Meeting Executive Brief')).toBeVisible();
    await expect(page.locator('text=Recommended Talking Points:')).toBeVisible();
  });

  test('10. Notes Version History: create snapshot, view version list, and restore previous note version', async ({
    page,
  }) => {
    await page.goto('/');

    // Open seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // Open Version History Modal
    await page.locator('[data-testid="version-history-btn"]').click();
    await expect(page.locator('[data-testid="version-history-modal"]')).toBeVisible();

    // Verify initial version 1 snapshot exists
    await expect(page.locator('[data-testid="version-item-1"]')).toBeVisible();

    // Create a new manual snapshot
    await page.locator('[data-testid="create-snapshot-btn"]').click();
    await expect(page.locator('[data-testid="version-item-2"]')).toBeVisible();

    // Select Version 1 and restore
    await page.locator('[data-testid="version-item-1"]').click();
    await page.locator('[data-testid="confirm-restore-version-btn"]').click();

    // Modal closes and detail view is active
    await expect(page.locator('[data-testid="version-history-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();
  });

  test('11. Privacy Engine & Redaction: redact confidential phrases and sanitize PII patterns', async ({
    page,
  }) => {
    await page.goto('/');

    // Open seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // Open Redaction Modal
    await page.locator('[data-testid="redact-transcript-btn"]').click();
    await expect(page.locator('[data-testid="redaction-modal"]')).toBeVisible();

    // Redact specific sensitive phrase
    await page.locator('[data-testid="redaction-phrase-input"]').fill('Alex Chen');
    await page.locator('[data-testid="apply-phrase-redaction-btn"]').click();
    await expect(page.locator('text=Successfully redacted "Alex Chen"')).toBeVisible();

    // Sanitize automated PII patterns
    await page.locator('[data-testid="apply-pii-redaction-btn"]').click();
    await expect(page.locator('text=PII patterns (Emails, Philippine Phones, IDs, Credit Cards) successfully redacted.')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("Done")').click();
    await expect(page.locator('[data-testid="redaction-modal"]')).not.toBeVisible();
  });

  test('12. Guest Sharing & Integrations: standalone HTML, CRM JSON/CSV export, and Webhook dispatch', async ({
    page,
  }) => {
    await page.goto('/');

    // Open seeded meeting
    await page.locator('text=Weekly Team Standup').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // Open Share & Integrations Modal
    await page.locator('[data-testid="share-export-btn"]').click();
    await expect(page.locator('[data-testid="share-export-modal"]')).toBeVisible();

    // Copy guest share link
    await page.locator('[data-testid="copy-guest-share-link-btn"]').click();
    await expect(page.locator('text=Link Copied!')).toBeVisible();

    // Copy Notion Markdown
    await page.locator('[data-testid="copy-notion-md-btn"]').click();
    await expect(page.locator('text=Copied to Clipboard!')).toBeVisible();

    // Dispatch Webhook
    await page.locator('[data-testid="push-crm-webhook-btn"]').click();
    await expect(page.locator('[data-testid="webhook-dispatch-result"]')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('[data-testid="share-export-modal"]')).not.toBeVisible();
  });

  test('13. Global Ask-AI Assistant: queries pipeline across meetings with clickable source references', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Global Chat
    await page.locator('[data-testid="nav-global-chat-btn"]').click();
    await expect(page.locator('[data-testid="global-chat-view"]')).toBeVisible();
    await expect(page.locator('text=Tala AI Executive Assistant')).toBeVisible();

    // Use quick suggested query
    await page.locator('[data-testid="suggested-query-0"]').click();

    // Assistant responds with source references
    const sourceLink = page.locator('[data-testid^="source-meeting-"]').first();
    await expect(sourceLink).toBeVisible({ timeout: 15000 });

    // Click source meeting to navigate into detail view
    await sourceLink.click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();
  });

  test('14. Calendar Import (.ics RFC 5545): parse standard iCalendar format and import scheduled meeting', async ({
    page,
  }) => {
    await page.goto('/');

    // Open Calendar Import Modal
    await page.locator('[data-testid="import-ics-btn"]').click();
    await expect(page.locator('[data-testid="calendar-import-modal"]')).toBeVisible();

    // Paste RFC 5545 iCalendar content
    const sampleICS = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tala AI//RFC 5545 Spec Test//EN',
      'BEGIN:VEVENT',
      'UID:e2e-event-999@tala.ai',
      'SUMMARY:Quarterly Product Roadmap Review',
      'DTSTART:20261025T090000Z',
      'DTEND:20261025T100000Z',
      'LOCATION:Conference Room A',
      'DESCRIPTION:Executive review of upcoming product release milestones',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    await page.locator('[data-testid="ics-raw-textarea"]').fill(sampleICS);

    // Verify parsed event item appears
    await expect(page.locator('[data-testid="parsed-event-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="parsed-event-0"]').locator('text=Quarterly Product Roadmap Review')).toBeVisible();

    // Confirm import
    await page.locator('[data-testid="confirm-import-calendar-btn"]').click();
    await expect(page.locator('[data-testid="calendar-import-modal"]')).not.toBeVisible();

    // Verify imported meeting is in library list
    await expect(page.locator('text=Quarterly Product Roadmap Review').first()).toBeVisible();
  });

  test('15. Settings: Retention Auto-Purge, Cryptographic Hash-Chained Audit Trail, and Needs Keys Adapters', async ({
    page,
  }) => {
    await page.goto('/');

    // Open Settings Modal
    await page.locator('[data-testid="settings-btn"]').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();

    // 1. Retention Tab
    await page.locator('[data-testid="settings-tab-retention"]').click();
    await expect(page.locator('[data-testid="settings-retention-select"]')).toBeVisible();
    await page.locator('[data-testid="settings-retention-select"]').selectOption('30');
    await expect(page.locator('[data-testid="purge-expired-now-btn"]')).toBeVisible();

    // 2. Audit Trail Tab
    await page.locator('[data-testid="settings-tab-audit"]').click();
    await expect(page.locator('[data-testid="settings-audit-section"]')).toBeVisible();
    await expect(page.locator('text=Chain Verified: Valid')).toBeVisible();
    await expect(page.locator('[data-testid="export-audit-json-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-log-list"]')).toBeVisible();

    // 3. Composio Google Calendar & Needs Keys Live Sync Adapters Tab
    await page.locator('[data-testid="settings-tab-integrations"]').click();
    await expect(page.locator('[data-testid="settings-integrations-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="composio-google-calendar-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-calendar-sync-badge"]')).toContainText('Calendar sync off');
    await expect(page.locator('[data-testid="needs-keys-hubspot-crm"]')).toBeVisible();
    await expect(page.locator('[data-testid="needs-keys-salesforce-crm"]')).toBeVisible();
    await expect(page.locator('[data-testid="needs-keys-meeting-bots"]')).toBeVisible();
  });

  test('16. Face-to-Face Meeting Recorder: Pause and Resume functionality', async ({
    page,
  }) => {
    await page.goto('/');

    // Open Recorder Modal
    await page.locator('[data-testid="start-record-btn"]').first().click();
    await expect(page.locator('[data-testid="meeting-recorder-modal"]')).toBeVisible();

    // Set meeting title
    await page.locator('[data-testid="record-modal-title-input"]').fill('Product Architecture Alignment');

    // Start Recording
    await page.locator('[data-testid="modal-start-recording-btn"]').click();
    await expect(page.locator('[data-testid="modal-pause-recording-btn"]')).toBeVisible();

    // Pause Recording
    await page.locator('[data-testid="modal-pause-recording-btn"]').click();
    await expect(page.locator('[data-testid="modal-resume-recording-btn"]')).toBeVisible();

    // Resume Recording
    await page.locator('[data-testid="modal-resume-recording-btn"]').click();
    await expect(page.locator('[data-testid="modal-pause-recording-btn"]')).toBeVisible();

    // Stop and Save
    await page.locator('[data-testid="modal-stop-save-btn"]').click();

    // Verify navigation into Meeting Detail View
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="detail-meeting-title"]')).toContainText('Product Architecture');
  });

  test('17. Composio Google Calendar Serverless Route (/api/calendar): off fallback, list upcoming events, link event to meeting, and create follow-up event via fake adapter', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Default local-first fallback when /api/calendar or COMPOSIO_API_KEY is absent
    await page.locator('[data-testid="import-ics-btn"]').click();
    await expect(page.locator('[data-testid="calendar-import-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-sync-status-badge"]')).toContainText('Calendar sync off');

    // 2. Mount /api/calendar serverless route backed by FakeComposioCalendarAdapter
    const fakeAdapter = new FakeComposioCalendarAdapter(true);
    await page.route('**/api/calendar*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const query: Record<string, string> = {};
      url.searchParams.forEach((v, k) => {
        query[k] = v;
      });
      const postData = request.postData();
      const result = await handleCalendarApiRequest(
        {
          method: request.method(),
          query,
          body: postData || undefined,
        },
        fakeAdapter
      );
      await route.fulfill({
        status: result.statusCode,
        contentType: 'application/json',
        body: JSON.stringify(result.body),
      });
    });

    // 3. Refresh Calendar Sync -> lists upcoming events from FakeComposioCalendarAdapter
    await page.locator('[data-testid="refresh-composio-calendar-btn"]').click();
    await expect(page.locator('[data-testid="calendar-sync-status-badge"]')).toContainText('Calendar sync active');
    await expect(page.locator('[data-testid="composio-events-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="composio-event-0"]')).toContainText(
      'Ayala Land Premier — BGC Penthouse Client Walkthrough'
    );

    // 4. Link event to a Tala meeting (title, attendees, time)
    await page.locator('[data-testid="link-composio-event-0"]').click();
    await expect(page.locator('[data-testid="calendar-import-modal"]')).not.toBeVisible();

    // Verify linked meeting is in library and open it
    const linkedCard = page.locator('text=Ayala Land Premier — BGC Penthouse Client Walkthrough').first();
    await expect(linkedCard).toBeVisible();
    await linkedCard.click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // 5. Create follow-up event on Google Calendar via Agenda Carry-Over
    await page.locator('[data-testid="tab-agenda-btn"]').click();
    await expect(page.locator('[data-testid="agenda-editor-view"]')).toBeVisible();
    await page.locator('[data-testid="carry-over-agenda-btn"]').click();
    await expect(page.locator('[data-testid="carry-over-notice-banner"]')).toContainText(
      'synced to Google Calendar (gcal-followup-3)'
    );
  });
});
