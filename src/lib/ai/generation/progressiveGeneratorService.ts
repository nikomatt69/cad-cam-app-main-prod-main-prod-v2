// src/lib/ai/generation/progressiveGeneratorService.ts

import { AIModelType, TextToCADRequest } from '@/src/types/AITypes';
import { unifiedAIService } from '../unifiedAIService';
import { Element } from '@/src/store/elementsStore';
import { v4 as uuidv4 } from 'uuid';
import { aiAnalytics } from '../ai-new/aiAnalytics';

export enum ProgressStage {
  CONCEPTUAL = 'conceptual',
  DIMENSIONAL = 'dimensional',
  DETAILING = 'detailing',
  VALIDATION = 'validation'
}

export interface ValidationResults {
  hasErrors: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  elementId: string;
  errorType: 'dimension' | 'intersection' | 'manufacturability' | 'physics';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix?: string;
}

export interface ValidationWarning {
  elementId: string;
  warningType: string;
  message: string;
  suggestedImprovement?: string;
}

export class ProgressiveGeneratorService {
  private currentStage: ProgressStage = ProgressStage.CONCEPTUAL;
  private workingDesign: Element[] = [];
  
  constructor() {}
  
  /**
   * Main method to orchestrate the progressive generation process
   */
  async generateProgressively(request: TextToCADRequest): Promise<Element[]> {
    // Track analytics for the request start
    const requestId = aiAnalytics.trackRequestStart(
      'progressive_cad_generation', 
      'claude-3-7-sonnet-20250219', 
      { description: request.description.substring(0, 100) }
    );
    
    const startTime = Date.now();
    
    try {
      // 1. Start with conceptual design
      const conceptDesign = await this.generateConceptualDesign(request);
      this.workingDesign = conceptDesign;
      
      // 2. Refine dimensions
      const dimensionalDesign = await this.refineDimensions(request, this.workingDesign);
      this.workingDesign = dimensionalDesign;
      
      // 3. Add details
      const detailedDesign = await this.addDetails(request, this.workingDesign);
      this.workingDesign = detailedDesign;
      
      // 4. Final validation
      const validatedDesign = await this.validateDesign(this.workingDesign);
      
      // Track completion
      aiAnalytics.trackRequestComplete(
        requestId,
        Date.now() - startTime,
        true,
        0, // We don't have token counts here
        0
      );
      
      return validatedDesign;
    } catch (error) {
      // Track error
      aiAnalytics.trackEvent({
        eventType: 'error',
        eventName: 'progressive_generation_error',
        errorType: error instanceof Error ? error.name : 'unknown',
        success: false,
        metadata: { requestId, message: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      // Return whatever we have so far
      return this.workingDesign.length > 0 ? this.workingDesign : [];
    }
  }
  
  /**
   * Stage 1: Generate high-level conceptual design
   */
  private async generateConceptualDesign(request: TextToCADRequest): Promise<Element[]> {
    this.currentStage = ProgressStage.CONCEPTUAL;
    
    const enhancedRequest = {
      ...request,
      description: this.buildPromptForStage(request, this.currentStage)
    };
    
    const result = await unifiedAIService.textToCADElements(enhancedRequest);
    
    if (!result.success || !result.data || !Array.isArray(result.data)) {
      throw new Error('Failed to generate conceptual design');
    }
    
    // Tag elements with stage info
    return result.data.map(element => ({
      ...element,
      stage: ProgressStage.CONCEPTUAL,
      validationStatus: 'valid'
    }));
  }
  
  /**
   * Stage 2: Refine dimensions of conceptual elements
   */
  private async refineDimensions(
    request: TextToCADRequest, 
    conceptElements: Element[]
  ): Promise<Element[]> {
    this.currentStage = ProgressStage.DIMENSIONAL;
    
    // If no elements to refine, return empty array
    if (!conceptElements.length) {
      return [];
    }
    
    const enhancedRequest = {
      ...request,
      description: this.buildPromptForStage(request, this.currentStage, conceptElements)
    };
    
    const result = await unifiedAIService.textToCADElements(enhancedRequest);
    
    if (!result.success || !result.data || !Array.isArray(result.data)) {
      // Return existing elements if refinement fails
      return conceptElements;
    }
    
    // Preserve IDs from conceptual elements where possible
    return result.data.map((element, index) => {
      // Try to find matching element from conceptual stage
      const conceptElement = conceptElements.find(ce => ce.type === element.type);
      
      return {
        ...element,
        id: conceptElement?.id || element.id || `dim_${uuidv4()}`,
        stage: ProgressStage.DIMENSIONAL,
        validationStatus: 'valid'
      };
    });
  }
  
  /**
   * Stage 3: Add detailed features to the design
   */
  private async addDetails(
    request: TextToCADRequest, 
    dimensionalElements: Element[]
  ): Promise<Element[]> {
    this.currentStage = ProgressStage.DETAILING;
    
    // If no elements to detail, return empty array
    if (!dimensionalElements.length) {
      return [];
    }
    
    const enhancedRequest = {
      ...request,
      description: this.buildPromptForStage(request, this.currentStage, dimensionalElements)
    };
    
    const result = await unifiedAIService.textToCADElements(enhancedRequest);
    
    if (!result.success || !result.data || !Array.isArray(result.data)) {
      // Return existing elements if detailing fails
      return dimensionalElements;
    }
    
    // Preserve IDs and dimensions from dimensional stage
    return result.data.map((element, index) => {
      // Try to find matching element from dimensional stage
      const dimensionalElement = dimensionalElements.find(de => 
        de.type === element.type && 
        Math.abs(de.x - element.x) < 10 && 
        Math.abs(de.y - element.y) < 10 && 
        Math.abs(de.z - element.z) < 10
      );
      
      return {
        ...element,
        id: dimensionalElement?.id || element.id || `detail_${uuidv4()}`,
        stage: ProgressStage.DETAILING,
        validationStatus: 'valid'
      };
    });
  }
  
  /**
   * Stage 4: Validate the final design
   */
  private async validateDesign(elements: Element[]): Promise<Element[]> {
    this.currentStage = ProgressStage.VALIDATION;
    
    // Skip validation if we don't have elements
    if (!elements.length) {
      return elements;
    }
    
    // Perform geometric validation
    const validationResults = this.performGeometricValidation(elements);
    
    if (validationResults.hasErrors) {
      // Fix validation issues for each element with errors
      const fixedElements = [...elements];
      
      for (const error of validationResults.errors) {
        const elementIndex = fixedElements.findIndex(el => el.id === error.elementId);
        
        if (elementIndex >= 0) {
          // Mark the element as having an error
          fixedElements[elementIndex] = {
            ...fixedElements[elementIndex],
            validationStatus: 'error',
            validationMessages: [
              ...(fixedElements[elementIndex].validationMessages || []),
              error.message
            ]
          };
          
          // Apply suggested fix if available
          if (error.suggestedFix && error.severity !== 'critical') {
            // Parse the suggested fix and apply it
            // This would depend on the actual structure of your fixes
            // For now, just mark it as fixed
            fixedElements[elementIndex].validationStatus = 'warning';
          }
        }
      }
      
      return fixedElements;
    }
    
    // Add validation stage to all elements
    return elements.map(element => ({
      ...element,
      stage: ProgressStage.VALIDATION,
      validationStatus: 'valid'
    }));
  }
  
  /**
   * Perform geometric validation on the elements
   */
  private performGeometricValidation(elements: Element[]): ValidationResults {
    // Simple validation for demonstration
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    elements.forEach(element => {
      // Check for zero dimensions
      if (element.type === 'cube' || element.type === 'rectangle') {
        if (element.width <= 0 || element.height <= 0 || (element.type === 'cube' && element.depth <= 0)) {
          errors.push({
            elementId: element.id,
            errorType: 'dimension',
            message: `${element.type} has invalid dimensions`,
            severity: 'critical'
          });
        }
      }
      
      // Check for zero or negative radius
      if (['sphere', 'cylinder', 'cone', 'torus'].includes(element.type) && element.radius <= 0) {
        errors.push({
          elementId: element.id,
          errorType: 'dimension',
          message: `${element.type} has zero or negative radius`,
          severity: 'critical'
        });
      }
      
      // Simple intersection detection (very basic)
      elements.forEach(otherElement => {
        if (element.id !== otherElement.id) {
          // Simple bounding box check for cubes/rectangles
          if ((element.type === 'cube' || element.type === 'rectangle') && 
              (otherElement.type === 'cube' || otherElement.type === 'rectangle')) {
            
            const elementBounds = {
              minX: element.x - element.width / 2,
              maxX: element.x + element.width / 2,
              minY: element.y - element.height / 2,
              maxY: element.y + element.height / 2,
              minZ: element.z - (element.depth || 0) / 2,
              maxZ: element.z + (element.depth || 0) / 2
            };
            
            const otherBounds = {
              minX: otherElement.x - otherElement.width / 2,
              maxX: otherElement.x + otherElement.width / 2,
              minY: otherElement.y - otherElement.height / 2,
              maxY: otherElement.y + otherElement.height / 2,
              minZ: otherElement.z - (otherElement.depth || 0) / 2,
              maxZ: otherElement.z + (otherElement.depth || 0) / 2
            };
            
            // Check for intersection
            if (elementBounds.minX < otherBounds.maxX && elementBounds.maxX > otherBounds.minX &&
                elementBounds.minY < otherBounds.maxY && elementBounds.maxY > otherBounds.minY &&
                elementBounds.minZ < otherBounds.maxZ && elementBounds.maxZ > otherBounds.minZ) {
              
              warnings.push({
                elementId: element.id,
                warningType: 'intersection',
                message: `${element.type} may intersect with another element`,
                suggestedImprovement: 'Consider adjusting position or dimensions to avoid intersection'
              });
            }
          }
        }
      });
    });
    
    return {
      hasErrors: errors.length > 0,
      errors,
      warnings
    };
  }
  
  /**
   * Build context-aware prompts for each generation stage
   */
  private buildPromptForStage(
    request: TextToCADRequest, 
    stage: ProgressStage, 
    currentElements?: Element[]
  ): string {
    const { description, constraints } = request;
    let prompt = '';
    
    switch (stage) {
      case ProgressStage.CONCEPTUAL:
        prompt = `Create a conceptual design for: ${description}. 
                  Focus only on identifying the main components, general structure, and layout. 
                  Do not specify exact dimensions yet. Return only the core elements and their relationships.`;
        break;
        
      case ProgressStage.DIMENSIONAL:
        prompt = `Based on this conceptual design: ${JSON.stringify(currentElements)}, 
                  add appropriate dimensions for each component. 
                  Consider standard sizes, ergonomics, and ${constraints || 'general best practices'}. 
                  Focus only on dimensions, not additional details.
                  Original description: ${description}`;
        break;
        
      case ProgressStage.DETAILING:
        prompt = `Based on this dimensional design: ${JSON.stringify(currentElements)}, 
                  add detailed features such as fillets, chamfers, textures, materials, and tolerances.
                  Consider ${constraints || 'standard manufacturing practices'} 
                  and ensure compatibility between components.
                  Original description: ${description}`;
        break;
        
      case ProgressStage.VALIDATION:
        // Generally not used as a prompt, but included for completeness
        prompt = `Validate this CAD design: ${JSON.stringify(currentElements)}
                  Check for physical validity, manufacturability, and geometric constraints.
                  Original description: ${description}`;
        break;
    }
    
    return prompt;
  }
}

// Export a singleton instance
export const progressiveGenerator = new ProgressiveGeneratorService();