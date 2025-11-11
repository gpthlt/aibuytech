import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from './logger.js';

export interface UpsertImageResponse {
  image_id: string;
  status: string;
  metadata: {
    item_id: string;
    created_at: number;
  };
}

export interface RetrieveImageResponse {
  results: Array<{
    image_id: string;
    metadata: {
      item_id: string;
      created_at: number;
    };
    similarity: number;
  }>;
}

export interface ProductConstraint {
  category: string | null;
  budget: number | null;
  expression: 'Less' | 'More' | null;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  date: string;
  verified_purchase?: boolean;
}

export interface ProductForComparison {
  id: string;
  name: string;
  reviews?: Review[];
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  stock?: number;
}

/**
 * Comparison response structure matching the AI service output.
 * 
 * Example structure:
 * {
 *   product_summaries: {
 *     'Product Name': [
 *       {
 *         aspect: 'Pin',
 *         sentiment: 0.8,
 *         summary: '...',
 *         key_quotes: ['...']
 *       }
 *     ]
 *   },
 *   overall_comparison: {
 *     products: [
 *       {
 *         name: 'Product Name',
 *         pros: ['...'],
 *         cons: ['...']
 *       }
 *     ],
 *     comparison_summary: '...'
 *   },
 *   satisfaction_rates: {
 *     'Product Name': 87.0
 *   }
 * }
 */
export interface ComparisonResponse {
  product_summaries: Record<
    string,
    Array<{
      aspect: string;
      sentiment: number;
      summary: string;
      key_quotes: string[];
    }>
  >;
  overall_comparison: {
    products: Array<{
      name: string;
      pros: string[];
      cons: string[];
    }>;
    comparison_summary: string;
  };
  satisfaction_rates: Record<string, number>;
}

/**
 * Embed an image and store it in Milvus via AI service
 */
export async function upsertImage(
  imageId: string,
  imagePath: string,
  itemId: string
): Promise<UpsertImageResponse> {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Read file as buffer instead of using stream
    const imageBuffer = fs.readFileSync(imagePath);
    const filename = path.basename(imagePath);

    // Determine content type from file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.jfif': 'image/jpeg',
    };
    const contentType = contentTypeMap[ext] || 'image/jpeg';

    const formData = new FormData();
    formData.append('image_id', imageId);
    formData.append('item_id', itemId);
    formData.append('image_bytes', imageBuffer, {
      filename: filename,
      contentType: contentType,
    });

    const response = await axios.post<UpsertImageResponse>(
      `${config.aiService.url}/api/v1/upsert/`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const result = response.data;
    logger.info(`Image embedded: ${imageId} for item ${itemId}`);
    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message;
      logger.error(
        `Failed to upsert image ${imageId}: AI service error: ${error.response?.status} - ${errorMessage}`
      );
      throw new Error(`AI service error: ${error.response?.status} - ${errorMessage}`);
    }
    logger.error(`Failed to upsert image ${imageId}:`, error);
    throw error;
  }
}

/**
 * Search for similar images via AI service
 */
export async function retrieveSimilarImages(
  imagePath: string,
  topK: number = 5
): Promise<RetrieveImageResponse> {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    return retrieveSimilarImagesFromBuffer(imageBuffer, topK);
  } catch (error) {
    logger.error(`Failed to retrieve similar images:`, error);
    throw error;
  }
}

/**
 * Search for similar images from buffer (for uploaded files)
 */
export async function retrieveSimilarImagesFromBuffer(
  imageBuffer: Buffer,
  topK: number = 10
): Promise<RetrieveImageResponse> {
  try {
    const formData = new FormData();
    formData.append('image_bytes', imageBuffer, {
      filename: 'search-image.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('top_k', topK.toString());

    const response = await axios.post<RetrieveImageResponse>(
      `${config.aiService.url}/api/v1/retrieve/`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const result = response.data;
    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message;
      logger.error(
        `Failed to retrieve similar images: AI service error: ${error.response?.status} - ${errorMessage}`
      );
      throw new Error(`AI service error: ${error.response?.status} - ${errorMessage}`);
    }
    logger.error(`Failed to retrieve similar images from buffer:`, error);
    throw error;
  }
}

/**
 * Extract product constraints from natural language query
 */
export async function extractConstraints(userQuery: string): Promise<ProductConstraint> {
  try {
    const response = await axios.post<ProductConstraint>(
      `${config.aiService.url}/api/v1/constraint/`,
      {
        user_query: userQuery,
      }
    );

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message;
      logger.error(
        `Failed to extract constraints: AI service error: ${error.response?.status} - ${errorMessage}`
      );
      throw new Error(`AI service error: ${error.response?.status} - ${errorMessage}`);
    }
    logger.error(`Failed to extract constraints:`, error);
    throw error;
  }
}

/**
 * Compare products using AI service
 * 
 * Returns a complete ComparisonResponse with all fields:
 * - product_summaries: Aspect analyses for each product
 * - overall_comparison: Products comparison with pros/cons and summary
 * - satisfaction_rates: Satisfaction rate for each product
 * 
 * All fields from the AI service response are preserved without modification.
 */
export async function compareProducts(
  products: ProductForComparison[]
): Promise<ComparisonResponse> {
  try {
    const response = await axios.post<ComparisonResponse>(
      `${config.aiService.url}/api/v1/compare/`,
      {
        products: products,
      }
    );

    // Ensure all fields are present in the response
    const result = response.data;
    
    // Validate that all required fields are present
    if (!result.product_summaries || !result.overall_comparison || !result.satisfaction_rates) {
      logger.warn('Comparison response missing required fields', {
        hasProductSummaries: !!result.product_summaries,
        hasOverallComparison: !!result.overall_comparison,
        hasSatisfactionRates: !!result.satisfaction_rates,
      });
    }

    // Ensure overall_comparison has the expected structure
    if (result.overall_comparison && !result.overall_comparison.products) {
      logger.warn('overall_comparison missing products array');
    }
    if (result.overall_comparison && !result.overall_comparison.comparison_summary) {
      logger.warn('overall_comparison missing comparison_summary');
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.detail || error.message;
      logger.error(
        `Failed to compare products: AI service error: ${error.response?.status} - ${errorMessage}`
      );
      throw new Error(`AI service error: ${error.response?.status} - ${errorMessage}`);
    }
    logger.error(`Failed to compare products:`, error);
    throw error;
  }
}
