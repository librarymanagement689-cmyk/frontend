// =============================================================================
// Models — Sri Krishna Lending Library Frontend & Backend Data Contracts
// =============================================================================

export interface Book {
  id: string;             // Maps to backend book_id (e.g. LIB-00001)
  book_id?: string;        // Explicit backend field name
  title: string;
  author?: string;
  price?: number;
  category?: string;
  language?: string;
  status?: string;         // 'available' | 'borrowed'
  available: boolean;
  publish_on_website?: boolean;
  imageUrl?: string;
  image_url?: string;
  description?: string;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  // Series / multi-volume fields
  series_name?: string;
  volume_number?: string;
  total_volumes?: string;
  part_or_volume?: string;
}

export interface BackendBook {
  book_id: string;
  serial_number: string;
  title: string;
  author: string;
  price: number;
  category: string;
  language: string;
  status: 'available' | 'borrowed' | string;
  publish_on_website: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Series / multi-volume fields
  series_name?: string;
  volume_number?: string;
  total_volumes?: string;
  part_or_volume?: string;
}

export interface BookPaginatedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: BackendBook[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;

  // Backend category fields
  category_id?: string;
  book_count?: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CategoryPaginatedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Category[];
}

export interface BookFilter {
  query?: string;
  category?: string;
  language?: string;
  availability?: 'all' | 'available' | 'unavailable';
}

// =============================================================================
// Series / Grouped Catalog Types (Public Website)
// =============================================================================

/** A single volume within a series collection */
export interface SeriesVolume {
  book_id: string;
  title: string;
  volume_number?: string;
  part_or_volume?: string;
  status: string;
  available: boolean;
  image_url?: string;
  price?: number;
}

/** A series/collection group on the public catalog */
export interface SeriesGroup {
  type: 'series';

  series_name: string;

  total_volumes: number;

  available_count: number;

  borrowed_count: number;

  category?: string | null;

  language?: string | null;

  author?: string | null;

  image_url?: string | null;

  /**
   * Public availability message for multi-part collections.
   *
   * Example:
   * "All parts available, for availability and lending
   * details, please contact us directly."
   */
  availability_message?: string;

  /**
   * Kept optional for backwards compatibility.
   *
   * The public /catalog endpoint no longer needs to return
   * individual volumes, but existing frontend code/types
   * may still reference this property.
   */
  volumes?: SeriesVolume[];
}

/** A standalone book entry on the public catalog */
export interface StandaloneBook {
  type: 'book';
  book_id: string;
  title: string;
  author?: string;
  category?: string;
  language?: string;
  status: string;
  available: boolean;
  image_url?: string;
  price?: number;
  part_or_volume?: string;
}

/** Union type for catalog items (series group OR standalone book) */
export type CatalogItem = SeriesGroup | StandaloneBook;

/** Response from GET /api/books/catalog */
export interface CatalogResponse {
  total: number;
  series_count: number;
  standalone_count: number;
  items: CatalogItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// --- Member Models ---
export interface Member {
  member_id: string;     // MEM-00001
  name: string;
  phone: string;
  email: string;
  subscription_type_id: string;
  subscription_start_date: string;
  subscription_end_date: string;
  status: 'active' | 'inactive' | 'expired' | string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberCreate {
  name: string;
  phone: string;
  email: string;
  subscription_type_id: string;
  subscription_start_date: string;
  subscription_end_date: string;
  status?: 'active' | 'inactive' | 'expired';
}

export interface MemberPaginatedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Member[];
}

// --- Subscription Models ---
export interface Subscription {
  subscription_id: string; // SUB-00001
  name: string;
  description?: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionCreate {
  name: string;
  description?: string;
  duration_days: number;
  price: number;
  is_active?: boolean;
}

// --- Lending Order Models ---
export interface OrderItem {
  book_id: string;
  title: string;
  price: number;              // Actual/master book price
  lending_amount: number;     // Amount manually entered for lending
  returned: boolean;
  returned_date?: string;
}

export interface Order {
  order_id: string;     // ORD-00001
  member_id: string;
  items: OrderItem[];
  borrowed_date: string;
  due_date: string;
  returned_date?: string;
  subtotal: number;
  amount_paid: number;
  status: 'active' | 'returned' | 'overdue' | 'cancelled' | string;
  reminder_sent: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderCreateItem {
  book_id: string;
  lending_amount: number;
}

export interface OrderCreate {
  member_id: string;
  items: OrderCreateItem[];
  borrowed_date: string;
  due_date: string;
  amount_paid: number;
}

export interface OrderPaginatedResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Order[];
}

// --- Dashboard Stats Model ---
export interface DashboardStats {
  total_books: number;
  available_books: number;
  borrowed_books: number;
  published_books: number;
  total_members: number;
  active_orders: number;
  overdue_orders: number;
  today_orders_count: number;
  today_collection: number;
  monthly_collection: number;
}
