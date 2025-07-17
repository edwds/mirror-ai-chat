export type Message =
  | { role: "user" | "assistant"; content: string }
  | { role: "camera-info"; content: any }
  | { role: "image-upload"; file: File }
  | { role: "image-options"; url: string; exif?: any; selected?: string }
  | { role: "photo-review"; content: any; imageUrl: string }
  | { role: "photo-review-summary"; content: any; imageUrl: string }
  | { role: "photo-review-details"; content: any }
  | { role: "color-analysis"; content: any; imageUrl: string }; 