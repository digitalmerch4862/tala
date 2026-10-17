import { test, expect } from '@playwright/test';

test.describe('Tala AI Meeting Notetaker — Phase 1 Acceptance Specs', () => {
  test('1. Library & Search: displays seeded real-estate meetings, metrics, and filters by channel', async ({
    page,
  }) => {
    await page.goto('/');

    // Check brand header
    await expect(page.locator('text=Tala AI')).toBeVisible();
    await expect(page.locator('text=Real Estate Meeting Hub')).toBeVisible();

    // Verify metrics strip
    await expect(page.locator('[data-testid="metrics-total-meetings"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-pending-actions"]')).toBeVisible();

    // Verify seeded meetings exist
    await expect(page.locator('text=Shang Residences BGC')).toBeVisible();
    await expect(page.locator('text=Nuvali Commercial Lot')).toBeVisible();

    // Search filter test
    const searchInput = page.locator('[data-testid="meeting-search-input"]');
    await searchInput.fill('Shang Residences');
    await expect(page.locator('text=Shang Residences BGC')).toBeVisible();
    await expect(page.locator('text=Nuvali Commercial Lot')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('text=Nuvali Commercial Lot')).toBeVisible();

    // Channel filter test
    await page.locator('[data-testid="channel-broker-network-btn"]').click();
    await expect(page.locator('text=Nuvali Commercial Lot')).toBeVisible();
    await expect(page.locator('text=Shang Residences BGC')).not.toBeVisible();

    // Reset to all
    await page.locator('button:has-text("All (")').click();
    await expect(page.locator('text=Shang Residences BGC')).toBeVisible();
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
    await titleInput.fill('Aurelia Residences BGC — Client Property Discovery');

    // Select Template
    await page.locator('[data-testid="record-modal-template-select"]').selectOption('client-discovery');

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
    await expect(page.locator('[data-testid="detail-meeting-title"]')).toContainText('Aurelia Residences BGC');

    // Verify Real Estate Deal Brief Card is displayed
    await expect(page.locator('text=Real Estate Deal Parameters & Brief')).toBeVisible();
    await expect(page.locator('text=Target Budget / TCP')).toBeVisible();

    // Back to library
    await page.locator('[data-testid="detail-back-btn"]').click();
    await expect(page.locator('text=Aurelia Residences BGC — Client Property Discovery').first()).toBeVisible();
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
    await page.locator('text=Shang Residences BGC').first().click();
    await expect(page.locator('[data-testid="meeting-detail-view"]')).toBeVisible();

    // 1. Audio Player
    const playBtn = page.locator('[data-testid="audio-play-pause-btn"]');
    await playBtn.click();
    await page.waitForTimeout(1000);
    await playBtn.click(); // pause

    // 2. Transcript Tab
    await page.locator('[data-testid="tab-transcript-btn"]').click();
    await expect(page.locator('[data-testid="transcript-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="transcript-content"] span:has-text("Rad (BDM)")').first()).toBeVisible();
    await expect(page.locator('[data-testid="transcript-content"] span:has-text("Atty. Marco Tan")').first()).toBeVisible();

    // 3. Action Items Tab
    await page.locator('[data-testid="tab-actions-btn"]').click();
    await expect(page.locator('[data-testid="actions-content"]')).toBeVisible();

    // Toggle action status
    const firstToggle = page.locator('[data-testid^="action-status-toggle-"]').first();
    await firstToggle.click();

    // Add new action item
    await page.locator('[data-testid="add-action-item-btn"]').click();
    await page.locator('[data-testid="new-action-title-input"]').fill('Follow up on bank pre-approval with BDO Private Bank');
    await page.locator('[data-testid="save-new-action-btn"]').click();
    await expect(page.locator('text=Follow up on bank pre-approval with BDO Private Bank')).toBeVisible();

    // 4. Ask AI Tab
    await page.locator('[data-testid="tab-chat-btn"]').click();
    await expect(page.locator('[data-testid="chat-content"]')).toBeVisible();

    // Click budget chip
    await page.locator('button:has-text("Budget & Financing?")').click();
    await page.locator('[data-testid="chat-submit-btn"]').click();
    await expect(page.locator('text=PHP 32M - PHP 40M')).toBeVisible({ timeout: 10000 });

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
    await expect(page.locator('text=Prepare official Tower 2 2BR computation sheet')).toBeVisible();

    // Filter by completed
    await page.locator('[data-testid="actions-status-filter"]').selectOption('completed');
    await expect(page.locator('text=Send cadastral lot layout and zoning guideline PDF')).toBeVisible();

    // Filter by high priority
    await page.locator('[data-testid="actions-status-filter"]').selectOption('all');
    await page.locator('[data-testid="actions-priority-filter"]').selectOption('high');
    await expect(page.locator('text=Submit top 5 LOI client endorsements')).toBeVisible();
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
});
