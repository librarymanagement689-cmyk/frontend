import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminBookService, BookCreatePayload, BookUpdatePayload, CSVImportSummaryResponse } from '../../../services/admin-book.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';
import { BackendBook } from '../../../models/book.model';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  ImageTransform
} from 'ngx-image-cropper';

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
  private toastService = inject(ToastService);

  books = signal<BackendBook[]>([]);
  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = 1;
  pageSize = 15;

  // Filters & Sort
  searchQuery = '';
  selectedCategory = '';
  selectedLanguage = '';
  selectedStatus = '';
  selectedPublish: string = '';
  sortBy = 'created_at';
  sortOrder = 'desc';

  isLoading = signal(true);

  selectedImageFile: File | null = null;

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
    title: '',
    author: '',
    price: 0,
    category: 'Fiction',
    language: 'English',
    publish_on_website: true,
    image_url: ''
  };

  categories = ['Fiction', 'Non-Fiction', 'Self Help', 'Spirituality', 'Science', 'History', 'Children'];
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
    this.loadBooks();
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
      this.pageSize
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
    this.bookForm = {
      title: '',
      author: '',
      price: 150,
      category: 'Fiction',
      language: 'English',
      publish_on_website: true,
      image_url: ''
    };
    this.isModalOpen.set(true);
  }

  openEditModal(book: BackendBook): void {
    this.isEditing.set(true);
    this.editingBookId.set(book.book_id);
    this.bookForm = {
      title: book.title,
      author: book.author,
      price: book.price,
      category: book.category,
      language: book.language,
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
    if (!this.bookForm.title || !this.bookForm.author || this.bookForm.price < 0) {
      this.toastService.error('Please enter valid Title, Author, and Price.');
      return;
    }

    this.isLoading.set(true);

    if (this.isEditing() && this.editingBookId()) {
      const payload: BookUpdatePayload = {
        title: this.bookForm.title,
        author: this.bookForm.author,
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
      this.adminBookService.createBook(this.bookForm).subscribe({
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
