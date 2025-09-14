// Editor configuration for suggestion notifications
// Add or remove emails here to manage who receives suggestion notifications

export interface EditorConfig {
  email: string
  name: string
  role: string
}

export const editors: EditorConfig[] = [
  {
    email: 'georgy.butaev@revamp-it.ch',
    name: 'Georgy Butaev',
    role: 'Primary Editor'
  }
  // Add more editors here as needed:
  // {
  //   email: 'editor2@revamp-it.ch',
  //   name: 'Editor Name',
  //   role: 'Content Editor'
  // }
]

// Helper function to get all editor emails
export function getEditorEmails(): string[] {
  return editors.map(editor => editor.email)
}

// Helper function to get all editors info
export function getAllEditors(): EditorConfig[] {
  return editors
}