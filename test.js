const isGuide = (...values) => {
  return values.some(value => {
    if (!value) return false;
    const text = String(value).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
    return (text.includes('kokart') || text.includes('rehber') || text.includes('guide'));
  });
};

console.log(isGuide('test', null, undefined));
console.log(isGuide('kokart'));
