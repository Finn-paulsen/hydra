export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
}

export type ViewMode = 'grid' | 'list' | 'details';
export type CreateItemType = 'file' | 'folder';
