// LandingPage is just FolderPage at the root level (folder_id undefined
// -> backend treats it as "top of tree"). Kept as a separate file to
// match the design doc's page list; it simply re-exports FolderPage so
// there's a single source of truth for the browse UI.
export { default } from "./FolderPage.jsx";
