# 3D Printer Integration for Toolpath Generator

This integration allows the CAD/CAM application to use the same toolpath generator interface for both milling and 3D printing operations. The implementation follows these principles:

## Key Components

1. **render3DPrinterSection.tsx**: Renders the 3D printer-specific UI and parameters
   - Now includes G-code generation capabilities
   - Has direct access to selected elements and geometry types
   - Includes a "Generate 3D Print G-code" button

2. **3DPrinterIntegration.tsx**: Manages state for 3D printer settings
   - Provides a hook `use3DPrinterSettings()` to share state between components
   - Maintains settings like infill density, pattern, support type, etc.

3. **ToolpathGenerator.tsx**: Main toolpath generation component
   - Modified to integrate with the 3D printer section
   - When machine type is '3dprinter', it conditionally renders the 3D printer section
   - Handles G-code generation for all machine types

## Implementation Changes

1. The `render3DPrinterSection` component has been enhanced to:
   - Generate G-code from selected elements or geometry
   - Include a dedicated "Generate 3D Print G-code" button
   - Pass generated G-code back to the main application

2. When the user selects machine type '3D printer', the main toolpath generator:
   - Shows the 3D printer section
   - Routes G-code generation requests to the specialized renderer
   - Maintains UI consistency with other machine types

## How to Apply These Changes

1. Add the `3DPrinterIntegration.tsx` file to the components/cam directory
2. Update `render3DPrinterSection.tsx` to include the changes
3. Import and integrate these components into `ToolpathGenerator.tsx`

## Usage

1. Select "3D Printer" from the machine type dropdown
2. Configure settings in the 3D Printer Parameters section
3. Select geometry or elements to print
4. Click "Generate 3D Print G-code" to create the G-code

The integration ensures seamless switching between different machine types while maintaining a consistent user experience.
