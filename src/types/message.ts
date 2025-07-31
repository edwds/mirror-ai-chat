export type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; suggestedQuestions?: string[] }
  | { role: "camera-info"; content: any }
  | { role: "image-upload"; file: File; selectedAction?: string }
  | { role: "image-options"; url: string; exif?: any; selected?: string; selectedAction?: string }
  | { role: "photo-review"; content: any; imageUrl: string }
  | { role: "photo-review-summary"; content: any; imageUrl: string }
  | { role: "photo-review-details"; content: any }
  | { role: "color-analysis"; content: any; imageUrl: string }; 