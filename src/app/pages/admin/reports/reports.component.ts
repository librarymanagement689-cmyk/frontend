import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService } from '../../../services/admin-dashboard.service';
import { ErrorService } from '../../../services/error.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private dashboardService = inject(AdminDashboardService);
  private errorService = inject(ErrorService);
  private toastService = inject(ToastService);

  activeTab: 'daily' | 'monthly' = 'daily';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedMonth = new Date().toISOString().substring(0, 7);

  dailyReport = signal<any>(null);
  monthlyReport = signal<any>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadDailyReport();
  }

  loadDailyReport(): void {
    this.isLoading.set(true);
    this.dashboardService.getDailyReport(this.selectedDate).subscribe({
      next: (data) => {
        this.dailyReport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  loadMonthlyReport(): void {
    this.isLoading.set(true);
    this.dashboardService.getMonthlyReport(this.selectedMonth).subscribe({
      next: (data) => {
        this.monthlyReport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error(this.errorService.getErrorMessage(err));
      }
    });
  }

  switchTab(tab: 'daily' | 'monthly'): void {
    this.activeTab = tab;
    if (tab === 'daily') this.loadDailyReport();
    else this.loadMonthlyReport();
  }

  exportCSV(): void {
    let csvContent = '';
    let filename = '';

    if (this.activeTab === 'daily' && this.dailyReport()) {
      filename = `daily_report_${this.selectedDate}.csv`;
      csvContent = `Date,Total Orders,Books Issued,Total Collection (INR)\n`;
      csvContent += `${this.selectedDate},${this.dailyReport().total_orders},${this.dailyReport().total_books_issued},${this.dailyReport().total_collection}\n\n`;
      csvContent += `Order ID,Member ID,Books,Subtotal,Amount Paid,Status\n`;
      (this.dailyReport().orders || []).forEach((o: any) => {
        const bookTitles = (o.items || []).map((i: any) => i.title).join(' | ');
        csvContent += `"${o.order_id}","${o.member_id}","${bookTitles}",${o.subtotal},${o.amount_paid},"${o.status}"\n`;
      });
    } else if (this.activeTab === 'monthly' && this.monthlyReport()) {
      filename = `monthly_report_${this.selectedMonth}.csv`;
      csvContent = `Month,Total Orders,Books Issued,Total Revenue (INR)\n`;
      csvContent += `${this.selectedMonth},${this.monthlyReport().total_orders},${this.monthlyReport().total_books_issued},${this.monthlyReport().total_revenue}\n`;
    }

    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success(`Report exported as ${filename}`);
  }
}
