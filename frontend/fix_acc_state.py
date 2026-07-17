import re
import os

filepath = 'src/app/projects/[id]/AccommodationTabOptimized.tsx'
with open(filepath, 'r') as f: content = f.read()

state_injection_acc = """
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (accommodationSearch && searchTags.length === 0) {
      setSearchTags(accommodationSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [accommodationSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        const newTags = [...searchTags, searchInput.trim()];
        setSearchTags(newTags);
        setAccommodationSearch(newTags.join(" "));
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setAccommodationSearch(newTags.join(" "));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setAccommodationSearch(newTags.join(" "));
  };
"""

content = content.replace('  const [isCollapsed, setIsCollapsed] = useState(true);', '  const [isCollapsed, setIsCollapsed] = useState(true);\n' + state_injection_acc)

with open(filepath, 'w') as f: f.write(content)

print("Done fixing state for AccommodationTabOptimized")
