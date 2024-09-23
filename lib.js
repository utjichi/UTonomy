exports.toArray = (value) =>
  value ? (Array.isArray(value) ? value : [value]) : [];