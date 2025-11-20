# Feature Specification: Public Partners Page & Logo Upload

**Feature Branch**: `010-public-partners-page`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Siga o workflow, vamos criar uma nova funcionalidade para o projeto, temos uma aba de parceiros onde temos parceiros cadastrados na nossa base de dados, preciso criar uma página pública com a url do sistema /parceiros para meu cliente assinantes abrir a lista de todos os parceiros rapidamente. Preciso também que ao cadastrar parceiro seja possivel subir uma logo (imagem) do perceiro no sistema e a mesma seja armazenada no próprio sistema em localhost (não sei como fazer) A página pública deve ter um layout de apresentação dos parceiros bem estilizada e moderna."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Uploads Partner Logo (Priority: P1)

As an administrator, I want to upload a logo image when registering or editing a partner so that the partner's brand is visible to subscribers.

**Why this priority**: Essential for the visual presentation of the public page. Without logos, the "modern and stylized" requirement cannot be fully met.

**Independent Test**: Can be tested by using the "Add Partner" form to upload an image and verifying the image file exists in the local storage and is linked to the partner record.

**Acceptance Scenarios**:

1. **Given** the admin is on the "Add Partner" form, **When** they select a valid image file (JPG, PNG, WebP) and submit, **Then** the partner is created and the image is saved locally.
2. **Given** an existing partner, **When** the admin edits the partner and uploads a new logo, **Then** the old logo is replaced (or updated) and the new one is displayed.
3. **Given** the admin tries to upload a non-image file, **When** they attempt to submit, **Then** the system prevents the upload and shows an error message.

---

### User Story 2 - Subscriber Views Public Partners Page (Priority: P1)

As a subscriber, I want to view a public page listing all partners so that I can quickly see who the available partners are.

**Why this priority**: This is the core value proposition requested—providing quick access to the partner list.

**Independent Test**: Can be tested by navigating to `/parceiros` in an incognito window (to ensure it's public) and verifying the list renders.

**Acceptance Scenarios**:

1. **Given** any user (authenticated or not), **When** they navigate to `/parceiros`, **Then** they see a grid/list of all active partners.
2. **Given** the partners page loads, **When** a partner has a logo, **Then** the logo is displayed prominently in the card.
3. **Given** the partners page loads, **When** viewing on a mobile device, **Then** the layout adjusts responsively (e.g., single column).

### Edge Cases

- **EC-001**: What happens if a partner does not have a logo? -> The system should display a default placeholder image or the partner's name initials.
- **EC-002**: What happens if the uploaded image is too large? -> The system should reject the upload with a clear error message (max 5MB).
- **EC-003**: What happens if the user tries to access `/parceiros` while offline? -> Standard browser offline behavior (unless PWA features are active).
## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow image file uploads (JPG, PNG, WebP) in the Partner registration/edit forms.
- **FR-002**: System MUST store uploaded images in the application's local storage and persist the reference in the partner record.
- **FR-003**: System MUST expose a public route `/parceiros` that does not require authentication.
- **FR-004**: The `/parceiros` page MUST query and display all partners marked as "active".
- **FR-005**: The partner display card MUST include the partner's logo (if available), name, and category/description.
- **FR-006**: The UI MUST use a modern grid layout with responsive design (shadcn/ui components recommended).

### Key Entities *(include if feature involves data)*

- **Partner**: Existing entity, needs a new attribute `logoUrl` (string) to store the path to the uploaded image.

### Assumptions

- The system currently has a "Partner" entity and database table.
- The hosting environment allows writing to the local filesystem (for the "localhost" storage requirement).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can successfully upload a logo image under 5MB in less than 5 seconds.
- **SC-002**: The `/parceiros` page loads and displays 20+ partners in under 1.5 seconds on a standard broadband connection.
- **SC-003**: 100% of uploaded valid images are correctly displayed on the public page.
- **SC-004**: The public page passes visual responsiveness tests on Desktop (1920px), Tablet (768px), and Mobile (375px) viewports.
