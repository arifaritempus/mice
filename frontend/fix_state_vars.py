import re
import os

state_injection_transfer = """
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (transferSearch && searchTags.length === 0) {
      setSearchTags(transferSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [transferSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        const newTags = [...searchTags, searchInput.trim()];
        setSearchTags(newTags);
        setTransferSearch(newTags.join(" "));
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setTransferSearch(newTags.join(" "));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setTransferSearch(newTags.join(" "));
  };
"""

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

# Fix TransferTurTab.tsx
filepath = 'src/app/projects/[id]/TransferTurTab.tsx'
with open(filepath, 'r') as f: content = f.read()
if "const [searchTags" not in content:
    content = content.replace('  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());', '  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());\n' + state_injection_transfer)
    with open(filepath, 'w') as f: f.write(content)

# Fix AccommodationTabOptimized.tsx
filepath = 'src/app/projects/[id]/AccommodationTabOptimized.tsx'
with open(filepath, 'r') as f: content = f.read()
if "const [searchTags" not in content:
    # Need to make sure useState and useEffect are imported in AccommodationTabOptimized
    if "import { useState, useEffect" not in content and "import React" not in content:
        # Assuming React is imported, let's use React.useState and React.useEffect
        state_injection_acc = state_injection_acc.replace('useState', 'React.useState').replace('useEffect', 'React.useEffect')
    
    content = content.replace('  const [isAllExpanded, setIsAllExpanded] = React.useState(false);', '  const [isAllExpanded, setIsAllExpanded] = React.useState(false);\n' + state_injection_acc)
    with open(filepath, 'w') as f: f.write(content)

print("Done fixing state variables")
