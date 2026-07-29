import os
import glob

scripts = glob.glob('scripts/apply_foolproof_mockup*.py')

for f in scripts:
    with open(f, 'r') as file:
        content = file.read()
    
    # Fix Accommodation replace
    if "content.replace('                {showAccommodation && (', rooms_header)" in content:
        content = content.replace(
            "content.replace('                {showAccommodation && (', rooms_header)", 
            "content.replace('                {/* Accommodation Section */}\\n                {showAccommodation && (', rooms_header)"
        )
    
    # Fix Flight replace
    if "content.replace('                {showFlight && (', flights_header)" in content:
        content = content.replace(
            "content.replace('                {showFlight && (', flights_header)", 
            "content.replace('                {/* Flight Section */}\\n                {showFlight && (', flights_header)"
        )

    # Fix Transfer replace
    if "content.replace('                {showTransfer && (', transfers_header)" in content:
        content = content.replace(
            "content.replace('                {showTransfer && (', transfers_header)", 
            "content.replace('                {/* Transfer Section */}\\n                {showTransfer && (', transfers_header)"
        )

    # Fix Extra Services replace
    if "content.replace('                {showExtraServices && (', extra_header)" in content:
        content = content.replace(
            "content.replace('                {showExtraServices && (', extra_header)", 
            "content.replace('                {/* Extra Services Section */}\\n                {showExtraServices && (', extra_header)"
        )

    with open(f, 'w') as file:
        file.write(content)
    
    print(f"Fixed {f}")
