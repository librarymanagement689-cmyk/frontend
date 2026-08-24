import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminBookService, BookCreatePayload, BookUpdatePayload, CSVImportSummaryResponse } from '../../../services/admin-book.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';
import { transliterate } from '@piraisoodan/tanglish';
import { BackendBook, Category } from '../../../models/book.model';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  ImageTransform
} from 'ngx-image-cropper';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './admin-books.component.html',
  styleUrls: ['./admin-books.component.scss']
})
export class AdminBooksComponent implements OnInit {
  private adminBookService = inject(AdminBookService);
  private errorService = inject(ErrorService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  books = signal<BackendBook[]>([]);
  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = 1;
  pageSize = 15;

  // Tamil transliteration state
  // Tamil transliteration state
  tamilTypingTitle = false;
  tamilTypingAuthor = false;

  isExportModalOpen = false;


  // Filters & Sort
  // Filters & Sort
  searchQuery = '';
  selectedSerialNumber = '';
  selectedAuthor = '';
  selectedCategory = '';
  selectedLanguage = '';
  selectedStatus = '';
  selectedPublish: string = '';
  sortBy = 'created_at';
  sortOrder = 'desc';

  isLoading = signal(true);

  selectedImageFile: File | null = null;

  exportFields: Record<string, boolean> = {
    book_id: true,
    serial_number: true,
    title: true,
    author: true,
    author_alias: true,
    price: true,
    category: true,
    language: true,
    part_or_volume: true,
    series_name: true,
    volume_number: true,
    total_volumes: true,
    status: true,
    publish_on_website: true,
    image_url: true,
    created_at: true,
    updated_at: true
  };

  exportFieldLabels: Record<string, string> = {
    book_id: 'Book ID',
    serial_number: 'Serial Number',
    title: 'Book Name',
    author: 'Author',
    author_alias: 'Author Alias',
    price: 'Price',
    category: 'Category',
    language: 'Language',
    part_or_volume: 'Part / Volume',
    series_name: 'Series Name',
    volume_number: 'Volume Number',
    total_volumes: 'Total Volumes',
    status: 'Status',
    publish_on_website: 'Publish on Website',
    image_url: 'Image URL',
    created_at: 'Created At',
    updated_at: 'Updated At'
  };

  // Modal State - Add / Edit Book
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingBookId = signal<string | null>(null);
  isUploadingCover = signal(false);

  // Image editor state
  isImageEditorOpen = signal(false);
  // imageChangedEvent: Event | null = null;
  croppedImageBlob: Blob | null = null;
  croppedImageUrl = signal<string | null>(null);
  selectedImageName = signal('');
  imageTransform: ImageTransform = {
    rotate: 0,
    scale: 1,
    flipH: false,
    flipV: false
  };

  // Form Model
  bookForm: BookCreatePayload = {
    serial_number: '',
    title: '',
    author: '',
    author_alias: '',
    price: 0,
    category: 'Fiction',
    language: 'English',
    publish_on_website: true,
    image_url: ''
  };

  categories = signal<Category[]>([]);
  languages = ['English', 'Tamil', 'Kannada', 'Hindi', 'Sanskrit', 'Telugu'];

  // Modal State - Book Details & History
  isDetailsModalOpen = signal(false);
  selectedBookDetails = signal<any>(null);
  isLoadingDetails = signal(false);

  // Modal State - Multi-step CSV Import
  isCSVModalOpen = signal(false);
  csvStep = signal<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Errors, 3: Duplicates & Confirm
  selectedCSVFile: File | null = null;
  csvSummary = signal<CSVImportSummaryResponse | null>(null);
  isAnalyzingCSV = signal(false);
  potentialDuplicates = signal<Array<{ csvRow: any; existingBook: any }>>([]);

  ngOnInit(): void {
    this.loadCategories();
    this.loadBooks();
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        this.categories.set(res.items);
      },
      error: (err) => {
        this.toastService.error(
          this.errorService.getErrorMessage(err)
        );
      }
    });
  }


  openExportModal(): void {
    this.isExportModalOpen = true;
  }

  closeExportModal(): void {
    this.isExportModalOpen = false;
  }

  selectAllExportFields(): void {
    Object.keys(this.exportFields).forEach(key => {
      this.exportFields[key as keyof typeof this.exportFields] = true;
    });
  }

  clearAllExportFields(): void {
    Object.keys(this.exportFields).forEach(key => {
      this.exportFields[key as keyof typeof this.exportFields] = false;
    });
  }

  exportCSV(): void {
    const fields = Object.entries(this.exportFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    if (fields.length === 0) {
      this.toastService.error('Select at least one field to export.');
      return;
    }

    const publishBool =
      this.selectedPublish === 'true'
        ? true
        : this.selectedPublish === 'false'
          ? false
          : undefined;

    this.adminBookService.exportBooksCSV(
      fields,
      this.searchQuery,
      this.selectedAuthor,
      this.selectedSerialNumber,
      this.selectedCategory,
      this.selectedLanguage,
      this.selectedStatus,
      publishBool
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'library_books.csv';
        link.click();

        window.URL.revokeObjectURL(url);

        this.closeExportModal();

        this.toastService.success('CSV exported successfully.');
      },
      error: (err) => {
        this.toastService.error(
          this.errorService.getErrorMessage(err)
        );
      }
    });
  }


  /* toggle tamil */

  onTamilKeydown(
    event: KeyboardEvent,
    field: 'title' | 'author'
  ): void {
    if (this.bookForm.language !== 'Tamil') {
      return;
    }

    if (!this.isTamilTypingEnabled(field)) {
      return;
    }

    // Transliterate only when SPACE is pressed
    if (event.key !== ' ') {
      return;
    }

    const input = event.target as HTMLInputElement;

    const cursorPosition = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? cursorPosition;

    // Don't interfere when text is selected
    if (cursorPosition !== selectionEnd) {
      return;
    }

    const currentValue =
      field === 'title'
        ? this.bookForm.title
        : this.bookForm.author;

    const textBeforeCursor =
      currentValue.substring(0, cursorPosition);

    const lastSpace =
      textBeforeCursor.lastIndexOf(' ');

    const wordStart = lastSpace + 1;

    const currentWord =
      textBeforeCursor.substring(wordStart);

    // Nothing to convert
    if (!currentWord.trim()) {
      return;
    }

    // Only process English/Tanglish words
    if (!/[a-zA-Z]/.test(currentWord)) {
      return;
    }

    const tamilWord = transliterate(currentWord);

    // If no conversion happened, allow normal space
    if (!tamilWord || tamilWord === currentWord) {
      return;
    }

    event.preventDefault();

    const beforeWord =
      currentValue.substring(0, wordStart);

    const afterCursor =
      currentValue.substring(cursorPosition);

    const finalValue =
      beforeWord +
      tamilWord +
      ' ' +
      afterCursor;

    if (field === 'title') {
      this.bookForm.title = finalValue;
    } else {
      this.bookForm.author = finalValue;
    }

    requestAnimationFrame(() => {
      const newCursorPosition =
        beforeWord.length +
        tamilWord.length +
        1;

      input.focus();

      input.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
    });
  }

  /* Tamil transliteration */

  toggleTamilTyping(field: 'title' | 'author'): void {
    if (this.bookForm.language !== 'Tamil') {
      return;
    }

    if (field === 'title') {
      this.tamilTypingTitle = !this.tamilTypingTitle;
    } else {
      this.tamilTypingAuthor = !this.tamilTypingAuthor;
    }
  }

  isTamilTypingEnabled(field: 'title' | 'author'): boolean {
    return field === 'title'
      ? this.tamilTypingTitle
      : this.tamilTypingAuthor;
  }




  loadBooks(page = 1): void {
    this.currentPage = page;
    this.isLoading.set(true);

    const publishBool = this.selectedPublish === 'true' ? true : (this.selectedPublish === 'false' ? false : undefined);

    this.adminBookService.getBooks(
      this.searchQuery,
      this.selectedCategory,
      this.selectedLanguage,
      this.selectedStatus,
      publishBool,
      this.currentPage,
      this.pageSize,
      this.selectedSerialNumber,
      this.selectedAuthor
    ).subscribe({
      next: (res) => {
        this.books.set(res.items);
        this.totalCount.set(res.total);
        this.totalPages.set(res.total_pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  onSearch(): void {
    this.loadBooks(1);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingBookId.set(null);
    this.tamilTypingTitle = false;
    this.tamilTypingAuthor = false;
    this.bookForm = {
      serial_number: '',
      title: '',
      author: '',
      author_alias: '',
      price: 150,
      category: this.categories()[0]?.name || '',
      language: 'English',
      publish_on_website: true,
      image_url: ''
    };
    this.isModalOpen.set(true);
  }

  openEditModal(book: BackendBook): void {
    this.isEditing.set(true);
    this.editingBookId.set(book.book_id);
    this.tamilTypingTitle = false;
    this.tamilTypingAuthor = false;
    this.bookForm = {
      serial_number: book.serial_number,
      title: book.title,
      author: book.author,
      author_alias: book.author_alias || '',
      price: book.price,
      category: book.category,
      language: book.language === 'தமிழ்' ? 'Tamil' : book.language,
      publish_on_website: book.publish_on_website,
      image_url: book.image_url || ''
    };

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  // Cover Image Handlers
  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      this.toastService.error(
        'Invalid image format. Please select JPG, PNG, or WebP.'
      );
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error(
        'Image is too large. Maximum source image size is 10 MB.'
      );
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.selectedImageName.set(file.name);

    this.croppedImageBlob = null;
    this.croppedImageUrl.set(null);

    this.imageTransform = {
      rotate: 0,
      scale: 1,
      flipH: false,
      flipV: false
    };

    this.isImageEditorOpen.set(true);

    input.value = '';
  }

  removeCoverImage(): void {
    if (!confirm('Are you sure you want to remove the cover image for this book?')) return;

    if (this.isEditing() && this.editingBookId()) {
      this.adminBookService.removeCoverImage(this.editingBookId()!).subscribe({
        next: () => {
          this.bookForm.image_url = '';
          this.toastService.success('Cover image removed.');
          this.loadBooks(this.currentPage);
        },
        error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
      });
    } else {
      this.bookForm.image_url = '';
      this.toastService.success('Cover image removed from form.');
    }
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (!event.blob) {
      return;
    }

    this.croppedImageBlob = event.blob;

    if (event.objectUrl) {
      this.croppedImageUrl.set(event.objectUrl);
    }
  }

  rotateLeft(): void {
    this.imageTransform = {
      ...this.imageTransform,
      rotate: (this.imageTransform.rotate ?? 0) - 90
    };
  }

  rotateRight(): void {
    this.imageTransform = {
      ...this.imageTransform,
      rotate: (this.imageTransform.rotate ?? 0) + 90
    };
  }

  resetImageEditor(): void {
    this.imageTransform = {
      rotate: 0,
      scale: 1,
      flipH: false,
      flipV: false
    };

    this.croppedImageBlob = null;

    const oldUrl = this.croppedImageUrl();
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    this.croppedImageUrl.set(null);
  }

  closeImageEditor(): void {
    const oldUrl = this.croppedImageUrl();

    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    this.isImageEditorOpen.set(false);
    this.selectedImageFile = null;
    this.croppedImageBlob = null;
    this.croppedImageUrl.set(null);
    this.selectedImageName.set('');
  }

  onCropperLoadFailed(): void {
    this.toastService.error(
      'Unable to load this image. Please try another image.'
    );

    this.closeImageEditor();
  }

  private async optimizeImage(blob: Blob): Promise<File> {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: 'from-image'
    });

    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1800;

    let width = bitmap.width;
    let height = bitmap.height;

    const scale = Math.min(
      1,
      MAX_WIDTH / width,
      MAX_HEIGHT / height
    );

    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      bitmap.close();
      throw new Error('Unable to process image.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      bitmap,
      0,
      0,
      width,
      height
    );

    bitmap.close();

    const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to optimize image.'));
          }
        },
        'image/webp',
        0.82
      );
    });

    const baseName = this.selectedImageName()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();

    return new File(
      [optimizedBlob],
      `${baseName || 'book-cover'}.webp`,
      {
        type: 'image/webp',
        lastModified: Date.now()
      }
    );
  }

  async useEditedImage(): Promise<void> {
    if (!this.croppedImageBlob) {
      this.toastService.error(
        'Please crop the image before continuing.'
      );
      return;
    }

    // This workflow is specifically for an existing book.
    if (!this.editingBookId()) {
      this.toastService.error(
        'Please save the book first before uploading its cover image.'
      );
      return;
    }

    try {
      this.isUploadingCover.set(true);

      // 1. Optimize the cropped image
      const optimizedFile = await this.optimizeImage(
        this.croppedImageBlob
      );

      // 2. Upload optimized image to R2
      this.adminBookService
        .uploadCoverImage(optimizedFile)
        .subscribe({
          next: (res) => {

            // 3. Immediately save the returned R2 URL to MongoDB
            this.adminBookService.updateBook(this.editingBookId()!, {
              image_url: res.image_url
            })
              .subscribe({
                next: (updatedBook) => {

                  // 4. Update the current form
                  this.bookForm.image_url =
                    updatedBook.image_url || res.image_url;

                  this.isUploadingCover.set(false);

                  this.toastService.success(
                    'Book cover uploaded and saved successfully.'
                  );

                  // 5. Close editor
                  this.closeImageEditor();

                  // 6. Refresh the admin book list
                  this.loadBooks();

                },

                error: (err) => {
                  this.isUploadingCover.set(false);

                  this.toastService.error(
                    'Image uploaded, but the book record could not be updated.'
                  );

                  console.error(
                    'MongoDB image_url update failed:',
                    err
                  );
                }
              });
          },

          error: (err) => {
            this.isUploadingCover.set(false);

            this.toastService.error(
              this.errorService.getErrorMessage(err)
            );

            console.error(
              'R2 image upload failed:',
              err
            );
          }
        });

    } catch (error) {

      this.isUploadingCover.set(false);

      console.error(
        'Image optimization failed:',
        error
      );

      this.toastService.error(
        'Unable to process the image. Please try another image.'
      );
    }
  }


  zoomOut(): void {
    const currentScale = this.imageTransform.scale ?? 1;

    this.imageTransform = {
      ...this.imageTransform,
      scale: Math.max(0.5, currentScale - 0.1)
    };
  }

  zoomIn(): void {
    const currentScale = this.imageTransform.scale ?? 1;

    this.imageTransform = {
      ...this.imageTransform,
      scale: Math.min(3, currentScale + 0.1)
    };
  }

  saveBook(): void {
    if (
      !String(this.bookForm.serial_number ?? '').trim() ||
      !this.bookForm.title?.trim() ||
      !this.bookForm.author?.trim() ||
      this.bookForm.price < 0
    ) {
      this.toastService.error('Please enter valid Title, Author, and Price.');
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing() && this.editingBookId()) {
      const payload: BookUpdatePayload = {
        serial_number: String(this.bookForm.serial_number ?? '').trim(),
        title: this.bookForm.title,
        author: this.bookForm.author,
        author_alias: this.bookForm.author_alias,
        price: this.bookForm.price,
        category: this.bookForm.category,
        language: this.bookForm.language,
        publish_on_website: this.bookForm.publish_on_website,
        image_url: this.bookForm.image_url || null
      };

      this.adminBookService.updateBook(this.editingBookId()!, payload).subscribe({
        next: (updated) => {
          this.toastService.success(`Book ${updated.book_id} updated successfully.`);
          this.closeModal();
          this.loadBooks(this.currentPage);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.error(this.errorService.getErrorMessage(err));
        }
      });
    } else {
      const payload: BookCreatePayload = {
        ...this.bookForm,
        serial_number: String(this.bookForm.serial_number ?? '').trim()
      };

      this.adminBookService.createBook(payload).subscribe({
        next: (created) => {
          this.toastService.success(`Book ${created.book_id} created successfully.`);
          this.closeModal();
          this.loadBooks(1);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.error(this.errorService.getErrorMessage(err));
        }
      });
    }
  }

  togglePublish(book: BackendBook): void {
    const newStatus = !book.publish_on_website;
    this.adminBookService.updateBook(book.book_id, { publish_on_website: newStatus }).subscribe({
      next: () => {
        this.toastService.success(`Book ${book.book_id} is now ${newStatus ? 'Published on Website' : 'Hidden from Website'}.`);
        this.loadBooks(this.currentPage);
      },
      error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
    });
  }

  deleteBook(book: BackendBook): void {
    if (!confirm(`Are you sure you want to delete book ${book.book_id} ("${book.title}")?\nHistorical order records will remain safe.`)) {
      return;
    }

    this.adminBookService.deleteBook(book.book_id).subscribe({
      next: () => {
        this.toastService.success(`Book ${book.book_id} deleted successfully.`);
        this.loadBooks(this.currentPage);
      },
      error: (err) => this.toastService.error(this.errorService.getErrorMessage(err))
    });
  }

  // --- Book Details & History Modal ---
  openDetailsModal(book_id: string): void {
    this.isLoadingDetails.set(true);
    this.isDetailsModalOpen.set(true);

    this.adminBookService.getBookBorrowingHistory(book_id).subscribe({
      next: (data) => {
        this.selectedBookDetails.set(data);
        this.isLoadingDetails.set(false);
      },
      error: (err) => {
        this.isLoadingDetails.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedBookDetails.set(null);
  }

  // --- Multi-step CSV Import Handlers ---
  openCSVModal(): void {
    this.csvStep.set(1);
    this.selectedCSVFile = null;
    this.csvSummary.set(null);
    this.potentialDuplicates.set([]);
    this.isCSVModalOpen.set(true);
  }

  closeCSVModal(): void {
    this.isCSVModalOpen.set(false);
  }

  onCSVFileChange(event: any): void {
    const file: File = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedCSVFile = file;
    } else {
      this.toastService.error('Please select a valid .csv file');
    }
  }

  analyzeCSV(): void {
    if (!this.selectedCSVFile) return;

    this.isAnalyzingCSV.set(true);
    this.adminBookService.importBooksCSV(this.selectedCSVFile, true).subscribe({
      next: (summary) => {
        this.csvSummary.set(summary);
        this.isAnalyzingCSV.set(false);
        this.csvStep.set(2);
      },
      error: (err) => {
        this.isAnalyzingCSV.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  confirmCSVImport(): void {
    if (!this.selectedCSVFile) return;

    this.isAnalyzingCSV.set(true);
    this.adminBookService.importBooksCSV(this.selectedCSVFile, false).subscribe({
      next: (res) => {
        this.isAnalyzingCSV.set(false);
        this.toastService.success(`CSV Import completed! ${res.imported} books added successfully.`);
        this.closeCSVModal();
        this.loadBooks(1);
      },
      error: (err) => {
        this.isAnalyzingCSV.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }
}
