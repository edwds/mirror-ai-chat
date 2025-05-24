export type Message =
  | { role: "user" | "assistant"; content: string }
  | { role: "camera-info"; content: any }
  | { role: "image-upload"; file: File }
  | { role: "image-options"; url: string; selected?: string }; 