# 3D Printer Integration Guide for CAD/CAM Application

This integration adds full 3D printer support to your CAD/CAM application, allowing users to generate G-code for 3D printing with all the necessary settings and options, similar to the existing mill functionality.

## Features Added

- **Machine Type Selection**: 3D printer is fully integrated as a machine type option
- **3D Printer Parameters Section**: Comprehensive UI for all 3D printer settings
- **Print Preview**: Visual representation of how the model will be printed
- **G-code Generation**: Specialized 3D printer G-code generation
- **Print Statistics**: Time and material usage estimations

## Files Created/Modified

1. **render3DPrinterSection.tsx** (updated)
   - Added G-code generation capability
   - Added "Generate 3D Print G-code" button
   - Full integration with the toolpath generator

2. **3DPrinterToolpathHelpers.tsx** (created)
   - Helper functions for generating 3D printer G-code
   - Model dimension extraction
   - Print time and material estimations
   - Support for different geometric shapes

3. **3DPrinterIntegration.tsx** (created)
   - State management for 3D printer settings
   - Hooks for consistent state across components

4. **ToolpathGenerator.tsx** (updated via patch)
   - Added imports for 3D printer components
   - Added state using 3D printer settings hooks
   - Added rendering of 3D printer section when 3D printer is selected
   - Modified G-code generation to handle 3D printer cases

## How to Apply the Changes

### Option 1: Automatic (Recommended)

Run the provided shell script to apply all changes:

```bash
chmod +x apply_3d_printer_integration.sh
./apply_3d_printer_integration.sh
```

### Option 2: Manual

1. Copy the new files to their respective locations:
   - `3DPrinterToolpathHelpers.tsx` to `src/components/cam/`
   - `3DPrinterIntegration.tsx` to `src/components/cam/`

2. Replace `render3DPrinterSection.tsx` with the updated version

3. Apply the changes to `ToolpathGenerator.tsx` as outlined in `ToolpathGenerator.patch`

## How It Works

1. When the user selects "3D Printer" as the machine type, the specialized 3D printer section is rendered
2. The user can configure all 3D printing parameters (layer height, infill, support, etc.)
3. The preview shows how the model will be printed
4. The user clicks "Generate 3D Print G-code" to create G-code specifically for 3D printing
5. The G-code is then passed back to the main application through the `onGCodeGenerated` callback

## Customization

You can modify the following files to customize the integration:

- `3DPrinterToolpathHelpers.tsx`: Modify G-code generation algorithms
- `render3DPrinterSection.tsx`: Change UI layout and settings
- `3DPrinterIntegration.tsx`: Add more state variables for additional settings

## Testing

After applying the changes:

1. Select "3D Printer" from the machine type dropdown
2. Configure parameters in the 3D Printer Parameters section
3. Select a geometry or element
4. Click "Generate 3D Print G-code"
5. Verify that the generated G-code contains appropriate 3D printer commands

## Troubleshooting

- If the patch fails to apply, you may need to manually edit the ToolpathGenerator.tsx file
- Make sure all imports at the top of ToolpathGenerator.tsx include the new components
- Check that the 3D printer section is rendered when machine type is '3dprinter'
- Verify that the 3D printer settings hooks are correctly used in ToolpathGenerator.tsx
