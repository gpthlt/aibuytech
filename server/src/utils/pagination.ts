export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getPaginationParams = (
  page?: string | number,
  limit?: string | number
): { page: number; limit: number; skip: number } => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Generic pagination helper
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: any;
}

export const paginate = async <T>(
  Model: any,
  filter: any = {},
  options: PaginationOptions,
  select: any = {},
  populate: any[] = []
): Promise<PaginationResult<T>> => {
  const { page, limit, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  let query = Model.find(filter).select(select).sort(sort).skip(skip).limit(limit);

  // Apply populate if provided
  if (populate.length > 0) {
    populate.forEach((pop) => {
      query = query.populate(pop);
    });
  }

  const [data, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);

  return createPaginationResult(data, total, page, limit);
};
