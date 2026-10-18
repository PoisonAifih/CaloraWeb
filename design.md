# Calora — Design System & Visual Guidelines (`DESIGN.md`)

## 1. Brand Vision & Overview
**Calora** is a modern calorie and fitness tracking app focused on organic health, energy, and clear data visualization. The visual language blends the vibrant energy of fresh food with structured, intuitive UI patterns designed to make daily meal logging feel inviting rather than clinical.

---

## 2. Color Palette & Roles

Instead of using every vibrant shade from raw references, Calora uses a deliberate, high-contrast palette built around **Forest Green** (grounded health), **Crisp Carrot** (primary energy & primary CTAs), **Cream** (warm, approachable backgrounds), and structured semantic accents.

### Core Brand Colors

| Color Name | Hex Code | Usage / Purpose |
| :--- | :--- | :--- |
| **Forest Green** | `#18542A` | Primary headers, dark container cards, success states, brand anchor |
| **Crisp Carrot** | `#F96015` | Primary CTA buttons, key highlight accents, active navigation states |
| **Cream Light** | `#F3E8CC` | Soft card fills, neutral container backgrounds, warm borders |
| **Warm Canvas** | `#FAFAF5` | Primary app screen background (light mode body) |
| **Charcoal Dark** | `#1C1E1B` | Primary body typography, high-contrast dark elements |

### Macro & Functional Accents

| Purpose / Macro | Color Name | Hex Code | Visual Intent |
| :--- | :--- | :--- | :--- |
| **Protein** | Kiwi Green | `#9ABC05` | Fresh, growth-oriented highlight for muscle/protein |
| **Carbs** | Sunshine Yellow | `#FFC926` | High-energy accent for quick fuel/carbohydrates |
| **Fats** | Crisp Carrot | `#F96015` | Warm energy accent for essential fats |
| **Alert / Over Limit** | Tomato Burst | `#D52518` | Calorie overage, warnings, delete actions |
| **Water / Hydration** | Deep Matcha | `#0D3A1F` | Hydration tracking indicators and progress fills |

---

## 3. Typography Hierarchy

Calora uses bold, condensed headers inspired by modern editorial food branding paired with clean, readable sans-serif body text for quick readability during meal tracking.

*   **Display / Headings Font:** *Impact*, *Oswald*, or *Bebas Neue* (Bold, condensed uppercase for high-impact food stats and banner headers).
*   **Body & Numerical Font:** *Inter*, *Plus Jakarta Sans*, or *SF Pro Text* (High legibility for nutritional data, gram counts, and timestamps).

```
H1 / Display Title : 32px - 40px | Bold Uppercase | Forest Green (#18542A) or Charcoal (#1C1E1B)
H2 / Section Title : 20px - 24px | SemiBold       | Forest Green (#18542A)
Body / Label       : 14px - 16px | Regular        | Charcoal (#1C1E1B)
Micro / Metric Sub : 12px        | Medium         | Muted Green / Gray (#5C6B5E)
```

---

## 4. Component Styles

### Cards & Container Elements
*   **Background:** Warm Canvas (`#FAFAF5`) or Soft Cream (`#F3E8CC`) with subtle borders.
*   **Border Radius:** `16px` for main dashboard cards, `8px` for buttons and pill tags.
*   **Shadows:** Soft, natural drop shadows (`rgba(24, 84, 42, 0.08)`) to avoid harsh digital grays.

### Buttons & Interactive States
*   **Primary Action (e.g., "Log Meal", "Save"):**
    *   Background: Crisp Carrot (`#F96015`)
    *   Text: White (`#FFFFFF`) or Dark Charcoal (`#1C1E1B`)
    *   Active/Hover: Slightly deepened orange (`#E04F09`)
*   **Secondary Action:**
    *   Background: Cream Light (`#F3E8CC`)
    *   Text: Forest Green (`#18542A`)

---

## 5. Calorie & Macro Visualization (UI Patterns)

1. **Daily Calorie Ring / Gauge:**
   * **Remaining Base Track:** Soft Cream (`#F3E8CC`)
   * **Consumed Progress Fill:** Crisp Carrot (`#F96015`) transitioning to Forest Green (`#18542A`) as target is safely met.
   * **Overage State:** Tomato Burst (`#D52518`).

2. **Macro Ratio Breakdown Bars:**
   * **Protein:** `#9ABC05` (Kiwi)
   * **Carbs:** `#FFC926` (Sunshine)
   * **Fats:** `#F96015` (Carrot)

3. **Meal Cards (Breakfast, Lunch, Dinner, Snacks):**
   * Left accent tag showing meal type in Forest Green (`#18542A`).
   * Quick-add plus button styled with subtle Cream background and Crisp Carrot hover state.

---

## 6. Accessibility & Contrast Guidelines

*   **Dark Text on Light Background:** Use Charcoal (`#1C1E1B`) or Forest Green (`#18542A`) on Warm Canvas (`#FAFAF5`) to achieve WCAG AAA compliance.
*   **Accent Text:** Avoid placing Sunshine Yellow (`#FFC926`) text directly on light backgrounds; use it primarily as container fills with dark text overlay.
*   **Color + Icon Rule:** Macro indicators and calorie warnings must always pair color coding with clear icons or labels to remain accessible for colorblind users.