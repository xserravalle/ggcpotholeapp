# Hazard Refactor Plan — Tab Reorganization

Detailed plan for reorganizing hazard-related form fields into a tabbed interface, as discussed in team chat (2026-09-22 ~9:00 PM).

---

## Overview

**Problem:** PotholeReportModal has too many form sections crowded in a single linear view. Hazard assessment fields (damage risk, dimensions, surface type) are scattered and difficult to scan on mobile.

**Solution:** Reorganize form into tabs:
1. **Tab 1: Location & Photo** — Address, landmark, photo, GPS
2. **Tab 2: Hazard Details** — Severity, hazard type, dimensions, surface type, damage risk
3. **Tab 3: Reporter Info** — Name, email, optional notes

**Goal:** Cleaner UX, better mobile responsiveness, fewer fields per screen.

---

## Current State

**File:** `src/components/potholes/PotholeReportModal.tsx` (lines 224–462)

### Current Form Sections (Linear)

1. Photo Upload (lines 227–268)
2. Dispatch Authority Badge (lines 271–297)
3. Severity & Hazard Type (lines 300–340)
4. Address & Landmark (lines 343–369)
5. Coordinates & Damage Risk (lines 372–406)
6. Description (lines 409–418)
7. Reporter Info (lines 421–442)
8. Submit/Cancel Buttons (lines 445–460)

### Issues

- User must scroll through 7+ sections on mobile
- Severity selector (4 buttons) takes up too much vertical space
- Damage risk dropdown isolated at bottom-right
- Photo, address, and severity are spread across different vertical areas
- No logical grouping of related hazard information

---

## Proposed Tab Structure

### Tab 1: Location & Incident
- Photo upload (centered, prominent)
- Address field
- Landmark field
- GPS pinpoint button
- Quick presets (moved here or kept above tabs)
- Severity selector (4 buttons) — move here from current position

### Tab 2: Hazard Assessment
- Hazard type dropdown
- Estimated depth (inches)
- Estimated width (inches)
- Surface type dropdown
- Damage risk dropdown
- Description textarea

### Tab 3: Reporter & Notes
- Reporter name (optional)
- Reporter email (optional)
- Additional notes / hazard details

### Always Visible (Outside Tabs)
- Dispatch Authority Badge (stays at top below form header)
- Tab navigation (Location | Hazard | Reporter)
- Submit/Cancel buttons (stays at bottom)

---

## Implementation Details

### 3.1 State Changes

Add to PotholeReportDialogBody state:

```typescript
const [activeTab, setActiveTab] = useState<'location' | 'hazard' | 'reporter'>('location');
```

### 3.2 Tab Navigation Component

Create reusable tab control (or inline):

```typescript
<div className="flex border-b border-slate-700 mb-4 gap-0">
  {(['location', 'hazard', 'reporter'] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 px-3 text-sm font-semibold border-b-2 transition ${
        activeTab === tab
          ? 'border-teal-500 text-teal-400'
          : 'border-transparent text-slate-400 hover:text-slate-300'
      }`}
    >
      {tab === 'location' && '📍 Location & Photo'}
      {tab === 'hazard' && '⚠️ Hazard Details'}
      {tab === 'reporter' && '👤 Reporter Info'}
    </button>
  ))}
</div>
```

### 3.3 Tab Content Sections

Wrap each tab's form fields in conditional rendering:

```typescript
{activeTab === 'location' && (
  <>
    {/* Photo Upload */}
    {/* Address & Landmark */}
    {/* Severity Selector */}
  </>
)}

{activeTab === 'hazard' && (
  <>
    {/* Hazard Type */}
    {/* Dimensions */}
    {/* Surface Type */}
    {/* Damage Risk */}
    {/* Description */}
  </>
)}

{activeTab === 'reporter' && (
  <>
    {/* Reporter Name */}
    {/* Reporter Email */}
  </>
)}
```

### 3.4 Refactored Form Structure

```
<form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
  
  {/* Tab Navigation */}
  <div className="flex border-b border-slate-700 mb-4 gap-0">
    {/* Tab buttons */}
  </div>

  {/* Authority Badge — Always Visible */}
  <div className="bg-slate-800/80 ...">
    {/* Authority routing info */}
  </div>

  {/* Tab 1: Location & Photo */}
  {activeTab === 'location' && (
    <div className="space-y-3">
      {/* Photo upload */}
      {/* Address & landmark */}
      {/* Severity selector */}
    </div>
  )}

  {/* Tab 2: Hazard Details */}
  {activeTab === 'hazard' && (
    <div className="space-y-3">
      {/* Hazard type dropdown */}
      {/* Dimensions grid */}
      {/* Surface type */}
      {/* Damage risk */}
      {/* Description textarea */}
    </div>
  )}

  {/* Tab 3: Reporter Info */}
  {activeTab === 'reporter' && (
    <div className="space-y-3">
      {/* Reporter name */}
      {/* Reporter email */}
    </div>
  )}

  {/* Submit/Cancel Buttons — Always Visible */}
  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
    {/* Cancel & Submit */}
  </div>

