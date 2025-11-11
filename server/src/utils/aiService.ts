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

    return response.data;
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
