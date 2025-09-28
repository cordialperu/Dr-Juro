# Dr. Juro Legal Platform Design Guidelines

## Design Approach
**System-Based Approach**: Using a refined legal-professional design system inspired by enterprise productivity tools (Linear, Notion) with specialized legal interface patterns. This utility-focused approach prioritizes efficiency, data density, and professional credibility over visual flair.

## Core Design Elements

### Color Palette
**Dark Mode Primary** (Default):
- Background: 220 15% 8% (Deep charcoal)
- Surface: 220 12% 12% (Elevated surfaces)
- Text Primary: 0 0% 95% (Near white)
- Text Secondary: 220 5% 65% (Muted gray)
- Accent: 210 100% 60% (Professional blue)
- Success: 142 76% 36% (Legal green)
- Warning: 38 92% 50% (Alert amber)
- Error: 0 84% 60% (Critical red)

**Light Mode**:
- Background: 0 0% 98% (Clean white)
- Surface: 220 15% 96% (Subtle gray)
- Text Primary: 220 20% 15% (Deep charcoal)
- Text Secondary: 220 10% 45% (Medium gray)

### Typography
- **Primary**: Inter (professional, highly legible)
- **Legal Documents**: Source Serif Pro (traditional, authoritative)
- Hierarchy: Display (32px), H1 (24px), H2 (20px), Body (16px), Caption (14px)

### Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 for consistent rhythm
- Sidebar: Fixed 280px width
- Main content: Max-width 1200px with 8-unit padding
- Cards: 6-unit padding, 2-unit border radius
- Tight spacing for data-dense tables and forms

### Component Library

#### Navigation
- **Sidebar**: Dark theme with grouped sections (Dashboard, Cases, Legal Research, etc.)
- **Topbar**: Breadcrumbs, search, user profile, notifications
- **Legal Status Indicators**: Visual hierarchy for binding precedents (🏛️), uniform jurisprudence (✔️)

#### Data Display
- **Case Cards**: Compact with status badges, client info, key dates
- **Precedent Lists**: Tabular with sortable columns (tribunal, date, relevance score)
- **Legal Article References**: Inline citations with hover previews
- **AI Confidence Scores**: Progress bars with color coding

#### Forms & Inputs
- **Case Creation**: Multi-step wizard with auto-save
- **Search Filters**: Collapsible panels with checkbox groups
- **Document Upload**: Drag-and-drop zones with OCR status

#### Legal-Specific Components
- **Timeline View**: Case activity with legal milestone markers
- **Precedent Comparison**: Side-by-side analysis panels
- **Citation Generator**: One-click formatted legal references
- **Compliance Dashboard**: Privacy law adherence tracking

#### Overlays
- **AI Analysis Modal**: Full-screen with confidence explanations
- **Document Viewer**: PDF integration with annotation tools
- **Quick Actions**: Command palette for power users

### Key UX Patterns
- **Information Density**: Prioritize screen real estate for legal data
- **Quick Access**: Keyboard shortcuts and command palette
- **Audit Trail**: Subtle activity indicators throughout
- **Professional Hierarchy**: Clear visual ranking for legal precedent importance
- **Batch Operations**: Multi-select for case and document management

### Accessibility
- High contrast ratios for extended reading sessions
- Focus indicators for keyboard navigation
- Screen reader optimization for legal document structure
- Consistent dark mode implementation across all components

This design system emphasizes professional credibility, information efficiency, and the specialized needs of legal professionals while maintaining modern web standards.