</form>
```

---

## UI/UX Considerations

### 4.1 Tab Styling

- **Active tab indicator:** Bottom border in teal-500
- **Inactive tabs:** Slate-400 text, no border
- **Hover state:** Slight text brightening
- **Mobile:** Font-size 12px for tab labels (prevent overflow)
- **Icons:** Emoji or lucide-react icon prefix (optional)

### 4.2 Form Validation

- Validation messages only show in active tab (don't distract from other tabs)
- On submit, validate all tabs (not just active tab)
- If validation fails on non-active tab, switch to that tab and highlight error

### 4.3 Mobile Responsiveness

- Tab buttons stack vertically on screens < 400px (optional, or keep inline)
- Modal max-height adjusted for tab content
- Padding reduced on mobile (p-3 instead of p-6)

### 4.4 Accessibility

- Tab buttons have `role="tab"` attributes (or use semantic `<button>` with aria-selected)
- Keyboard navigation: Tab key cycles through tab buttons
- Escape key closes modal (existing behavior)
- Tab labels clear and descriptive

---

## Implementation Sequence

1. **Create activeTab state** in PotholeReportDialogBody
2. **Extract photo upload section** → Keep in Tab 1
3. **Extract address/landmark** → Move to Tab 1
4. **Extract severity selector** → Move to Tab 1 (currently with hazard type)
5. **Extract hazard type dropdown** → Move to Tab 2 with dimensions
6. **Extract damage risk dropdown** → Move to Tab 2
7. **Extract surface type** → Move to Tab 2
8. **Extract description textarea** → Move to Tab 2
9. **Extract reporter info** → Move to Tab 3
10. **Add tab navigation UI** above form sections
11. **Test mobile responsiveness** on iPhone SE viewport
12. **Test form submission** across all tabs
13. **Test validation** (ensure all fields still required/optional as before)

---

## Testing Checklist

- [ ] Tab buttons render correctly
- [ ] Clicking tab button switches activeTab state
- [ ] Tab 1 shows photo, address, severity
- [ ] Tab 2 shows hazard type, dimensions, surface, damage risk, description
- [ ] Tab 3 shows reporter name/email
- [ ] Form submission validates all tabs (not just active tab)
- [ ] On mobile (< 640px), tabs still readable (font-size, overflow)
- [ ] Authority badge always visible (not hidden by tabs)
- [ ] Submit/Cancel buttons always visible
- [ ] Keyboard navigation (Tab key) works
- [ ] Escape key closes modal
- [ ] Pre-filled fields (from GPS, sensor) still work
- [ ] Preset location buttons still populate Tab 1 fields

---

## Performance Impact

- **No performance regression expected** — Conditional rendering with `{activeTab === 'tab'}` is efficient
- **State change latency** — Tab switching is instant (no API calls, just re-render)
- **Bundle size** — No new dependencies; reuses existing Tailwind + React

---

## Rollback Plan

If refactor causes issues:
1. Revert PotholeReportModal.tsx to main branch version
2. Discard activeTab state
3. Re-merge with hazard refactor reverted

---

## Future Enhancements

- **Tab state persistence** — Remember user's last active tab in localStorage
- **Tab completion indicator** — Show checkmark when tab fields are filled
- **Multi-step wizard** — Add "Next >" button to auto-advance to next tab
- **Validation summary** — Show which tabs have errors on submit

---

## Files to Modify

- `src/components/potholes/PotholeReportModal.tsx` — Main refactor (form structure)

## Files NOT Affected

- Component props stay the same (onSubmitReport, isOpen, onClose, initialTelemetry, initialCoords)
- Incident data model unchanged (PotholeReport interface)
- Jurisdiction routing unchanged
- PDF export, email templates unchanged

---

**Owner:** Erick (evale branch)  
**Status:** Plan only (ready for implementation)  
**Last Updated:** 2026-09-22
