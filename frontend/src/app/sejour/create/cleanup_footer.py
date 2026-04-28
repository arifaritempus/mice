import sys

def cleanup(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Find the last "Sejour Oluştur" button end
    marker = 'Sejour Oluştur'
    idx = content.rfind(marker)
    if idx == -1:
        print("Marker not found")
        return

    # Find the end of that button's parent div
    idx_div = content.find('</div>', idx)
    if idx_div == -1:
         print("Button container closing not found")
         return

    new_content = content[:idx_div + 6] # Keep the button container closing
    new_content += "\n        </div>\n" # Additional space if needed? No.
    new_content += "      </form>\n"    # Closes 683
    new_content += "      </div>\n"      # Closes 718
    new_content += "      </div>\n"      # Closes 682
    new_content += "    </div>\n"        # Closes 653
    new_content += "  );\n};\n\nexport default SejourCreatePage;\n"
    
    with open(filename, 'w') as f:
        f.write(new_content)

if __name__ == "__main__":
    cleanup(sys.argv[1])
