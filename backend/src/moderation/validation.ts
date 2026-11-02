export function cleanText(value: unknown, max: number, min = 1) {
  if (typeof value !== "string") return null;
  const text = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (
    [...text].length < min ||
    [...text].length > max ||
    /[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(text)
  )
    return null;
  if (/(?:^|[^\p{L}\p{N}])(địt|đụ|fuck|shit)(?=$|[^\p{L}\p{N}])/iu.test(text))
    return null;
  return text;
}
