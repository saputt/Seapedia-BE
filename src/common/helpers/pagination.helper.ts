/**
 * Helper untuk pagination.
 * Menyediakan utilitas untuk menghitung skip, limit, dan metadata pagination.
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

/**
 * Menghitung skip dan take dari page dan limit.
 */
export function getPaginationParams(page = 1, limit = 10): { skip: number; take: number } {
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(100, limit));
    return {
        skip: (validPage - 1) * validLimit,
        take: validLimit,
    };
}

/**
 * Membuat metadata pagination.
 */
export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Membuat response pagination.
 */
export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    return {
        data,
        meta: createPaginationMeta(total, page, limit),
    };
}
