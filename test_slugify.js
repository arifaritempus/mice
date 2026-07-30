function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "_")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
console.log(slugify("Süper Admin Test-Role 123"));
