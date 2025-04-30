#!/bin/bash

# Apply 3D Printer Integration to CAD/CAM Application
# This script applies all the changes needed for the integration

echo "Applying 3D Printer Integration..."

# Check if patch command is available
if ! command -v patch &> /dev/null
then
    echo "The 'patch' command is not available. Please install it or apply changes manually."
    exit 1
fi

# Apply patch to ToolpathGenerator.tsx
echo "Applying patch to ToolpathGenerator.tsx..."
patch -p0 < ./src/components/cam/ToolpathGenerator.patch
if [ $? -ne 0 ]; then
    echo "Failed to apply patch to ToolpathGenerator.tsx"
    echo "You may need to apply changes manually. See ToolpathGenerator.patch for details."
else
    echo "Successfully applied patch to ToolpathGenerator.tsx"
fi

# Check if all required files exist
echo "Verifying required files..."
FILES=(
    "./src/components/cam/render3DPrinterSection.tsx"
    "./src/components/cam/3DPrinterToolpathHelpers.tsx"
    "./src/components/cam/3DPrinterIntegration.tsx"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: Required file $file not found!"
        exit 1
    fi
done

echo "All required files are present."
echo "Integration complete! You can now use 3D printer functionality in the toolpath generator."
echo "Select '3D Printer' from the machine type dropdown to access the new features."
