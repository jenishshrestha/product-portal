# Product Portal Requirements

## 1. User Roles & Authentication

- Create a Login Screen that utilizes hardcoded user credentials.
- **Basic User Profile:** Logs in using `user@experteducation.com`. This user role must have access to all system features except the ability to delete items. Include a "Disable" toggle for this user; disabled products should be hidden from the Product Portal and CRM UI, but backend functionalities dependent on them must visually indicate they continue working.
- **Superadmin Profile:** Logs in using `superadmin@experteducationc.com`. This user role must have unrestricted access to all system features, including deletion.

## 2. Main Product Listing Dashboard

- Design a central Product Listing Screen that displays various educational courses (e.g., MBA, B Sc Engineering, BBA in Finance, Certificate 3 in Electrical Engineering).
- Include a prominent search bar equipped with a "Clear search" function.
- Implement a sidebar or dropdown filtering system allowing users to filter products by: Country, Institution, Study area, Study level, and Fees.
- Design a "Bulk actions" selection mechanism (like checkboxes) for managing multiple products at once.
- Within bulk actions, include a "Bulk edit" option visible to all authenticated users.
- Within bulk actions, include a "Bulk delete" option _only_ to the Superadmin, which must trigger a modal requiring the user to type "DELETE" to confirm.

## 3. Product Management Screens

- **Product Detailed/Editing Screen:** Design a view for managing individual product attributes.
- On the editing screen, users must be able to add and delete branch locations (e.g., Sydney, Kathmandu), but the UI must prevent them from modifying the names of existing branches.
- Include a single-item Delete button that triggers a "DELETE" typing confirmation modal.
- Design dedicated, clean screens for the addition of new products and the deletion of existing ones.

## 4. Data Import & Export Interfaces

- Design dedicated Import and Export screens.
- The Export interface must allow users to apply the previously mentioned filters (Country, Institution, etc.) before exporting the data.
- The Import interface must support uploading multiple products simultaneously via CSV or JSON file formats.

## 5. Backend Data Display Rules (JSON Context)

- When mocking up entry requirements data (specifically referencing Massey University), ensure the UI reflects that CAEL and OET exams are not recognized and should not be displayed.
- For undergraduate courses (like BBus), display language requirements for both CAE/C1 Advanced and CPE/C2 Proficiency as requiring a 169 overall score.
- Ensure the minimum band requirement for these tests is displayed as 162 in _each skill_, rather than just reading/English.
- Reserve the display of a 176 score for CPE / C2 Proficiency strictly for postgraduate course mockups.

## Out of Scope for Current Prototype

- _Do not_ include UI elements for history retention, scraping change logs, or change management screens.
- _Do not_ include conceptual features such as free counseling modules (manual or AI), cost estimators, or lifepath planners encompassing pre-admission to post-admission timelines.
